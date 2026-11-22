from __future__ import annotations

"""
Signal Quality Index (SQI) Assessment Module for ECG.
Provides clinically grounded quality estimation, artifact detection,
flatline/clipping identification, baseline drift, and noise characterization.
"""

import numpy as np
from scipy import signal
from typing import Tuple, Dict, Any
from backend.core.schemas import SignalQualityStatus, QualityMetrics


def assess_signal_quality(
    raw_signal: np.ndarray,
    sampling_rate: float
) -> QualityMetrics:
    """
    Evaluates raw ECG data across multiple physical and spectral quality metrics.
    Returns structured QualityMetrics including SQI (0-100), status, SNR, and explanation.
    """
    total_samples = len(raw_signal)
    if total_samples < int(sampling_rate * 2):
        return QualityMetrics(
            overall_sqi=10.0,
            status=SignalQualityStatus.INSUFFICIENT,
            snr_db=-15.0,
            baseline_wander_ratio=0.8,
            high_freq_noise_ratio=0.8,
            flatline_percentage=0.0,
            missing_samples_count=0,
            explanation="Recording duration is too brief (< 2 seconds) to reliably determine rhythm features.",
            is_reliable_for_ai=False
        )

    # 1. Missing / NaN or Inf samples
    invalid_mask = np.isnan(raw_signal) | np.isinf(raw_signal)
    missing_count = int(np.sum(invalid_mask))
    missing_ratio = missing_count / total_samples

    # Replace invalid values for subsequent calculations if minimal
    clean_signal = np.copy(raw_signal)
    if missing_count > 0:
        if missing_ratio > 0.15:
            return QualityMetrics(
                overall_sqi=15.0,
                status=SignalQualityStatus.INSUFFICIENT,
                snr_db=-10.0,
                baseline_wander_ratio=0.5,
                high_freq_noise_ratio=0.5,
                flatline_percentage=0.0,
                missing_samples_count=missing_count,
                explanation=f"Excessive missing or invalid samples detected ({missing_count} samples, {missing_ratio*100:.1f}%). Lead connection lost.",
                is_reliable_for_ai=False
            )
        # Interpolate small missing gaps
        valid_indices = np.where(~invalid_mask)[0]
        invalid_indices = np.where(invalid_mask)[0]
        clean_signal[invalid_indices] = np.interp(invalid_indices, valid_indices, clean_signal[valid_indices])

    # 2. Flatline or Clipping / Saturation Detection
    # Flatline: consecutive differences identical or near-zero
    diffs = np.abs(np.diff(clean_signal))
    flatline_mask = diffs < 1e-4
    flatline_ratio = float(np.sum(flatline_mask) / (total_samples - 1))

    # Clipping: values pegged at max or min
    val_min, val_max = np.min(clean_signal), np.max(clean_signal)
    clipped_mask = (clean_signal == val_min) | (clean_signal == val_max)
    clipping_ratio = float(np.sum(clipped_mask) / total_samples)

    if flatline_ratio > 0.35:
        return QualityMetrics(
            overall_sqi=20.0,
            status=SignalQualityStatus.INSUFFICIENT,
            snr_db=-8.0,
            baseline_wander_ratio=0.1,
            high_freq_noise_ratio=0.2,
            flatline_percentage=round(flatline_ratio * 100, 2),
            missing_samples_count=missing_count,
            explanation="Extensive flatline / lead detachment detected across >35% of recording duration.",
            is_reliable_for_ai=False
        )

    # 3. Spectral Power Distribution Analysis (Welch Periodogram)
    # Physiological ECG band: 0.5 - 40 Hz
    # Baseline wander band: < 0.5 Hz
    # High frequency / EMG noise: > 40 Hz
    freqs, psd = signal.welch(clean_signal, fs=sampling_rate, nperseg=min(total_samples, int(sampling_rate * 4)))
    total_power = np.sum(psd) + 1e-12

    bw_mask = (freqs >= 0.0) & (freqs < 0.5)
    ecg_mask = (freqs >= 0.5) & (freqs <= 40.0)
    hf_mask = (freqs > 40.0)

    bw_power = np.sum(psd[bw_mask])
    ecg_power = np.sum(psd[ecg_mask])
    hf_power = np.sum(psd[hf_mask])

    bw_ratio = float(bw_power / total_power)
    hf_ratio = float(hf_power / total_power)
    qrs_band_ratio = float(ecg_power / total_power)

    # 4. SNR Estimation in dB
    # Signal = energy in 0.5 - 40Hz; Noise = baseline wander + HF noise
    noise_power = bw_power + hf_power + 1e-12
    snr_raw = ecg_power / noise_power
    snr_db = float(10.0 * np.log10(max(snr_raw, 1e-4)))
    snr_db = round(np.clip(snr_db, -20.0, 35.0), 1)

    # 5. Composite SQI Calculation (0 - 100)
    # Penalize high baseline wander, high HF noise, flatlines, and low SNR
    base_sqi = 95.0
    # Penalty for baseline wander (above 15%)
    if bw_ratio > 0.15:
        base_sqi -= min(35.0, (bw_ratio - 0.15) * 60.0)
    # Penalty for high frequency noise (above 10%)
    if hf_ratio > 0.10:
        base_sqi -= min(40.0, (hf_ratio - 0.10) * 80.0)
    # Penalty for flatline / clipping
    base_sqi -= min(30.0, (flatline_ratio + clipping_ratio) * 60.0)
    # SNR adjustment
    if snr_db < 6.0:
        base_sqi -= max(0.0, (6.0 - snr_db) * 3.5)

    final_sqi = float(np.clip(base_sqi, 5.0, 99.0))
    final_sqi = round(final_sqi, 1)

    # 6. Status Determination & Diagnostic Explanation
    reasons = []
    if missing_count > 0:
        reasons.append(f"{missing_count} interpolated missing samples")
    if flatline_ratio > 0.10:
        reasons.append(f"{flatline_ratio*100:.1f}% potential electrode detachment / flatline")
    if bw_ratio > 0.25:
        reasons.append(f"significant baseline wander ({bw_ratio*100:.1f}% low-freq energy)")
    if hf_ratio > 0.20:
        reasons.append(f"elevated electromyographic (EMG) or powerline noise ({hf_ratio*100:.1f}% HF energy)")

    if final_sqi >= 75.0:
        status = SignalQualityStatus.GOOD
        explanation = "High-fidelity signal with clean QRS complexes and low baseline interference. Suitable for automated screening."
        is_reliable = True
    elif final_sqi >= 50.0:
        status = SignalQualityStatus.NEEDS_REVIEW
        explanation = f"Moderate quality signal with {', '.join(reasons) if reasons else 'mild noise'}. Review recommended."
        is_reliable = True
    else:
        status = SignalQualityStatus.INSUFFICIENT
        explanation = f"Insufficient quality due to {', '.join(reasons) if reasons else 'excessive noise artifacts'}. AI classification confidence withheld to avoid false alerts."
        is_reliable = False

    return QualityMetrics(
        overall_sqi=final_sqi,
        status=status,
        snr_db=snr_db,
        baseline_wander_ratio=round(bw_ratio, 3),
        high_freq_noise_ratio=round(hf_ratio, 3),
        flatline_percentage=round(flatline_ratio * 100, 2),
        missing_samples_count=missing_count,
        explanation=explanation,
        is_reliable_for_ai=is_reliable
    )

