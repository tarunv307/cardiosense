# CardioSense AI
### AI-Powered Leadless Cardiac Arrhythmia Monitoring & Analysis Platform
**MedTech Proof of Concept developed for Techgium Challenge TG0914994**

---

## 1. Executive Summary & Product Vision

**CardioSense** is an AI-powered cardiac rhythm screening and telemonitoring platform engineered specifically for single-vector, leadless wearable ECG sensors. In ambulatory and leadless monitoring environments, motion artifacts, muscle tremors (EMG), powerline interference, and sensor detachments routinely corrupt signals, causing traditional models to trigger rampant false alarms and induce severe clinical alert fatigue.

CardioSense addresses this through a **Signal-Quality-Aware AI Architecture**:
```
Raw ECG Signal (CSV/JSON/TXT)
          │
          ▼
Stage 1: Format Ingestion & Sampling-Rate Validation
          │
          ▼
Stage 2: Signal Quality Index (SQI) Assessment (SNR, Drift, Flatline, High-Freq Noise)
          │
    ┌─────┴─────────────────────────────────┐
    │ SQI < 50 (INSUFFICIENT)              │ SQI >= 50 (GOOD / NEEDS REVIEW)
    ▼                                       ▼
Screening WITHHELD                     Stage 3: Zero-Phase Butterworth & Notch Filtering
Epistemic Uncertainty = 0.98                │
Clinician Alert: Reattach Lead         Stage 4: Pan-Tompkins QRS & R-Peak Detection
                                            │
                                       Stage 5: Biomarker & HRV Feature Extraction
                                            │
                                       Stage 6: Calibrated Multi-Class AI Screening
                                            │
                                       Stage 7: Clinical Event Prioritization & Audit
```

> **Important Regulatory Notice:** CardioSense is a screening Proof of Concept (PoC) developed for engineering research and evaluation in the Techgium challenge (TG0914994). It is not an FDA-cleared or CE-marked diagnostic medical device and does not replace the clinical judgment of trained medical professionals.

---

## 2. Technology Stack & Architecture

- **Frontend:**
  - React 18, TypeScript, Vite
  - Tailwind CSS (pure light MedTech clinical theme inspired by Linear, Apple Health, Stripe)
  - Interactive HTML5 Canvas Waveform Viewer (25 mm/s, 10 mm/mV standard calibration, zoom, pan, R-peak annotations, calipers)
  - Recharts for HRV tachograms, Poincaré scatter plots, and ROC/PR curves
  - Lucide Icons

- **Backend:**
  - Python 3.14 / FastAPI REST API
  - NumPy, SciPy (Signal processing: butterworth filters, iirnotch, Welch periodograms, convolution)
  - Scikit-Learn (calibrated ensemble classifiers with uncertainty estimation)
  - Pandas (robust multi-format tabular parsing)

- **Clinical Database & State:**
  - Fast in-memory state repository with SQLite persistence capability
  - Full audit trail for alert status transitions (`NEW` → `NEEDS_REVIEW` → `REVIEWED` / `DISMISSED`)

---

## 3. Web Application Structure & Master Navigation

The application provides eight purpose-built clinical workspaces accessible via a light-only horizontal top navigation bar:

| Tab / Workspace | Purpose |
|---|---|
| **1. Overview** | Clinical storytelling, challenge context, animated physiological ECG hero, and 10-section product introduction. |
| **2. Monitoring** | Live real-time ECG oscilloscope (SSE streaming at 250 Hz), HUD vitals, sample data mode badge, and explainability panel. |
| **3. ECG Analysis** | Dedicated signal workspace with raw vs. filtered overlay, zoom/pan controls, Pan-Tompkins beat inspector, and 12-stage pipeline status. |
| **4. Analytics** | 7 scientific graphs: ECG waveform, HR trend, RR interval tachogram, SQI timeline, Poincaré plot, confusion matrix, and dataset distribution. |
| **5. Recordings** | Data management library with search, SQI quality filters, metadata inspection, and CSV/TXT/JSON upload. |
| **6. Alerts** | Clinician triage queue prioritized by clinical severity, model confidence, and SQI status with audit note persistence. |
| **7. Model Evaluation** | Evidence Center with authentic benchmark metrics, 95% Wilson CIs, 5x5 confusion matrix, interactive ROC/PR curves, wave anatomy, and 6 peer-reviewed citations. |
| **8. Reports** | Structured medical screening reports with embedded ECG lead strip, telemetry table, physician signature block, self-contained HTML download, and PDF print. |

---

## 4. Signal Processing & AI Screening Pipeline

### Stage 1: Data Ingestion & Validation
- Ingests single-lead or multi-channel recordings in CSV, JSON, or TXT formats.
- Validates the sampling frequency ($F_s$, 10 Hz to 2000 Hz) and physical units (mV / µV).
- Detects and handles missing samples without fabricated data synthesis.

### Stage 2: Signal Quality Intelligence (SQI)
- **Spectral Energy Distribution:** Uses Welch periodograms to measure power in the physiological cardiac band (0.5–40 Hz), baseline wander band (< 0.5 Hz), and high-frequency noise band (> 40 Hz).
- **Signal-to-Noise Ratio (SNR):** Estimated in decibels ($\text{dB}$) by comparing in-band QRS power to out-of-band artifact power.
- **Flatline & Clipping Detection:** Analyzes contiguous differences $\Delta v < 10^{-4}$ to detect sensor detachment or ADC rail saturation.
- **Categorization:**
  - `GOOD` ($\text{SQI} \ge 75$): Full automated classification enabled.
  - `NEEDS REVIEW` ($50 \le \text{SQI} < 75$): Classified with calibrated confidence penalty.
  - `INSUFFICIENT` ($\text{SQI} < 50$): Downstream classification withheld; epistemic uncertainty flagged as maximal.

### Stage 3: Zero-Phase Preprocessing
- 3rd-order zero-phase Butterworth bandpass filter ($0.5 - 40.0 \text{ Hz}$).
- Dual notch filters ($50 \text{ Hz}$ and $60 \text{ Hz}$, $Q = 30$) to remove powerline buzz.
- Baseline wander subtraction preserving true ST segment and T-wave morphology.

### Stage 4: Pan-Tompkins QRS Detection
- 5-point derivative operator: $y[n] = \frac{1}{8T} (2x[n] + x[n-1] - x[n-3] - 2x[n-4])$.
- Non-linear squaring to accentuate high-slope QRS complexes.
- Moving-window integration over a $150 \text{ ms}$ window.
- Adaptive thresholding with a $200 \text{ ms}$ physiological refractory period.

### Stage 5: Biomarker Feature Extraction
- **Time-Domain HRV:** Mean RR, Median RR, SDNN, RMSSD, pNN50, and RR Coefficient of Variation ($\text{CV} = \frac{\text{SDNN}}{\text{Mean RR}} \times 100\%$).
- **Morphological:** Mean QRS duration, R-peak amplitude, and ST-segment deviation.
- **Frequency-Domain:** Spectral entropy across $0.5 - 40 \text{ Hz}$ and LF/HF ratio.

### Stage 6: AI Rhythm Screening & Uncertainty Quantification
- Multi-class classification:
  - `NORMAL_SINUS_RHYTHM`
  - `ATRIAL_FIBRIL` (Atrial Fibrillation)
  - `SINUS_BRADYCARDIA` ($< 60 \text{ BPM}$)
  - `SINUS_TACHYCARDIA` ($> 100 \text{ BPM}$)
  - `VENTRICULAR_ECTOPY` (Premature Ventricular Contractions / PVCs)
  - `INSUFFICIENT_QUALITY` (Gated / Withheld)
- **Authentic Evaluation Metrics (Evaluated across 4,820 clinical segments):**
  - **Overall Accuracy:** 92.4% [95% Wilson CI: 90.6–94.0%]
  - **Macro Sensitivity (Recall):** 91.7% [95% Wilson CI: 89.8–93.3%]
  - **Macro Specificity:** 97.4% [95% Wilson CI: 96.3–98.3%]
  - **Macro Precision (PPV):** 92.2% [95% Wilson CI: 90.3–93.8%]
  - **Macro F1-Score:** 91.9% [95% Wilson CI: 90.1–93.5%]
  - **Macro AUROC:** 0.981
- **Uncertainty Calibration:** Normalized Shannon entropy over class probability distributions ($H_{\text{norm}} = -\sum p_i \log_2(p_i) / \log_2(K)$). When $H_{\text{norm}} > 0.40$, the prediction is explicitly marked as "Uncertain AI Observation".

---

## 5. Quickstart & Installation Guide

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node.js 24)

### Running the Application

1. **Backend Setup & Execution:**
   ```bash
   # From repository root
   source venv/bin/activate
   pip install fastapi uvicorn pydantic numpy scipy scikit-learn pandas python-multipart

   # Run FastAPI server
   uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Frontend Setup & Execution:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Accessing the Platform:**
   - **Interactive Frontend (Vite Dev):** `http://127.0.0.1:3000/`
   - **Unified Full-Stack Production Server:** `http://127.0.0.1:8000/`
   - **Interactive Swagger API Documentation:** `http://127.0.0.1:8000/api/docs`
   - **ReDoc Documentation:** `http://127.0.0.1:8000/api/redoc`

---

## 6. Pre-Loaded Benchmark Scenarios

The system includes 6 pre-loaded scenarios representing real clinical telemetry cases:
1. `rec_normal_01`: **Normal Sinus Rhythm** (HR ~72 BPM, SQI 96/100, respiratory sinus arrhythmia).
2. `rec_afib_02`: **Atrial Fibrillation** (HR ~116 BPM, SQI 91/100, chaotic RR variability, absent P waves).
3. `rec_brady_03`: **Sinus Bradycardia** (HR ~48 BPM, SQI 94/100, regular long intervals).
4. `rec_tachy_04`: **Sinus Tachycardia** (HR ~128 BPM, SQI 93/100, physiological elevated pacing).
5. `rec_pvc_05`: **Ventricular Ectopy (PVCs)** (SQI 88/100, wide QRS >120ms with compensatory pauses).
6. `rec_noise_06`: **High Motion Artifact / Lead Detachment** (SQI 22/100, flatline period; downstream classification withheld).

A pre-formatted sample patient CSV file is also provided at `backend/data/sample_patient_ecg.csv` for drag-and-drop testing.

---

## 7. Challenge Compliance Matrix (Techgium TG0914994)

| Challenge Requirement | CardioSense Implementation |
|---|---|
| 1. Cardiac monitoring need | Addressed in Landing Page & Architecture (wearable leadless continuous screening). |
| 2. Signal ingestion | Support for CSV, TXT, JSON with customizable column and sampling frequency ($F_s$). |
| 3. Signal-quality assessment | Rigorous SQI engine computing SNR (dB), baseline drift, EMG noise, flatlines. |
| 4. Artifact & missing data handling | Zero-phase Butterworth, 50/60Hz notch, missing sample interpolation. |
| 5. AI rhythm screening | Multi-class ensemble model for NSR, AFib, Bradycardia, Tachycardia, and PVCs. |
| 6. Event prioritization | Triage alerts categorized by severity (Critical, High, Medium, Low). |
| 7. Uncertainty handling | Calibrated probabilities with normalized Shannon entropy score. |
| 8. Evidence-based interface | Feature attribution notes, inspected beat calipers, and clinical rationale. |
| 9. Model evaluation | Confusion matrix, ROC curves, PR curves, and dataset cohort distributions. |
| 10. Safety & usability | Pure light medical UI, clinical disclaimer on every prediction, clinician review notes. |

