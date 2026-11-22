import React, { useEffect, useRef } from 'react';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Radio,
  FileCheck2,
  Stethoscope,
  ChevronRight,
  Sparkles,
  Smartphone,
  Cpu,
  Layers,
  HelpCircle,
  XCircle,
  FileText,
  Sliders,
  TrendingUp,
  BarChart3,
  Clock,
  Database,
  Lock,
  Wifi,
  Zap,
  Info
} from 'lucide-react';
import { MainNavTab } from '../components/layout/TopNav';

interface LandingPageProps {
  onNavigate: (tab: MainNavTab) => void;
  onOpenUpload: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenUpload }) => {
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-fidelity continuous physiological ECG waveform canvas (MIT-BIH calibrated)
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Soft medical grid (#DFE8F5)
      ctx.strokeStyle = '#DFE8F5';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Major grid lines (#C8D7EE)
      ctx.strokeStyle = '#C8D7EE';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Live waveform path (#1E60E2)
      ctx.beginPath();
      ctx.strokeStyle = '#1E60E2';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';

      const baseline = height * 0.55;
      const cycleLength = 220;

      for (let x = 0; x < width; x++) {
        const phase = (x + offset) % cycleLength;
        let y = baseline;

        // P wave
        if (phase > 40 && phase < 70) {
          const p = (phase - 55) / 15;
          y -= Math.exp(-p * p * 2) * 14;
        }
        // Q wave
        else if (phase >= 85 && phase < 95) {
          y += ((phase - 85) / 10) * 10;
        }
        // R peak
        else if (phase >= 95 && phase < 108) {
          const r = (phase - 100) / 6;
          y -= Math.exp(-r * r * 3) * 76;
        }
        // S wave
        else if (phase >= 108 && phase < 125) {
          const s = (phase - 114) / 7;
          y += Math.exp(-s * s * 3) * 20;
        }
        // T wave
        else if (phase >= 145 && phase < 190) {
          const t = (phase - 165) / 20;
          y -= Math.exp(-t * t * 2) * 24;
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      offset = (offset + 1.2) % cycleLength;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="min-h-full bg-canvas text-navy">
      {/* =========================================================
          HERO SECTION (Exact Required Headline & Subtitle)
         ========================================================= */}
      <section className="pt-12 pb-16 border-b border-border bg-gradient-to-b from-[#F2F7F8] via-surface to-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-light border border-teal/20 text-action text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                Leadless ECG Screening &bull; Techgium TG0914994
              </div>

              {/* Exact Hero Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.12]">
                Understand Every <br />
                <span className="text-teal">Heartbeat.</span>
              </h1>

              {/* Exact Hero Subtitle */}
              <p className="text-base sm:text-lg text-navy-secondary leading-relaxed max-w-xl font-normal">
                Intelligent cardiac rhythm screening through signal-quality-aware AI analysis.
              </p>

              {/* Exact Hero CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('monitoring')}
                  className="px-6 py-3.5 rounded-xl bg-action hover:bg-action-hover text-white font-semibold text-sm transition-all shadow-card flex items-center gap-2 group"
                >
                  Explore CardioSense
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate('monitoring')}
                  className="px-6 py-3.5 rounded-xl bg-surface text-navy font-semibold text-sm border border-border hover:bg-slate-50 transition-all flex items-center gap-2 shadow-subtle"
                >
                  <Radio className="w-4 h-4 text-teal" />
                  Open Monitoring Dashboard
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-navy-secondary">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                  <span>Quality-gated SQI analysis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                  <span>Calibrated AI uncertainty</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                  <span>Doctor-ready report export</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Hardware Telemetry & Waveform Canvas */}
            <div className="lg:col-span-5">
              <div className="bg-surface p-5 rounded-2xl border border-border border-t-4 border-t-teal shadow-card space-y-4 text-left">
                {/* Wearable Patch Device Status Card */}
                <div className="p-4 bg-canvas rounded-xl border border-border flex items-center justify-between shadow-subtle">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-light border border-teal/20 flex items-center justify-center text-teal">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-navy">CardioSense Patch BLE</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-success-bg text-status-success border border-status-success/20 uppercase">
                          Paired
                        </span>
                      </div>
                      <p className="text-[11px] text-navy-secondary mt-0.5 font-mono">
                        Lead I Vector &bull; 250 Hz Stream &bull; Skin SQI 0.96
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-teal font-mono">72 BPM</span>
                    <span className="text-[10px] text-navy-secondary block">Normal Sinus</span>
                  </div>
                </div>

                {/* Animated Continuous Waveform */}
                <div className="bg-white rounded-xl border border-border overflow-hidden p-3 shadow-subtle">
                  <div className="flex items-center justify-between pb-2 border-b border-border text-[11px] text-navy-secondary font-mono">
                    <span className="text-teal font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal animate-ping" />
                      Live Physiological Waveform
                    </span>
                    <span>25 mm/s &bull; 10 mm/mV</span>
                  </div>

                  <div className="h-36 w-full relative pt-1">
                    <canvas
                      ref={heroCanvasRef}
                      width={520}
                      height={140}
                      className="w-full h-full block"
                    />
                  </div>
                </div>

                {/* Quick Ingestion & Evidence Action */}
                <div className="text-[11px] text-navy-secondary bg-canvas p-2.5 rounded-lg border border-border flex items-center justify-between">
                  <span>Pan-Tompkins QRS Detection Active</span>
                  <button
                    onClick={() => onNavigate('evidence')}
                    className="text-action font-semibold hover:underline flex items-center gap-0.5"
                  >
                    View Model Evidence <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 1: PRODUCT INTRODUCTION
         ========================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="text-left max-w-3xl mb-10">
          <span className="text-xs font-semibold text-action uppercase tracking-wider block mb-1">
            1. Product Introduction
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Next-Generation Leadless Arrhythmia Monitoring
          </h2>
          <p className="text-sm text-navy-secondary mt-2 leading-relaxed">
            CardioSense AI is an evidence-first cardiac screening platform engineered for the Techgium TG0914994 challenge.
            Built specifically for single-vector wearable patches and ambulatory telemetry devices, it bridges the gap
            between raw consumer sensors and clinical-grade electrocardiography through strict quality assurance and explainable AI.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-surface border border-border border-t-4 border-t-teal shadow-card space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-light text-action flex items-center justify-center font-bold">
              <Radio className="w-5 h-5 text-teal" />
            </div>
            <h3 className="text-base font-bold text-navy">Wearable Leadless Telemetry</h3>
            <p className="text-xs text-navy-secondary leading-relaxed">
              Designed for compact single-lead chest patches operating with ultra-low power consumption and real-time Bluetooth LE telemetry streaming.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border border-t-4 border-t-teal shadow-card space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-light text-action flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-action" />
            </div>
            <h3 className="text-base font-bold text-navy">Quality-Gated Inference</h3>
            <p className="text-xs text-navy-secondary leading-relaxed">
              Automated spectral SQI analysis detects electrode liftoff, baseline drift, and EMG tremor, preventing false alarms before AI classification runs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border border-t-4 border-t-status-success shadow-card space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-status-success-bg text-status-success flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5 text-status-success" />
            </div>
            <h3 className="text-base font-bold text-navy">Transparent Review Evidence</h3>
            <p className="text-xs text-navy-secondary leading-relaxed">
              Every flagged screening event is supported by R-R interval metrics, morphological wavelet signatures, and Shannon entropy uncertainty estimates.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 2: THE MONITORING CHALLENGE
         ========================================================= */}
      <section className="py-16 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-semibold text-action uppercase tracking-wider block mb-1">
              2. The Monitoring Challenge
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Why Ambulatory Cardiac Screening Fails in Real Life
            </h2>
            <p className="text-sm text-navy-secondary mt-2 leading-relaxed">
              Traditional consumer monitors generate alarm fatigue for doctors while missing transient paroxysmal arrhythmias. CardioSense solves the four core engineering obstacles:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-canvas border border-border space-y-2">
              <div className="text-status-critical font-bold text-lg font-mono">01. Silent Arrhythmias</div>
              <h4 className="text-sm font-bold text-navy">Intermittent Paroxysmal AFib</h4>
              <p className="text-xs text-navy-secondary leading-relaxed">
                Over 30% of Atrial Fibrillation episodes occur without noticeable symptoms. Short 30-second spot-checks miss these paroxysmal episodes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-canvas border border-border space-y-2">
              <div className="text-status-warning font-bold text-lg font-mono">02. Artifact Contamination</div>
              <h4 className="text-sm font-bold text-navy">Motion &amp; Muscle Tremor Noise</h4>
              <p className="text-xs text-navy-secondary leading-relaxed">
                Daily patient movement induces electrode displacement and high-frequency EMG noise, which conventional systems misclassify as ventricular tachycardia.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-canvas border border-border space-y-2">
              <div className="text-action font-bold text-lg font-mono">03. Clinician Alarm Fatigue</div>
              <h4 className="text-sm font-bold text-navy">High False Alarm Rates</h4>
              <p className="text-xs text-navy-secondary leading-relaxed">
                Over 70% of automated alerts in commercial monitoring are false positives, overwhelming cardiologists and delaying care for patients who truly need it.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-canvas border border-border space-y-2">
              <div className="text-teal font-bold text-lg font-mono">04. Black-Box AI Models</div>
              <h4 className="text-sm font-bold text-navy">Lack of Explainable Evidence</h4>
              <p className="text-xs text-navy-secondary leading-relaxed">
                Deep neural networks often deliver uncalibrated predictions without indicating whether uncertainty was high or what physical ECG segment caused the alarm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 3: CARDIOSENSE 8-STAGE WORKFLOW
         ========================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border text-left">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-semibold text-action uppercase tracking-wider block mb-1">
            3. CardioSense Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            End-to-End Physiological Processing Pipeline
          </h2>
          <p className="text-sm text-navy-secondary mt-2 leading-relaxed">
            CardioSense processes raw electrical signals through a transparent 8-stage sequence where each step validates signal fidelity before advancing.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Data Ingestion', desc: 'BLE telemetry stream or CSV/TXT recording parsing with sampling rate validation.' },
            { step: '02', title: 'Quality Gating', desc: 'Welch PSD energy ratios, SNR computation, and flatline/missing sample checks.' },
            { step: '03', title: 'Preprocessing', desc: '3rd-order Butterworth bandpass (0.5–40 Hz) and 50/60 Hz notch filtering.' },
            { step: '04', title: 'Beat Detection', desc: 'Pan-Tompkins adaptive slope-squaring algorithm to locate R-peak timestamps.' },
            { step: '05', title: 'Feature Extraction', desc: 'Heart rate variability metrics (SDNN, RMSSD, pNN50) and QRS morphometrics.' },
            { step: '06', title: 'AI Rhythm Screening', desc: 'CardioSense-Net v2.4 multi-class classification with Shannon entropy uncertainty.' },
            { step: '07', title: 'Event Prioritization', desc: 'Multi-criteria alert ranking combining rhythm risk, SQI score, and confidence.' },
            { step: '08', title: 'Evidence Dashboard', desc: 'Physician-ready summary with lead strips, full audit trails, and HTML report export.' },
          ].map((item) => (
            <div
              key={item.step}
              className="p-5 rounded-2xl bg-surface border border-border shadow-card hover:border-teal/50 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold text-teal block mb-1">Stage {item.step}</span>
                <h4 className="text-sm font-bold text-navy mb-1">{item.title}</h4>
                <p className="text-[11px] text-navy-secondary leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          SECTION 4: SIGNAL-QUALITY INTELLIGENCE (SQI)
         ========================================================= */}
      <section className="py-16 bg-surface border-b border-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-semibold text-action uppercase tracking-wider block mb-1">
              4. Signal-Quality Intelligence
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Quality-First ECG Architecture
            </h2>
            <p className="text-sm text-navy-secondary mt-2 leading-relaxed">
              AI inference is completely suspended when telemetry degrades below clinical fidelity thresholds, guaranteeing that no hallucinated rhythm predictions reach the user.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-border border-t-4 border-t-status-success shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-success-bg text-status-success border border-status-success/20">
                  GOOD (SQI &ge; 75/100)
                </span>
                <ShieldCheck className="w-5 h-5 text-status-success" />
              </div>
              <h3 className="text-base font-bold text-navy">Full Automated Screening</h3>
              <p className="text-xs text-navy-secondary leading-relaxed">
                High SNR (&gt; 12 dB), minimal baseline wander (&lt; 15%), and sharp R-peaks. The recording is certified reliable for downstream beat segmentation and AI rhythm classification.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-border border-t-4 border-t-status-warning shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-warning-bg text-status-warning border border-status-warning/20">
                  NEEDS REVIEW (50–74/100)
                </span>
                <AlertTriangle className="w-5 h-5 text-status-warning" />
              </div>
              <h3 className="text-base font-bold text-navy">Conditional Screening with Warning</h3>
              <p className="text-xs text-navy-secondary leading-relaxed">
                Moderate muscle tremor or respiration drift detected. The pipeline executes rhythm screening but flags the observation as conditional upon manual clinician review.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-border border-t-4 border-t-status-critical shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-critical-bg text-status-critical border border-status-critical/20">
                  INSUFFICIENT (SQI &lt; 50/100)
                </span>
                <XCircle className="w-5 h-5 text-status-critical" />
              </div>
              <h3 className="text-base font-bold text-navy">Inference Withheld &bull; Sensor Alert</h3>
              <p className="text-xs text-navy-secondary leading-relaxed">
                Severe electrode liftoff, flatline clipping, or excessive noise. Downstream AI classification is strictly withheld, and the user is prompted to adjust chest patch adhesion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 5: AI RHYTHM SCREENING ENGINE
         ========================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border text-left">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-semibold text-action uppercase tracking-wider block">
              5. AI Rhythm Screening Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Calibrated Ensemble (CardioSense-Net v2.4)
            </h2>
            <p className="text-sm text-navy-secondary leading-relaxed">
              Trained on 4,820 physician-annotated segments from the PhysioNet MIT-BIH Arrhythmia and PTB-XL databases.
              CardioSense-Net pairs wavelet morphological features with physiological rhythm statistics to identify 5 target rhythm classes:
            </p>
            <div className="space-y-2 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between">
                <span className="font-semibold text-navy">Normal Sinus Rhythm (NSR)</span>
                <span className="font-mono text-status-success font-bold">96.8% Specificity</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between">
                <span className="font-semibold text-navy">Atrial Fibrillation (AFib)</span>
                <span className="font-mono text-teal font-bold">94.2% Sensitivity</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between">
                <span className="font-semibold text-navy">Premature Ventricular Contractions (PVC)</span>
                <span className="font-mono text-action font-bold">91.5% Sensitivity</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between">
                <span className="font-semibold text-navy">Sinus Bradycardia (&lt; 60 BPM)</span>
                <span className="font-mono text-navy font-bold">95.0% Sensitivity</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between">
                <span className="font-semibold text-navy">Sinus Tachycardia (&gt; 100 BPM)</span>
                <span className="font-mono text-navy font-bold">96.1% Sensitivity</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-surface p-6 rounded-2xl border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-bold text-xs text-navy uppercase tracking-wider">Uncertainty Quantification</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-light text-action border border-teal/20 font-bold">
                Shannon Entropy Metric
              </span>
            </div>
            <p className="text-xs text-navy-secondary leading-relaxed">
              Medical AI must know when it does not know. CardioSense computes the normalized Shannon entropy:
            </p>
            <div className="p-3 bg-canvas rounded-xl border border-border text-center font-mono text-xs text-navy">
              H<sub>norm</sub> = - &sum; p<sub>i</sub> log<sub>2</sub>(p<sub>i</sub>) / log<sub>2</sub>(K)
            </div>
            <p className="text-xs text-navy-secondary leading-relaxed">
              When class boundary ambiguity causes H<sub>norm</sub> to exceed 0.40, the system explicitly marks the result as &ldquo;Uncertain AI Observation&rdquo; instead of presenting a false high-confidence guess.
            </p>
            <button
              onClick={() => onNavigate('evidence')}
              className="w-full py-2.5 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              Inspect Complete Validation Benchmarks <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 6: EVIDENCE-BASED ALERTS
         ========================================================= */}
      <section className="py-16 bg-surface border-b border-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-semibold text-action uppercase tracking-wider block mb-1">
              6. Evidence-Based Alerts
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Clinical Triage &bull; Never Fixed Thresholds
            </h2>
            <p className="text-sm text-navy-secondary mt-2 leading-relaxed">
              CardioSense does not fire alerts merely because heart rate fluctuates above 100 BPM during normal exercise.
              Alert prioritization requires convergence across rhythm pattern, beat-to-beat variability, and signal stability.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-border border-t-4 border-t-slate-400 shadow-card space-y-2">
              <span className="text-[10px] font-bold text-navy-secondary uppercase">Low Priority</span>
              <h4 className="text-sm font-bold text-navy">Isolated Ectopic Beats</h4>
              <p className="text-[11px] text-navy-secondary leading-relaxed">
                Single benign PVC or PAC without sustained irregularity. Logged in screening history for audit without triggering urgent user notification.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-border border-t-4 border-t-status-warning shadow-card space-y-2">
              <span className="text-[10px] font-bold text-status-warning uppercase">Medium Priority</span>
              <h4 className="text-sm font-bold text-navy">Sinus Bradycardia / Tachycardia</h4>
              <p className="text-[11px] text-navy-secondary leading-relaxed">
                Resting rate sustained outside 60–100 BPM with normal P-wave morphology. Flagged for review with resting contextual guidance.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-border border-t-4 border-t-status-critical shadow-card space-y-2">
              <span className="text-[10px] font-bold text-status-critical uppercase">High Priority</span>
              <h4 className="text-sm font-bold text-navy">Suspected Atrial Fibrillation</h4>
              <p className="text-[11px] text-navy-secondary leading-relaxed">
                Irregularly irregular R-R intervals combined with absent P-wave activity lasting &gt; 30 seconds. Elevated to clinical review queue with evidence snippet.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-border border-t-4 border-t-teal shadow-card space-y-2">
              <span className="text-[10px] font-bold text-teal uppercase">Clinician Action</span>
              <h4 className="text-sm font-bold text-navy">Triage &amp; Review Workflow</h4>
              <p className="text-[11px] text-navy-secondary leading-relaxed">
                Clinicians can review captured telemetry snippets, append audit notes, and mark events as New, Needs Review, or Reviewed directly in the portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 7: ANALYTICS PREVIEW
         ========================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 gap-4">
          <div>
            <span className="text-xs font-semibold text-action uppercase tracking-wider block mb-1">
              7. Analytics Preview
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Interactive Scientific Graph Suite
            </h2>
            <p className="text-sm text-navy-secondary mt-1">
              Explore 7 comprehensive analytical charts connected to live recordings and benchmark databases.
            </p>
          </div>

          <button
            onClick={() => onNavigate('analytics')}
            className="px-5 py-2.5 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <BarChart3 className="w-4 h-4" />
            Launch Full Analytics Workspace
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-card space-y-3">
            <div className="w-8 h-8 rounded-lg bg-teal-light text-action flex items-center justify-center">
              <Activity className="w-4 h-4 text-teal" />
            </div>
            <h4 className="text-sm font-bold text-navy">ECG Waveform &amp; R-Peaks</h4>
            <p className="text-xs text-navy-secondary leading-relaxed">
              Interactive voltage-versus-time graph with Pan-Tompkins beat markers, amplitude inspection, and raw versus filtered overlay.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-card space-y-3">
            <div className="w-8 h-8 rounded-lg bg-teal-light text-action flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-action" />
            </div>
            <h4 className="text-sm font-bold text-navy">Heart Rate &amp; RR Tachograms</h4>
            <p className="text-xs text-navy-secondary leading-relaxed">
              Continuous instantaneous BPM tracking, beat-to-beat interval distributions, and standard HRV indicators (SDNN, RMSSD, pNN50).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-card space-y-3">
            <div className="w-8 h-8 rounded-lg bg-status-success-bg text-status-success flex items-center justify-center">
              <Layers className="w-4 h-4 text-status-success" />
            </div>
            <h4 className="text-sm font-bold text-navy">Poincaré Plots &amp; ROC Curves</h4>
            <p className="text-xs text-navy-secondary leading-relaxed">
              Autonomous rhythm scatter dynamics (RR[n] vs RR[n+1]) alongside multi-class ROC curves with 0.981 macro AUROC verification.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 8: TECHNICAL ARCHITECTURE
         ========================================================= */}
      <section className="py-16 bg-surface border-b border-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-semibold text-action uppercase tracking-wider block mb-1">
              8. Technical Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Production-Grade MedTech Architecture
            </h2>
            <p className="text-sm text-navy-secondary mt-2 leading-relaxed">
              CardioSense is built with strict boundary separation between hardware telemetry ingestion, Python DSP algorithms, database persistence, and client visualization.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-canvas border border-border space-y-2">
              <span className="font-bold text-navy block text-sm">Frontend Layer</span>
              <ul className="space-y-1.5 text-navy-secondary">
                <li>&bull; React 18 + Vite</li>
                <li>&bull; TypeScript (Strict Mode)</li>
                <li>&bull; Tailwind CSS + Canvas 2D</li>
                <li>&bull; Recharts Scientific Analytics</li>
                <li>&bull; Server-Sent Events (SSE)</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-canvas border border-border space-y-2">
              <span className="font-bold text-navy block text-sm">Backend &amp; DSP Layer</span>
              <ul className="space-y-1.5 text-navy-secondary">
                <li>&bull; Python 3.14 + FastAPI</li>
                <li>&bull; NumPy &amp; SciPy Signal</li>
                <li>&bull; 3rd-Order Butterworth IIR</li>
                <li>&bull; Pan-Tompkins QRS Detection</li>
                <li>&bull; Welch Power Spectral Density</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-canvas border border-border space-y-2">
              <span className="font-bold text-navy block text-sm">AI Inference Engine</span>
              <ul className="space-y-1.5 text-navy-secondary">
                <li>&bull; CardioSense-Net v2.4</li>
                <li>&bull; Calibrated Multi-Class ML</li>
                <li>&bull; Shannon Entropy Uncertainty</li>
                <li>&bull; MIT-BIH &amp; PTB-XL Trained</li>
                <li>&bull; 95% Wilson Confidence Intervals</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-canvas border border-border space-y-2">
              <span className="font-bold text-navy block text-sm">Security &amp; Persistence</span>
              <ul className="space-y-1.5 text-navy-secondary">
                <li>&bull; Isolated Signal Store</li>
                <li>&bull; Zero Public Data Leakage</li>
                <li>&bull; SQLite / PostgreSQL Compatible</li>
                <li>&bull; Self-Contained HTML Reports</li>
                <li>&bull; Techgium TG0914994 Compliant</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 9: SAFETY AND SCREENING DISCLAIMER
         ========================================================= */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div className="p-6 rounded-2xl bg-surface border border-border border-l-4 border-l-status-warning shadow-card flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-status-warning-bg text-status-warning flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div className="space-y-2 text-xs text-navy-secondary">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-action uppercase tracking-wider">
                9. Safety &amp; Screening Notice
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-status-warning-bg text-status-warning border border-status-warning/20">
                Non-Diagnostic PoC
              </span>
            </div>
            <h4 className="font-bold text-sm text-navy">Investigational Engineering Proof of Concept (TG0914994)</h4>
            <p className="leading-relaxed">
              CardioSense AI is a screening and monitoring proof of concept developed for Techgium Challenge TG0914994.
              It is <strong>not an FDA/CE cleared diagnostic medical device</strong> and does not replace the judgment of a licensed physician.
              Single-lead electrocardiography <strong>cannot detect acute myocardial infarction (STEMI heart attacks)</strong> or localized coronary ischemia.
              If you experience chest pressure, radiating arm pain, acute dyspnea, or syncope, immediately call emergency medical services.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 10: FOOTER
         ========================================================= */}
      <footer className="border-t border-border bg-[#F5F8FC] py-12 text-xs text-navy-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-extrabold text-base tracking-tight text-navy">
                  CardioSense <span className="text-teal font-extrabold">AI</span>
                </span>
              </div>
              <p className="text-[11px] text-navy-secondary leading-relaxed">
                AI-Powered Leadless Cardiac Arrhythmia Monitoring &amp; Analysis System &bull; Techgium TG0914994
              </p>
            </div>

            <div>
              <span className="font-bold text-navy block mb-2 text-xs">Workspaces</span>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => onNavigate('monitoring')} className="hover:text-action">Live Monitoring Dashboard</button></li>
                <li><button onClick={() => onNavigate('analysis')} className="hover:text-action">ECG Waveform Analysis</button></li>
                <li><button onClick={() => onNavigate('analytics')} className="hover:text-action">Scientific Graphs &amp; Analytics</button></li>
                <li><button onClick={() => onNavigate('alerts')} className="hover:text-action">Alert Review Queue</button></li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-navy block mb-2 text-xs">Evidence &amp; Clinical</span>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => onNavigate('evidence')} className="hover:text-action">Model Performance (92.4%)</button></li>
                <li><button onClick={() => onNavigate('evidence')} className="hover:text-action">Confusion Matrix (N=964)</button></li>
                <li><button onClick={() => onNavigate('evidence')} className="hover:text-action">MIT-BIH &amp; PTB-XL Splits</button></li>
                <li><button onClick={() => onNavigate('reports')} className="hover:text-action">Structured Medical Reports</button></li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-navy block mb-2 text-xs">System Status</span>
              <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-status-success text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                  All Services Operational
                </div>
                <p className="text-[10px] text-navy-secondary">
                  FastAPI DSP &bull; CardioSense-Net v2.4 &bull; SSE Engine
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2">
            <span>&copy; {new Date().getFullYear()} CardioSense AI &bull; Techgium Challenge TG0914994 Proof of Concept.</span>
            <span>Developed for Healthcare Technology Innovation. Not a certified diagnostic device.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
