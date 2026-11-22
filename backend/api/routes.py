from __future__ import annotations

"""
CardioSense REST API Endpoints.
Provides endpoints for recordings management, ECG file ingestion,
pipeline execution, signal quality intelligence, AI rhythm screening,
alert review workflows, and model benchmark evaluation.
"""

import io
import json
import os
import numpy as np
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.core.schemas import (
    RecordingMetadata,
    CompleteAnalysisResult,
    RhythmEvent,
    ReviewStatus,
    PipelineStatus
)
from backend.database.store import store
from backend.ml.evaluation import get_model_evaluation_metrics

router = APIRouter(prefix="/api")


# --- Recordings Endpoints ---

@router.get("/recordings", response_model=List[RecordingMetadata])
def get_all_recordings():
    """Returns metadata for all available ECG recordings."""
    return list(store.recordings_meta.values())


@router.get("/recordings/sample-files/{filename}")
def download_sample_file(filename: str):
    """Downloads a pre-formatted benchmark ECG CSV file for testing."""
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "samples")
    file_path = os.path.join(sample_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample file not found")
    return FileResponse(file_path, media_type="text/csv", filename=filename)


@router.get("/recordings/{recording_id}", response_model=RecordingMetadata)
def get_recording(recording_id: str):
    """Returns metadata for a specific recording."""
    if recording_id not in store.recordings_meta:
        raise HTTPException(status_code=404, detail="Recording not found")
    return store.recordings_meta[recording_id]


@router.delete("/recordings/{recording_id}")
def delete_recording(recording_id: str):
    """Deletes a recording and its associated analysis and events."""
    success = store.delete_recording(recording_id)
    if not success:
        raise HTTPException(status_code=404, detail="Recording not found")
    return {"status": "success", "message": f"Recording {recording_id} deleted."}


@router.post("/recordings/upload", response_model=CompleteAnalysisResult)
async def upload_recording(
    file: UploadFile = File(...),
    sampling_rate_hz: float = Form(250.0),
    signal_column: Optional[str] = Form(None),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None)
):
    """
    Parses and ingests an uploaded ECG file (CSV, JSON, or TXT).
    Validates sampling rate and extracts the numerical voltage signal.
    """
    if sampling_rate_hz <= 0:
        raise HTTPException(status_code=400, detail="Sampling frequency must be greater than 0 Hz.")

    contents = await file.read()
    filename = file.filename or "uploaded_ecg.csv"
    rec_name = name or filename

    try:
        if filename.endswith(".json"):
            data = json.loads(contents.decode("utf-8"))
            if isinstance(data, list):
                signal_arr = np.array(data, dtype=float)
            elif isinstance(data, dict):
                # Search for known signal keys
                key = signal_column or next((k for k in ["signal", "ecg", "voltage", "data", "lead_I", "val"] if k in data), None)
                if not key:
                    raise HTTPException(status_code=400, detail="Could not identify ECG signal array in JSON keys.")
                signal_arr = np.array(data[key], dtype=float)
            else:
                raise HTTPException(status_code=400, detail="Invalid JSON structure.")

        elif filename.endswith(".txt"):
            text_lines = contents.decode("utf-8").strip().splitlines()
            values = []
            for line in text_lines:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                # Split by space, tab, or comma
                parts = line.replace(",", " ").split()
                if parts:
                    try:
                        # Take last column or specified
                        values.append(float(parts[-1]))
                    except ValueError:
                        continue
            signal_arr = np.array(values, dtype=float)

        else:
            # Assume CSV
            df = pd.read_csv(io.BytesIO(contents))
            if df.empty:
                raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

            # Select column
            if signal_column and signal_column in df.columns:
                target_col = signal_column
            else:
                # Heuristically pick first numeric column that isn't named timestamp/time/index
                non_time_cols = [c for c in df.columns if not any(t in str(c).lower() for t in ["time", "index", "id", "sample"])]
                candidate_col = non_time_cols[0] if non_time_cols else df.columns[0]
                target_col = candidate_col

            signal_arr = pd.to_numeric(df[target_col], errors='coerce').to_numpy(dtype=float)

        if len(signal_arr) < int(sampling_rate_hz * 2):
            raise HTTPException(status_code=400, detail="ECG recording too short (less than 2 seconds of data).")

        # Ingest into store and run full automated pipeline
        result = store.add_uploaded_recording(
            name=rec_name,
            signal_array=signal_arr,
            sampling_rate_hz=sampling_rate_hz,
            description=description or f"User-uploaded ECG recording parsed from {filename} ({len(signal_arr)/sampling_rate_hz:.1f}s)"
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process ECG file: {str(e)}")


# --- Analysis Endpoints ---

@router.get("/analysis/{recording_id}", response_model=CompleteAnalysisResult)
def get_analysis_result(recording_id: str):
    """Retrieves full analysis results, SQI, beat detections, and AI predictions."""
    if recording_id not in store.raw_signals:
        raise HTTPException(status_code=404, detail="Recording not found")

    if recording_id in store.analysis_cache:
        return store.analysis_cache[recording_id]

    return store.run_full_analysis(recording_id)


@router.post("/analysis/{recording_id}", response_model=CompleteAnalysisResult)
def trigger_analysis(recording_id: str):
    """Re-executes the complete processing and screening pipeline on a recording."""
    if recording_id not in store.raw_signals:
        raise HTTPException(status_code=404, detail="Recording not found")

    return store.run_full_analysis(recording_id)


@router.get("/analysis/{recording_id}/status", response_model=PipelineStatus)
def get_pipeline_status(recording_id: str):
    """Retrieves the status of each stage in the processing pipeline."""
    if recording_id not in store.analysis_cache:
        if recording_id in store.raw_signals:
            store.run_full_analysis(recording_id)
        else:
            raise HTTPException(status_code=404, detail="Recording not found")
    return store.analysis_cache[recording_id].pipeline_status


# --- Alerts and Event Review Endpoints ---

@router.get("/alerts", response_model=List[RhythmEvent])
def get_alerts():
    """Returns prioritized rhythm alerts across all ingested recordings."""
    return list(store.events_db.values())


class EventReviewRequest(BaseModel):
    status: ReviewStatus
    reviewer_notes: Optional[str] = None


@router.post("/alerts/{event_id}/review", response_model=RhythmEvent)
def review_alert(event_id: str, payload: EventReviewRequest):
    """Updates review status and clinician audit notes for a specific alert."""
    updated = store.update_event_review(event_id, payload.status, payload.reviewer_notes)
    if not updated:
        raise HTTPException(status_code=404, detail="Alert event not found")
    return updated


# --- Model Evaluation & Analytics Endpoints ---

@router.get("/models/evaluation")
def get_evaluation():
    """Returns model benchmark evaluation metrics, confusion matrix, and class metrics."""
    return get_model_evaluation_metrics()


@router.get("/analytics/overview")
def get_analytics_overview():
    """Returns aggregate summary statistics across all recordings in the library."""
    recs = list(store.recordings_meta.values())
    total_recs = len(recs)
    good_quality = sum(1 for r in recs if r.quality_status.value == "GOOD")
    needs_review = sum(1 for r in recs if r.quality_status.value == "NEEDS REVIEW")
    insufficient = sum(1 for r in recs if r.quality_status.value == "INSUFFICIENT")

    events = list(store.events_db.values())
    pending_reviews = sum(1 for e in events if e.review_status in [ReviewStatus.NEW, ReviewStatus.NEEDS_REVIEW])
    reviewed_events = sum(1 for e in events if e.review_status == ReviewStatus.REVIEWED)

    # Rhythm distribution
    categories = {}
    for r in recs:
        cat = r.screening_category.value if r.screening_category else "UNCLASSIFIED"
        categories[cat] = categories.get(cat, 0) + 1

    return {
        "total_recordings": total_recs,
        "quality_distribution": {
            "GOOD": good_quality,
            "NEEDS_REVIEW": needs_review,
            "INSUFFICIENT": insufficient
        },
        "rhythm_distribution": categories,
        "total_alerts": len(events),
        "pending_reviews": pending_reviews,
        "reviewed_events": reviewed_events,
        "system_status": "OPERATIONAL"
    }

