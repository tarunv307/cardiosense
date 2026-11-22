"""
CardioSense AI Unit & Integration Test Suite.
Tests signal quality index (SQI), Butterworth preprocessing,
Pan-Tompkins beat detection accuracy, AI screening uncertainty gating,
and REST API endpoints.
"""

import unittest
import numpy as np
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.schemas import SignalQualityStatus, RhythmCategory
from backend.signal.quality import assess_signal_quality
from backend.signal.preprocessing import preprocess_ecg
from backend.signal.beat_detection import detect_r_peaks_pan_tompkins, segment_beats_and_hrv
from backend.signal.features import extract_ecg_features
from backend.ml.model import screen_rhythm
from backend.data.sample_generator import generate_scenario_recordings


class TestCardioSensePipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.scenarios = generate_scenario_recordings()
        cls.client = TestClient(app)

    def test_01_signal_quality_assessment_good(self):
        """Clean Normal Sinus signal should receive GOOD SQI status."""
        sig = np.array(self.scenarios["rec_normal_01"]["signal"], dtype=float)
        fs = self.scenarios["rec_normal_01"]["sampling_rate_hz"]
        quality = assess_signal_quality(sig, fs)

        self.assertGreaterEqual(quality.overall_sqi, 75.0)
        self.assertEqual(quality.status, SignalQualityStatus.GOOD)
        self.assertTrue(quality.is_reliable_for_ai)
        self.assertGreater(quality.snr_db, 10.0)

    def test_02_signal_quality_assessment_insufficient(self):
        """Noise artifact and flatline signal should receive INSUFFICIENT SQI status."""
        sig = np.array(self.scenarios["rec_noise_06"]["signal"], dtype=float)
        fs = self.scenarios["rec_noise_06"]["sampling_rate_hz"]
        quality = assess_signal_quality(sig, fs)

        self.assertLess(quality.overall_sqi, 50.0)
        self.assertEqual(quality.status, SignalQualityStatus.INSUFFICIENT)
        self.assertFalse(quality.is_reliable_for_ai)

    def test_03_preprocessing_stability(self):
        """Bandpass filtering must preserve length and remove DC offset."""
        sig = np.array(self.scenarios["rec_normal_01"]["signal"], dtype=float) + 2.5  # Add artificial DC offset
        fs = self.scenarios["rec_normal_01"]["sampling_rate_hz"]
        filtered = preprocess_ecg(sig, fs)

        self.assertEqual(len(filtered), len(sig))
        self.assertAlmostEqual(float(np.mean(filtered)), 0.0, places=2)

    def test_04_pan_tompkins_qrs_detection(self):
        """Pan-Tompkins must accurately detect beats and compute heart rate within physiological limits."""
        sig = np.array(self.scenarios["rec_normal_01"]["signal"], dtype=float)
        fs = self.scenarios["rec_normal_01"]["sampling_rate_hz"]
        filtered = preprocess_ecg(sig, fs)
        r_peaks, _ = detect_r_peaks_pan_tompkins(filtered, fs)
        beat_data = segment_beats_and_hrv(filtered, r_peaks, fs)

        # In 20 seconds at ~72 BPM, there should be roughly 22-26 beats
        self.assertGreaterEqual(beat_data.total_beats, 20)
        self.assertLessEqual(beat_data.total_beats, 28)
        self.assertAlmostEqual(beat_data.mean_hr_bpm, 72.0, delta=6.0)

    def test_05_ai_screening_withholding_on_insufficient_quality(self):
        """AI screening engine must withhold confident classifications when SQI is insufficient."""
        sig = np.array(self.scenarios["rec_noise_06"]["signal"], dtype=float)
        fs = self.scenarios["rec_noise_06"]["sampling_rate_hz"]
        quality = assess_signal_quality(sig, fs)
        filtered = preprocess_ecg(sig, fs)
        r_peaks, _ = detect_r_peaks_pan_tompkins(filtered, fs)
        beat_data = segment_beats_and_hrv(filtered, r_peaks, fs)
        features = extract_ecg_features(filtered, beat_data, fs)

        prediction = screen_rhythm(quality, features, beat_data)

        self.assertEqual(prediction.category, RhythmCategory.INSUFFICIENT_QUALITY)
        self.assertTrue(prediction.is_uncertain)
        self.assertGreaterEqual(prediction.uncertainty_score, 0.90)
        self.assertEqual(prediction.confidence, 0.0)

    def test_06_ai_screening_atrial_fibrillation(self):
        """AI screening engine should identify irregular ventricular dynamics in AFib."""
        sig = np.array(self.scenarios["rec_afib_02"]["signal"], dtype=float)
        fs = self.scenarios["rec_afib_02"]["sampling_rate_hz"]
        quality = assess_signal_quality(sig, fs)
        filtered = preprocess_ecg(sig, fs)
        r_peaks, _ = detect_r_peaks_pan_tompkins(filtered, fs)
        beat_data = segment_beats_and_hrv(filtered, r_peaks, fs)
        features = extract_ecg_features(filtered, beat_data, fs)

        prediction = screen_rhythm(quality, features, beat_data)

        self.assertEqual(prediction.category, RhythmCategory.ATRIAL_FIBRIL)
        self.assertGreater(prediction.confidence, 0.70)
        self.assertGreater(features.rr_cv_percent, 14.0)

    def test_07_rest_api_health_and_recordings(self):
        """API endpoints must return healthy status and pre-loaded scenarios."""
        res_health = self.client.get("/api/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertEqual(res_health.json()["status"], "healthy")

        res_recs = self.client.get("/api/recordings")
        self.assertEqual(res_recs.status_code, 200)
        recs = res_recs.json()
        self.assertGreaterEqual(len(recs), 6)

    def test_08_rest_api_model_evaluation(self):
        """Model evaluation endpoint must return authentic benchmark confusion matrix."""
        res_eval = self.client.get("/api/models/evaluation")
        self.assertEqual(res_eval.status_code, 200)
        data = res_eval.json()
        self.assertIn("confusion_matrix", data)
        self.assertIn("overall_accuracy", data)
        self.assertGreater(data["overall_accuracy"], 0.90)


if __name__ == "__main__":
    unittest.main()

