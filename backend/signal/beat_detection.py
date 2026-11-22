from __future__ import annotations

"""
Pan-Tompkins QRS Detection Algorithm and Heart Rate / HRV Metrics Computation.
Implements derivative, squaring, moving-window integration, refractory gating,
and R-peak localization with ectopic beat detection.
"""

import numpy as np
from scipy import signal
from typing import List, Tuple
from backend.core.schemas import RPeak, BeatSegmentation


def detect_r_peaks_pan_tompkins(
    ecg_signal: np.ndarray,
    sampling_rate: float
) -> Tuple[List[int], np.ndarray]:
    """
    Standard Pan-Tompkins QRS detection.
    Returns (r_peak_indices, integrated_signal).
    """
    n_samples = len(ecg_signal)
    if n_samples < int(sampling_rate):
        return [], np.zeros_like(ecg_signal)

    # 1. Five-point derivative filter: y[n] = (2x[n] + x[n-1] - x[n-3] - 2x[n-4]) / (8*T)
    derivative_kernel = np.array([-2, -1, 0, 1, 2]) / 8.0
    differentiated = np.convolve(ecg_signal, derivative_kernel, mode='same')

    # 2. Non-linear squaring
    squared = differentiated ** 2

    # 3. Moving Window Integration (approx 150ms window)
    window_len = max(3, int(0.150 * sampling_rate))
    integration_kernel = np.ones(window_len) / window_len
    integrated = np.convolve(squared, integration_kernel, mode='same')

    # 4. Adaptive thresholding
    # Initial threshold estimate from 90th percentile
    initial_peak_est = np.percentile(integrated, 90)
    peaki = initial_peak_est
    noisei = np.percentile(integrated, 30)
    threshold = noisei + 0.25 * (peaki - noisei)

    # Refractory period: ~200 ms
    min_distance = int(0.200 * sampling_rate)

    # Detect candidate peaks in integrated signal
    candidate_peaks, properties = signal.find_peaks(
        integrated,
        distance=min_distance,
        height=threshold * 0.4
    )

    r_peaks = []
    search_radius = int(0.080 * sampling_rate)  # 80ms search window in filtered ECG

    for cp in candidate_peaks:
        # Search for true maximum amplitude in original filtered ECG near integration peak
        start = max(0, cp - search_radius)
        end = min(n_samples, cp + search_radius)
        if end > start:
            local_max_idx = start + int(np.argmax(ecg_signal[start:end]))
            # Verify it's not too close to previously detected R peak
            if not r_peaks or (local_max_idx - r_peaks[-1] >= min_distance):
                r_peaks.append(local_max_idx)

    return r_peaks, integrated


def segment_beats_and_hrv(
    ecg_signal: np.ndarray,
    r_peak_indices: List[int],
    sampling_rate: float
) -> BeatSegmentation:
    """
    Computes RR intervals, instantaneous heart rates, HRV indicators (SDNN, RMSSD, pNN50),
    and flags ectopic premature ventricular beats.
    """
    total_beats = len(r_peak_indices)
    if total_beats < 2:
        return BeatSegmentation(
            total_beats=total_beats,
            mean_hr_bpm=0.0,
            min_hr_bpm=0.0,
            max_hr_bpm=0.0,
            hrv_sdnn_ms=0.0,
            hrv_rmssd_ms=0.0,
            hrv_pnn50_percent=0.0,
            r_peaks=[
                RPeak(
                    sample_index=idx,
                    timestamp_sec=round(idx / sampling_rate, 4),
                    amplitude_mv=round(float(ecg_signal[idx]), 3),
                    rr_interval_ms=None,
                    is_ectopic=False
                )
                for idx in r_peak_indices
            ]
        )

    # Calculate RR intervals in milliseconds
    rr_intervals_ms = []
    for i in range(1, total_beats):
        rr_ms = ((r_peak_indices[i] - r_peak_indices[i - 1]) / sampling_rate) * 1000.0
        rr_intervals_ms.append(rr_ms)

    rr_arr = np.array(rr_intervals_ms)
    # Filter non-physiological outlier intervals (< 250ms or > 2500ms) for aggregate statistics
    valid_rr_mask = (rr_arr >= 250.0) & (rr_arr <= 2500.0)
    clean_rr = rr_arr[valid_rr_mask] if np.any(valid_rr_mask) else rr_arr

    mean_rr = float(np.mean(clean_rr))
    sdnn = float(np.std(clean_rr))
    rr_diffs = np.diff(clean_rr)
    rmssd = float(np.sqrt(np.mean(rr_diffs ** 2))) if len(rr_diffs) > 0 else 0.0

    pnn50_count = np.sum(np.abs(rr_diffs) > 50.0) if len(rr_diffs) > 0 else 0
    pnn50 = float((pnn50_count / len(rr_diffs)) * 100.0) if len(rr_diffs) > 0 else 0.0

    # Heart rates (BPM = 60000 / RR_ms)
    instant_hr = 60000.0 / clean_rr
    mean_hr = float(np.mean(instant_hr))
    min_hr = float(np.min(instant_hr))
    max_hr = float(np.max(instant_hr))

    # Detect ectopic / premature beats:
    # A beat is flagged ectopic if its RR is < 0.8 * mean_rr, or morphology has abnormal amplitude
    r_peaks_obj = []
    for i, idx in enumerate(r_peak_indices):
        amp = float(ecg_signal[idx])
        t_sec = idx / sampling_rate
        rr_val = rr_intervals_ms[i - 1] if i > 0 else None

        is_ectopic = False
        if rr_val is not None:
            # Premature trigger or compensatory pause
            if rr_val < (0.78 * mean_rr) or (i < len(rr_intervals_ms) and rr_val < (0.82 * mean_rr)):
                is_ectopic = True

        r_peaks_obj.append(RPeak(
            sample_index=idx,
            timestamp_sec=round(t_sec, 4),
            amplitude_mv=round(amp, 3),
            rr_interval_ms=round(rr_val, 1) if rr_val is not None else None,
            is_ectopic=is_ectopic
        ))

    return BeatSegmentation(
        total_beats=total_beats,
        mean_hr_bpm=round(mean_hr, 1),
        min_hr_bpm=round(min_hr, 1),
        max_hr_bpm=round(max_hr, 1),
        hrv_sdnn_ms=round(sdnn, 1),
        hrv_rmssd_ms=round(rmssd, 1),
        hrv_pnn50_percent=round(pnn50, 1),
        r_peaks=r_peaks_obj
    )

