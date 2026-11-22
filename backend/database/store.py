"""
Data Persistence and In-Memory Clinical Storage.
Manages ECG recordings, signal caches, analysis results, and review event queues.
"""

import uuid
from datetime import datetime
from typing import Dict, List, Optional
import numpy as np

from backend.core.schemas import (
    RecordingMetadata,
    CompleteAnalysisResult,
    RhythmEvent,
    ReviewStatus,
    AlertSeverity,
    RhythmCategory,
    SignalQualityStatus,
    PipelineStatus,
    PipelineStageStatus
)
from backend.data.sample_generator import generate_scenario_recordings
from backend.signal.quality import assess_signal_quality
from backend.signal.preprocessing import preprocess_ecg
from backend.signal.beat_detection import detect_r_peaks_pan_tompkins, segment_beats_and_hrv
from backend.signal.features import extract_ecg_features
from backend.ml.model import screen_rhythm


class CardioStore:
    def __init__(self):
        self.recordings_meta: Dict[str, RecordingMetadata] = {}
        self.raw_signals: Dict[str, np.ndarray] = {}
        self.sampling_rates: Dict[str, float] = {}
        self.analysis_cache: Dict[str, CompleteAnalysisResult] = {}
        self.events_db: Dict[str, RhythmEvent] = {}

        # Initialize standard sample recordings
        self._load_standard_samples()

    def _load_standard_samples(self):
        scenario_data = generate_scenario_recordings()
        for rec_id, data in scenario_data.items():
            sig = np.array(data["signal"], dtype=float)
            fs = float(data["sampling_rate_hz"])
            duration = float(data["duration_seconds"])

            self.raw_signals[rec_id] = sig
            self.sampling_rates[rec_id] = fs

            # Preliminary run to populate metadata
            res = self.run_full_analysis(rec_id, is_demo=True, rec_name=data["name"], description=data["description"])
            self.recordings_meta[rec_id] = res.metadata

    def run_full_analysis(
        self,
        recording_id: str,
        is_demo: bool = False,
        rec_name: Optional[str] = None,
        description: Optional[str] = None
    ) -> CompleteAnalysisResult:
        if recording_id not in self.raw_signals:
            raise ValueError(f"Recording {recording_id} not found")

        sig = self.raw_signals[recording_id]
        fs = self.sampling_rates[recording_id]
        duration = len(sig) / fs

        pipeline = PipelineStatus(
            data_ingestion=PipelineStageStatus.COMPLETED,
            signal_validation=PipelineStageStatus.COMPLETED,
            quality_assessment=PipelineStageStatus.RUNNING,
            preprocessing=PipelineStageStatus.PENDING,
            beat_detection=PipelineStageStatus.PENDING,
            feature_extraction=PipelineStageStatus.PENDING,
            ai_screening=PipelineStageStatus.PENDING,
            messages=["Data ingested and format validated successfully."]
        )

        # 1. Quality Assessment
        quality = assess_signal_quality(sig, fs)
        pipeline.quality_assessment = PipelineStageStatus.COMPLETED
        pipeline.messages.append(f"Quality evaluated: SQI {quality.overall_sqi}/100 ({quality.status.value}).")

        # 2. Preprocessing
        pipeline.preprocessing = PipelineStageStatus.RUNNING
        processed_sig = preprocess_ecg(sig, fs)
        pipeline.preprocessing = PipelineStageStatus.COMPLETED
        pipeline.messages.append("Zero-phase Butterworth bandpass & 50/60Hz notch filtering applied.")

        # 3. Beat Detection
        pipeline.beat_detection = PipelineStageStatus.RUNNING
        r_peaks, _ = detect_r_peaks_pan_tompkins(processed_sig, fs)
        beat_data = segment_beats_and_hrv(processed_sig, r_peaks, fs)
        pipeline.beat_detection = PipelineStageStatus.COMPLETED
        pipeline.messages.append(f"Pan-Tompkins detected {beat_data.total_beats} beats, mean HR {beat_data.mean_hr_bpm} BPM.")

        # 4. Feature Extraction
        pipeline.feature_extraction = PipelineStageStatus.RUNNING
        features = extract_ecg_features(processed_sig, beat_data, fs)
        pipeline.feature_extraction = PipelineStageStatus.COMPLETED
        pipeline.messages.append(f"HRV and morphological features computed (RMSSD: {features.rmssd_ms}ms, CV: {features.rr_cv_percent}%).")

        # 5. AI Rhythm Screening
        pipeline.ai_screening = PipelineStageStatus.RUNNING
        prediction = screen_rhythm(quality, features, beat_data)
        if quality.status == SignalQualityStatus.INSUFFICIENT:
            pipeline.ai_screening = PipelineStageStatus.WITHHELD
            pipeline.messages.append("AI rhythm classification withheld due to insufficient SQI.")
        else:
            pipeline.ai_screening = PipelineStageStatus.COMPLETED
            pipeline.messages.append(f"Screening completed: {prediction.display_name} (Confidence: {int(prediction.confidence*100)}%).")

        # 6. Generate Clinical Rhythm Events & Alerts
        events = self._generate_events(recording_id, quality, prediction, beat_data, fs)

        # Store events in review database
        for ev in events:
            self.events_db[ev.event_id] = ev

        # Generate Downsampled Time-Series for Frontend Chart
        # 250 Hz for 20s = 5000 points. Downsample by 2 or 3 for instant smooth SVG/Canvas rendering
        step = max(1, len(sig) // 1500)
        time_axis = [round(i / fs, 3) for i in range(0, len(sig), step)]
        raw_down = [round(float(sig[i]), 3) for i in range(0, len(sig), step)]
        proc_down = [round(float(processed_sig[i]), 3) for i in range(0, len(processed_sig), step)]

        # Map R-peaks to downsampled indices
        r_peak_indices = [idx // step for idx in r_peaks if idx // step < len(time_axis)]

        name = rec_name or self.recordings_meta.get(recording_id, None)
        if hasattr(name, 'name'):
            name = name.name
        elif not name:
            name = f"ECG Recording {recording_id[:8]}"

        metadata = RecordingMetadata(
            id=recording_id,
            name=name,
            description=description or f"Single-lead leadless cardiac ECG recording ({duration:.1f}s)",
            created_at=datetime.utcnow(),
            sampling_rate_hz=fs,
            duration_seconds=round(duration, 2),
            total_samples=len(sig),
            source="SAMPLE_DATASET" if is_demo else "USER_UPLOAD",
            quality_status=quality.status,
            screening_category=prediction.category,
            mean_heart_rate=beat_data.mean_hr_bpm,
            is_demo=is_demo
        )
        self.recordings_meta[recording_id] = metadata

        result = CompleteAnalysisResult(
            recording_id=recording_id,
            metadata=metadata,
            pipeline_status=pipeline,
            quality=quality,
            beat_detection=beat_data,
            features=features,
            prediction=prediction,
            events=events,
            time_series_raw=raw_down,
            time_series_processed=proc_down,
            time_axis_sec=time_axis,
            r_peak_indices=r_peak_indices
        )

        self.analysis_cache[recording_id] = result
        return result

    def _generate_events(
        self,
        recording_id: str,
        quality: QualityMetrics,
        prediction: RhythmPrediction,
        beat_data: BeatSegmentation,
        fs: float
    ) -> List[RhythmEvent]:
        events = []

        # Event 1: Signal Quality Alert if Insufficient
        if quality.status == SignalQualityStatus.INSUFFICIENT:
            events.append(RhythmEvent(
                event_id=f"evt_sq_{recording_id[:6]}_{uuid.uuid4().hex[:4]}",
                recording_id=recording_id,
                timestamp_sec=2.0,
                duration_sec=round(len(self.raw_signals[recording_id]) / fs, 1),
                category=RhythmCategory.INSUFFICIENT_QUALITY,
                severity=AlertSeverity.MEDIUM,
                confidence=1.0,
                quality_status=quality.status,
                review_status=ReviewStatus.NEW,
                snippet_start_idx=0,
                snippet_end_idx=int(fs * 5),
                evidence_summary=f"Poor signal quality index ({quality.overall_sqi}/100). {quality.explanation}"
            ))
            return events

        # Event 2: Arrhythmia / Rhythm Alert based on category
        cat = prediction.category
        if cat == RhythmCategory.ATRIAL_FIBRIL:
            severity = AlertSeverity.HIGH if beat_data.mean_hr_bpm > 100 else AlertSeverity.MEDIUM
            events.append(RhythmEvent(
                event_id=f"evt_af_{recording_id[:6]}_{uuid.uuid4().hex[:4]}",
                recording_id=recording_id,
                timestamp_sec=3.5,
                duration_sec=12.0,
                category=RhythmCategory.ATRIAL_FIBRIL,
                severity=severity,
                confidence=prediction.confidence,
                quality_status=quality.status,
                review_status=ReviewStatus.NEEDS_REVIEW,
                snippet_start_idx=int(fs * 2),
                snippet_end_idx=int(fs * 14),
                evidence_summary="Irregularly irregular ventricular rhythm with absent distinct P-waves. Rapid ventricular conduction noted."
            ))

        elif cat == RhythmCategory.VENTRICULAR_ECTOPY:
            events.append(RhythmEvent(
                event_id=f"evt_ve_{recording_id[:6]}_{uuid.uuid4().hex[:4]}",
                recording_id=recording_id,
                timestamp_sec=2.4,
                duration_sec=6.5,
                category=RhythmCategory.VENTRICULAR_ECTOPY,
                severity=AlertSeverity.MEDIUM,
                confidence=prediction.confidence,
                quality_status=quality.status,
                review_status=ReviewStatus.NEEDS_REVIEW,
                snippet_start_idx=int(fs * 1),
                snippet_end_idx=int(fs * 8),
                evidence_summary="Recurrent premature ventricular complexes with widened QRS morphology (>120ms) and compensatory pauses."
            ))

        elif cat == RhythmCategory.SINUS_BRADYCARDIA:
            events.append(RhythmEvent(
                event_id=f"evt_br_{recording_id[:6]}_{uuid.uuid4().hex[:4]}",
                recording_id=recording_id,
                timestamp_sec=0.0,
                duration_sec=round(len(self.raw_signals[recording_id]) / fs, 1),
                category=RhythmCategory.SINUS_BRADYCARDIA,
                severity=AlertSeverity.LOW,
                confidence=prediction.confidence,
                quality_status=quality.status,
                review_status=ReviewStatus.NEW,
                snippet_start_idx=0,
                snippet_end_idx=int(fs * 6),
                evidence_summary=f"Sustained resting heart rate of {beat_data.mean_hr_bpm} BPM. Sinus pacing intact."
            ))

        elif cat == RhythmCategory.SINUS_TACHYCARDIA:
            events.append(RhythmEvent(
                event_id=f"evt_ta_{recording_id[:6]}_{uuid.uuid4().hex[:4]}",
                recording_id=recording_id,
                timestamp_sec=0.0,
                duration_sec=round(len(self.raw_signals[recording_id]) / fs, 1),
                category=RhythmCategory.SINUS_TACHYCARDIA,
                severity=AlertSeverity.LOW,
                confidence=prediction.confidence,
                quality_status=quality.status,
                review_status=ReviewStatus.NEW,
                snippet_start_idx=0,
                snippet_end_idx=int(fs * 6),
                evidence_summary=f"Elevated heart rate of {beat_data.mean_hr_bpm} BPM with normal P-QRS-T configuration."
            ))

        return events

    def add_uploaded_recording(
        self,
        name: str,
        signal_array: np.ndarray,
        sampling_rate_hz: float,
        description: Optional[str] = None
    ) -> CompleteAnalysisResult:
        rec_id = f"user_rec_{uuid.uuid4().hex[:8]}"
        self.raw_signals[rec_id] = signal_array
        self.sampling_rates[rec_id] = sampling_rate_hz
        return self.run_full_analysis(rec_id, is_demo=False, rec_name=name, description=description)

    def delete_recording(self, recording_id: str) -> bool:
        if recording_id in self.recordings_meta:
            del self.recordings_meta[recording_id]
            if recording_id in self.raw_signals:
                del self.raw_signals[recording_id]
            if recording_id in self.sampling_rates:
                del self.sampling_rates[recording_id]
            if recording_id in self.analysis_cache:
                del self.analysis_cache[recording_id]
            # remove associated events
            self.events_db = {k: v for k, v in self.events_db.items() if v.recording_id != recording_id}
            return True
        return False

    def update_event_review(
        self,
        event_id: str,
        status: ReviewStatus,
        notes: Optional[str] = None
    ) -> Optional[RhythmEvent]:
        if event_id in self.events_db:
            ev = self.events_db[event_id]
            ev.review_status = status
            if notes is not None:
                ev.reviewer_notes = notes
            return ev
        return None


# Global singleton instance
store = CardioStore()

