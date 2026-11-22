"""
Pydantic data models and schemas for CardioSense.
Defines types for ECG signals, quality assessment, beat detection,
features, rhythm classification, alerts, and evaluation metrics.
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class SignalQualityStatus(str, Enum):
    GOOD = "GOOD"
    NEEDS_REVIEW = "NEEDS REVIEW"
    INSUFFICIENT = "INSUFFICIENT"


class RhythmCategory(str, Enum):
    NORMAL_SINUS = "NORMAL_SINUS_RHYTHM"
    ATRIAL_FIBRIL = "ATRIAL_FIBRIL"
    SINUS_BRADYCARDIA = "SINUS_BRADYCARDIA"
    SINUS_TACHYCARDIA = "SINUS_TACHYCARDIA"
    VENTRICULAR_ECTOPY = "VENTRICULAR_ECTOPY"
    INSUFFICIENT_QUALITY = "INSUFFICIENT_QUALITY"


class ReviewStatus(str, Enum):
    NEW = "NEW"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    REVIEWED = "REVIEWED"
    DISMISSED = "DISMISSED"


class AlertSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class QualityMetrics(BaseModel):
    overall_sqi: float = Field(..., ge=0.0, le=100.0, description="Overall Signal Quality Index (0-100)")
    status: SignalQualityStatus
    snr_db: float = Field(..., description="Estimated Signal-to-Noise Ratio in dB")
    baseline_wander_ratio: float = Field(..., description="Proportion of low-frequency wander vs total energy")
    high_freq_noise_ratio: float = Field(..., description="Proportion of EMG / powerline high-frequency noise")
    flatline_percentage: float = Field(..., description="Percentage of signal identified as flatline or clipping")
    missing_samples_count: int = Field(0, description="Count of detected missing or NaN samples")
    explanation: str = Field(..., description="Human-readable clinical rationale for the quality assessment")
    is_reliable_for_ai: bool = Field(..., description="Whether the signal meets standards for downstream AI screening")


class RPeak(BaseModel):
    sample_index: int
    timestamp_sec: float
    amplitude_mv: float
    rr_interval_ms: Optional[float] = None
    is_ectopic: bool = False


class BeatSegmentation(BaseModel):
    total_beats: int
    mean_hr_bpm: float
    min_hr_bpm: float
    max_hr_bpm: float
    hrv_sdnn_ms: float
    hrv_rmssd_ms: float
    hrv_pnn50_percent: float
    r_peaks: List[RPeak]


class FeatureSet(BaseModel):
    mean_rr_ms: float
    median_rr_ms: float
    sdnn_ms: float
    rmssd_ms: float
    pnn50_percent: float
    rr_cv_percent: float  # Coefficient of variation (RR std / RR mean)
    qrs_width_mean_ms: float
    r_peak_amplitude_mean_mv: float
    spectral_entropy: float
    lf_hf_ratio: Optional[float] = None
    top_contributing_features: Dict[str, float] = {}


class RhythmPrediction(BaseModel):
    category: RhythmCategory
    display_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    uncertainty_score: float = Field(..., ge=0.0, le=1.0, description="Epistemic/aleatoric uncertainty estimate")
    is_uncertain: bool
    model_version: str
    probabilities: Dict[str, float]
    clinical_evidence: List[str]
    safety_disclaimer: str = "CardioSense is a screening Proof of Concept and not a diagnostic device. Clinical review is required."


class PipelineStageStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    WITHHELD = "WITHHELD"


class PipelineStatus(BaseModel):
    data_ingestion: PipelineStageStatus
    signal_validation: PipelineStageStatus
    quality_assessment: PipelineStageStatus
    preprocessing: PipelineStageStatus
    beat_detection: PipelineStageStatus
    feature_extraction: PipelineStageStatus
    ai_screening: PipelineStageStatus
    messages: List[str] = []


class RhythmEvent(BaseModel):
    event_id: str
    recording_id: str
    timestamp_sec: float
    duration_sec: float
    category: RhythmCategory
    severity: AlertSeverity
    confidence: float
    quality_status: SignalQualityStatus
    review_status: ReviewStatus
    reviewer_notes: Optional[str] = None
    snippet_start_idx: int
    snippet_end_idx: int
    evidence_summary: str


class RecordingMetadata(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    sampling_rate_hz: float
    duration_seconds: float
    total_samples: int
    source: str  # "SAMPLE_DATASET" or "USER_UPLOAD"
    quality_status: SignalQualityStatus
    screening_category: Optional[RhythmCategory] = None
    mean_heart_rate: Optional[float] = None
    is_demo: bool = False


class CompleteAnalysisResult(BaseModel):
    recording_id: str
    metadata: RecordingMetadata
    pipeline_status: PipelineStatus
    quality: QualityMetrics
    beat_detection: Optional[BeatSegmentation] = None
    features: Optional[FeatureSet] = None
    prediction: Optional[RhythmPrediction] = None
    events: List[RhythmEvent] = []
    # Signal previews (downsampled for lightweight transfer)
    time_series_raw: List[float] = []
    time_series_processed: List[float] = []
    time_axis_sec: List[float] = []
    r_peak_indices: List[int] = []

