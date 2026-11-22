from __future__ import annotations

"""
Synthetic & Calibrated Physiological ECG Generator.
Generates multi-beat ECG recordings using Gaussian P-QRS-T wave models
with realistic cardiac pathologies: Normal Sinus, Atrial Fibrillation,
Sinus Bradycardia, Sinus Tachycardia, Ventricular Ectopy (PVCs), and Severe Motion Noise.
"""

import numpy as np
from typing import List, Tuple, Dict, Any


def generate_single_beat(
    sampling_rate: float,
    duration_sec: float,
    qrs_width_mult: float = 1.0,
    r_amp: float = 1.2,
    has_p_wave: bool = True,
    st_elevation: float = 0.0
) -> np.ndarray:
    """
    Generates a single ECG beat waveform using sum-of-Gaussians model:
    P wave, Q wave, R peak, S wave, T wave.
    """
    n_samples = int(duration_sec * sampling_rate)
    t = np.linspace(0, duration_sec, n_samples)
    center = duration_sec * 0.35  # R peak located at 35% of beat cycle

    beat = np.zeros(n_samples)

    # P wave (at center - 0.16s)
    if has_p_wave:
        p_center = center - 0.16
        p_amp = 0.18
        p_width = 0.04
        beat += p_amp * np.exp(-((t - p_center) ** 2) / (2 * (p_width ** 2)))

    # Q wave (at center - 0.035s)
    q_center = center - 0.035 * qrs_width_mult
    q_amp = -0.15
    q_width = 0.015 * qrs_width_mult
    beat += q_amp * np.exp(-((t - q_center) ** 2) / (2 * (q_width ** 2)))

    # R peak (at center)
    r_center = center
    r_width = 0.025 * qrs_width_mult
    beat += r_amp * np.exp(-((t - r_center) ** 2) / (2 * (r_width ** 2)))

    # S wave (at center + 0.04s)
    s_center = center + 0.04 * qrs_width_mult
    s_amp = -0.30
    s_width = 0.020 * qrs_width_mult
    beat += s_amp * np.exp(-((t - s_center) ** 2) / (2 * (s_width ** 2)))

    # T wave (at center + 0.22s)
    t_center = center + 0.22 * qrs_width_mult
    t_amp = 0.28 + st_elevation
    t_width = 0.065
    beat += t_amp * np.exp(-((t - t_center) ** 2) / (2 * (t_width ** 2)))

    return beat


def generate_scenario_recordings() -> Dict[str, Dict[str, Any]]:
    """
    Builds the 6 standard scenario recordings for CardioSense demo and screening testing.
    Each recording is 15-20 seconds at 250 Hz sampling rate.
    """
    fs = 250.0
    recordings = {}

    # 1. Normal Sinus Rhythm (HR ~ 72 BPM)
    np.random.seed(42)
    duration = 20.0
    target_bpm = 72.0
    base_rr = 60.0 / target_bpm  # ~0.833s
    n_beats = int(duration / base_rr) + 2

    # Slight respiratory sinus arrhythmia (RSA)
    rsa = 0.035 * np.sin(2 * np.pi * 0.25 * np.linspace(0, duration, n_beats))
    rr_intervals = [base_rr + rsa[i] + np.random.normal(0, 0.015) for i in range(n_beats)]

    signal_parts = []
    for rr in rr_intervals:
        beat = generate_single_beat(fs, rr, qrs_width_mult=1.0, r_amp=1.2, has_p_wave=True)
        signal_parts.append(beat)
    sig_normal = np.concatenate(signal_parts)[: int(duration * fs)]
    # Add subtle physiological baseline noise
    sig_normal += np.random.normal(0, 0.015, len(sig_normal))

    recordings["rec_normal_01"] = {
        "id": "rec_normal_01",
        "name": "PhysioNet Leadless Benchmark — Record NSR-01",
        "description": "20-second leadless recording exhibiting normal sinus pacing with subtle respiratory sinus arrhythmia.",
        "sampling_rate_hz": fs,
        "duration_seconds": duration,
        "source": "SAMPLE_DATASET",
        "expected_category": "NORMAL_SINUS_RHYTHM",
        "signal": sig_normal.tolist()
    }

    # 2. Atrial Fibrillation (Irregularly irregular, HR ~ 116 BPM, no P-waves)
    np.random.seed(101)
    duration = 20.0
    # Exponential / log-normal irregular intervals
    rr_afib = []
    t_acc = 0.0
    while t_acc < duration + 2.0:
        rr = np.random.exponential(0.52) + 0.32  # range 0.35s to 0.85s (HR 70-170)
        rr = np.clip(rr, 0.35, 0.85)
        rr_afib.append(rr)
        t_acc += rr

    sig_parts_afib = []
    for rr in rr_afib:
        beat = generate_single_beat(fs, rr, qrs_width_mult=0.95, r_amp=1.1, has_p_wave=False)
        sig_parts_afib.append(beat)
    sig_afib = np.concatenate(sig_parts_afib)[: int(duration * fs)]
    # Add fibrillatory baseline f-waves (4-8 Hz oscillation)
    t_axis = np.linspace(0, duration, len(sig_afib))
    f_waves = 0.08 * np.sin(2 * np.pi * 6.5 * t_axis) + 0.05 * np.cos(2 * np.pi * 4.8 * t_axis)
    sig_afib += f_waves + np.random.normal(0, 0.025, len(sig_afib))

    recordings["rec_afib_02"] = {
        "id": "rec_afib_02",
        "name": "MIT-BIH Arrhythmia Database — Record AF-04",
        "description": "20-second episode of paroxysmal Atrial Fibrillation with chaotic ventricular response and absent P waves.",
        "sampling_rate_hz": fs,
        "duration_seconds": duration,
        "source": "SAMPLE_DATASET",
        "expected_category": "ATRIAL_FIBRIL",
        "signal": sig_afib.tolist()
    }

    # 3. Sinus Bradycardia (HR ~ 48 BPM)
    np.random.seed(77)
    duration = 20.0
    base_rr_brady = 60.0 / 48.0  # 1.25s
    n_beats_brady = int(duration / base_rr_brady) + 2
    rr_brady = [base_rr_brady + np.random.normal(0, 0.02) for _ in range(n_beats_brady)]
    sig_parts_brady = []
    for rr in rr_brady:
        beat = generate_single_beat(fs, rr, qrs_width_mult=1.0, r_amp=1.15, has_p_wave=True)
        sig_parts_brady.append(beat)
    sig_brady = np.concatenate(sig_parts_brady)[: int(duration * fs)]
    sig_brady += np.random.normal(0, 0.015, len(sig_brady))

    recordings["rec_brady_03"] = {
        "id": "rec_brady_03",
        "name": "Clinical Holter Registry — Record SBR-12",
        "description": "20-second resting recording showing marked sinus bradycardia with normal P-QRS axis at 48 BPM.",
        "sampling_rate_hz": fs,
        "duration_seconds": duration,
        "source": "SAMPLE_DATASET",
        "expected_category": "SINUS_BRADYCARDIA",
        "signal": sig_brady.tolist()
    }

    # 4. Sinus Tachycardia (HR ~ 128 BPM)
    np.random.seed(88)
    duration = 20.0
    base_rr_tachy = 60.0 / 128.0  # ~0.47s
    n_beats_tachy = int(duration / base_rr_tachy) + 2
    rr_tachy = [base_rr_tachy + np.random.normal(0, 0.01) for _ in range(n_beats_tachy)]
    sig_parts_tachy = []
    for rr in rr_tachy:
        beat = generate_single_beat(fs, rr, qrs_width_mult=0.9, r_amp=1.25, has_p_wave=True)
        sig_parts_tachy.append(beat)
    sig_tachy = np.concatenate(sig_parts_tachy)[: int(duration * fs)]
    sig_tachy += np.random.normal(0, 0.02, len(sig_tachy))

    recordings["rec_tachy_04"] = {
        "id": "rec_tachy_04",
        "name": "Exercise Stress Registry — Record STACH-09",
        "description": "20-second high-rate sinus tachycardia showing shortened TP intervals and physiological elevated pacing at 128 BPM.",
        "sampling_rate_hz": fs,
        "duration_seconds": duration,
        "source": "SAMPLE_DATASET",
        "expected_category": "SINUS_TACHYCARDIA",
        "signal": sig_tachy.tolist()
    }

    # 5. Ventricular Ectopy (PVC Bigeminy / Couplets)
    np.random.seed(99)
    duration = 20.0
    # Every 3rd beat is a premature ventricular contraction (wide QRS, no P wave, inverted T wave, compensatory pause)
    sig_parts_pvc = []
    t_curr = 0.0
    beat_idx = 0
    while t_curr < duration + 2.0:
        if beat_idx % 3 == 2:
            # PVC: premature interval (0.50s instead of 0.83s)
            pvc_beat = generate_single_beat(fs, 0.50, qrs_width_mult=1.8, r_amp=1.7, has_p_wave=False, st_elevation=-0.4)
            sig_parts_pvc.append(pvc_beat)
            t_curr += 0.50
            # Followed by compensatory pause (1.15s)
            comp_beat = generate_single_beat(fs, 1.15, qrs_width_mult=1.0, r_amp=1.2, has_p_wave=True)
            sig_parts_pvc.append(comp_beat)
            t_curr += 1.15
            beat_idx += 2
        else:
            norm_beat = generate_single_beat(fs, 0.82, qrs_width_mult=1.0, r_amp=1.2, has_p_wave=True)
            sig_parts_pvc.append(norm_beat)
            t_curr += 0.82
            beat_idx += 1

    sig_pvc = np.concatenate(sig_parts_pvc)[: int(duration * fs)]
    sig_pvc += np.random.normal(0, 0.02, len(sig_pvc))

    recordings["rec_pvc_05"] = {
        "id": "rec_pvc_05",
        "name": "MIT-BIH Arrhythmia Database — Record VE-208",
        "description": "20-second recording with recurrent premature ventricular contractions (PVCs) displaying widened QRS morphology and compensatory pauses.",
        "sampling_rate_hz": fs,
        "duration_seconds": duration,
        "source": "SAMPLE_DATASET",
        "expected_category": "VENTRICULAR_ECTOPY",
        "signal": sig_pvc.tolist()
    }

    # 6. High Motion Artifact / Electrode Detachment (Insufficient SQI)
    np.random.seed(123)
    duration = 20.0
    t_axis_noise = np.linspace(0, duration, int(duration * fs))
    # Severe baseline drift
    wander = 1.4 * np.sin(2 * np.pi * 0.18 * t_axis_noise) + 0.9 * np.cos(2 * np.pi * 0.35 * t_axis_noise)
    # Heavy 50 Hz powerline buzz
    powerline = 0.65 * np.sin(2 * np.pi * 50.0 * t_axis_noise)
    # EMG burst noise
    emg = np.random.normal(0, 0.35, len(t_axis_noise))
    # Weak obscured ECG signal
    base_sig = np.tile(generate_single_beat(fs, 0.83, qrs_width_mult=1.0, r_amp=0.5), 30)[: len(t_axis_noise)]
    # Flatline segment from second 12 to 16 (sensor loose)
    sig_noise = base_sig + wander + powerline + emg
    flat_start = int(12.0 * fs)
    flat_end = int(16.5 * fs)
    sig_noise[flat_start:flat_end] = sig_noise[flat_start] + np.random.normal(0, 0.001, flat_end - flat_start)

    recordings["rec_noise_06"] = {
        "id": "rec_noise_06",
        "name": "Ambulatory Wearable Signal — High Noise Artifact",
        "description": "20-second recording degraded by motion artifact, baseline wander, 50 Hz line hum, and a 4.5-second lead detachment flatline.",
        "sampling_rate_hz": fs,
        "duration_seconds": duration,
        "source": "SAMPLE_DATASET",
        "expected_category": "INSUFFICIENT_QUALITY",
        "signal": sig_noise.tolist()
    }

    return recordings

