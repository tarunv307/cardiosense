"""
ECG Preprocessing Pipeline:
- Baseline wander removal (0.5 Hz highpass / median subtraction)
- High-frequency noise suppression (40.0 Hz lowpass)
- 50 Hz and 60 Hz powerline notch filtering
- Safe numerical clipping and centering
"""

import numpy as np
from scipy import signal


def preprocess_ecg(
    raw_signal: np.ndarray,
    sampling_rate: float,
    apply_notch: bool = True
) -> np.ndarray:
    """
    Applies zero-phase forward-backward Butterworth filtering to isolate physiological QRS morphology.
    """
    # 1. Handle NaN / Inf if any
    clean_signal = np.copy(raw_signal)
    invalid_mask = np.isnan(clean_signal) | np.isinf(clean_signal)
    if np.any(invalid_mask):
        valid_indices = np.where(~invalid_mask)[0]
        if len(valid_indices) == 0:
            return np.zeros_like(clean_signal)
        invalid_indices = np.where(invalid_mask)[0]
        clean_signal[invalid_indices] = np.interp(invalid_indices, valid_indices, clean_signal[valid_indices])

    nyquist = 0.5 * sampling_rate

    # 2. Bandpass Filter (0.5 Hz to min(40.0 Hz, 0.45 * sampling_rate))
    lowcut = 0.5
    highcut = min(40.0, nyquist * 0.9)
    if highcut <= lowcut:
        highcut = max(lowcut + 5.0, nyquist * 0.95)

    low_norm = lowcut / nyquist
    high_norm = highcut / nyquist
    b_band, a_band = signal.butter(3, [low_norm, high_norm], btype='bandpass')
    filtered = signal.filtfilt(b_band, a_band, clean_signal)

    # 3. Powerline Notch Filter (50 Hz and 60 Hz if sampling rate permits)
    if apply_notch:
        for freq in [50.0, 60.0]:
            if freq < nyquist * 0.9:
                q = 30.0  # Quality factor
                b_notch, a_notch = signal.iirnotch(freq, q, sampling_rate)
                filtered = signal.filtfilt(b_notch, a_notch, filtered)

    # 4. Remove residual DC offset
    filtered = filtered - np.mean(filtered)

    return filtered

