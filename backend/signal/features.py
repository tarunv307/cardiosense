"""
Feature Extraction for ECG Rhythm Screening.
Extracts clinically grounded time-domain, frequency-domain, and morphological metrics
for rhythm classification and explainable evidence generation.
"""

import numpy as np
from scipy import signal
from typing import List, Optional
from backend.core.schemas import FeatureSet, BeatSegmentation


def extract_ecg_features(
    ecg_signal: np.ndarray,
    beat_data: BeatSegmentation,
    sampling_rate: float
) -> FeatureSet:
    """
    Extracts time-domain HRV, frequency-domain HRV, and morphological features.
    """
    r_peaks = beat_data.r_peaks
    if len(r_peaks) < 2:
        return FeatureSet(
            mean_rr_ms=0.0,
            median_rr_ms=0.0,
            sdnn_ms=0.0,
            rmssd_ms=0.0,
            pnn50_percent=0.0,
            rr_cv_percent=0.0,
            qrs_width_mean_ms=80.0,
            r_peak_amplitude_mean_mv=0.0,
            spectral_entropy=0.0,
            lf_hf_ratio=1.0,
            top_contributing_features={}
        )

    rr_vals = [p.rr_interval_ms for p in r_peaks if p.rr_interval_ms is not None]
    if not rr_vals:
        rr_vals = [800.0]

    rr_arr = np.array(rr_vals)
    mean_rr = float(np.mean(rr_arr))
    median_rr = float(np.median(rr_arr))
    sdnn = float(np.std(rr_arr))
    rr_diffs = np.diff(rr_arr)
    rmssd = float(np.sqrt(np.mean(rr_diffs ** 2))) if len(rr_diffs) > 0 else 0.0

    pnn50 = float((np.sum(np.abs(rr_diffs) > 50.0) / len(rr_diffs)) * 100.0) if len(rr_diffs) > 0 else 0.0
    rr_cv = float((sdnn / (mean_rr + 1e-6)) * 100.0)

    # Morphological: QRS width estimate
    # Estimate QRS width by measuring zero-crossings or inflection points around R peaks
    qrs_widths = []
    r_amplitudes = []
    half_win = int(0.080 * sampling_rate)

    for p in r_peaks:
        r_amplitudes.append(p.amplitude_mv)
        idx = p.sample_index
        left = max(0, idx - half_win)
        right = min(len(ecg_signal), idx + half_win)
        window = ecg_signal[left:right]
        if len(window) > 4:
            # Width at 30% of peak height
            baseline = np.median(window)
            peak_h = ecg_signal[idx] - baseline
            thresh = baseline + 0.3 * peak_h
            above_thresh = np.where(window > thresh)[0]
            if len(above_thresh) > 1:
                width_samples = above_thresh[-1] - above_thresh[0]
                qrs_widths.append((width_samples / sampling_rate) * 1000.0)

    qrs_width_mean = float(np.mean(qrs_widths)) if qrs_widths else 85.0
    r_peak_amp_mean = float(np.mean(r_amplitudes)) if r_amplitudes else 1.0

    # Spectral Entropy in 0.5 - 40 Hz band
    freqs, psd = signal.welch(ecg_signal, fs=sampling_rate, nperseg=min(len(ecg_signal), int(sampling_rate * 4)))
    band_mask = (freqs >= 0.5) & (freqs <= 40.0)
    psd_band = psd[band_mask]
    psd_norm = psd_band / (np.sum(psd_band) + 1e-12)
    spectral_entropy = float(-np.sum(psd_norm * np.log2(psd_norm + 1e-12)))

    # LF / HF Ratio
    lf_mask = (freqs >= 0.04) & (freqs < 0.15)
    hf_mask = (freqs >= 0.15) & (freqs <= 0.40)
    lf_power = np.sum(psd[lf_mask])
    hf_power = np.sum(psd[hf_mask])
    lf_hf = float(lf_power / (hf_power + 1e-9)) if hf_power > 0 else 1.2
    lf_hf = float(np.clip(lf_hf, 0.1, 10.0))

    # Evidence feature attribution weights
    top_contributions = {
        "RR Coefficient of Variation": round(rr_cv, 2),
        "Root Mean Sq Successive Diff (RMSSD)": round(rmssd, 1),
        "Mean Heart Rate": round(60000.0 / (mean_rr + 1e-6), 1),
        "QRS Duration (Mean)": round(qrs_width_mean, 1),
        "Interval Irregularity Ratio (pNN50)": round(pnn50, 1),
        "Spectral Entropy": round(spectral_entropy, 2),
    }

    return FeatureSet(
        mean_rr_ms=round(mean_rr, 1),
        median_rr_ms=round(median_rr, 1),
        sdnn_ms=round(sdnn, 1),
        rmssd_ms=round(rmssd, 1),
        pnn50_percent=round(pnn50, 1),
        rr_cv_percent=round(rr_cv, 2),
        qrs_width_mean_ms=round(qrs_width_mean, 1),
        r_peak_amplitude_mean_mv=round(r_peak_amp_mean, 3),
        spectral_entropy=round(spectral_entropy, 2),
        lf_hf_ratio=round(lf_hf, 2),
        top_contributing_features=top_contributions
    )

