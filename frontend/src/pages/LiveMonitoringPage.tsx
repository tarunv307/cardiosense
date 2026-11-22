import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Heart,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Square,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Printer,
  ChevronRight,
  Radio,
  FileText,
  Sliders,
  Sparkles,
  Info,
  ShieldAlert,
  Layers,
  Cpu,
  Check,
  BookOpenCheck
} from 'lucide-react';
import { LiveECGCanvas } from '../components/ecg/LiveECGCanvas';
import { MainNavTab } from '../components/layout/TopNav';

interface LiveMonitoringPageProps {
  connectionStatus: string;
  onSetConnectionStatus: (status: string) => void;
  selectedScenario: string;
  onSelectScenario: (scenario: string) => void;
  onNavigate: (tab: MainNavTab) => void;
  onOpenDeviceModal: () => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  connectionStatus,
  onSetConnectionStatus,
  selectedScenario,
  onSelectScenario,
  onNavigate,
  onOpenDeviceModal,
}) => {
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [liveSamples, setLiveSamples] = useState<number[]>([]);
  const [liveBpm, setLiveBpm] = useState<number | null>(72);
  const [liveSqi, setLiveSqi] = useState<number>(96);
  const [liveSqiStatus, setLiveSqiStatus] = useState<string>('GOOD');
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [screeningText, setScreeningText] = useState<string>(
    'Normal sinus rhythm pattern observed'
  );
  const [screeningCode, setScreeningCode] = useState<string>('NORMAL');

  // Explainability & Transparency state
  const [analysedWindow, setAnalysedWindow] = useState<{
    start_sec: number;
    end_sec: number;
    duration_sec: number;
  }>({ start_sec: 0, end_sec: 0, duration_sec: 0 });

  const [whyGenerated, setWhyGenerated] = useState<string>(
    'Regular heartbeat intervals with consistent P-QRS-T morphology.'
  );

  const [signalCharacteristics, setSignalCharacteristics] = useState<{
    mean_rr_ms: number;
    rmssd_ms: number;
    qrs_duration_ms: number;
    p_wave_present: boolean;
    resting_rate_bpm: number | null;
  }>({
    mean_rr_ms: 833,
    rmssd_ms: 26.4,
    qrs_duration_ms: 88,
    p_wave_present: true,
    resting_rate_bpm: 72,
  });

  const [processingPipeline, setProcessingPipeline] = useState<string>(
    '3rd-Order Butterworth (0.5-40Hz) -> Pan-Tompkins QRS -> CardioSense-Net v2.4'
  );
  const [modelVersion, setModelVersion] = useState<string>(
    'CardioSense-Net v2.4 (Calibrated Ensemble)'
  );
  const [algorithmUsed, setAlgorithmUsed] = useState<string>(
    'Pan-Tompkins QRS Wavelet + Calibrated Multi-Class Classifier'
  );

  const [events, setEvents] = useState<
    { id: string; time: number; type: string; message: string; snippet: number[] }[]
  >([]);

  // Selected event for snippet preview
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    time: number;
    type: string;
    message: string;
    snippet: number[];
  } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Manage continuous SSE stream
  useEffect(() => {
    if (!isMonitoring || connectionStatus === 'DISCONNECTED') {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const url = `/api/stream/live-ecg?mode=live&scenario=${selectedScenario}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      onSetConnectionStatus('CONNECTED');
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.samples && Array.isArray(data.samples)) {
          setLiveSamples((prev) => {
            const next = [...prev, ...data.samples];
            return next.length > 2500 ? next.slice(-2500) : next;
          });
        }
        if (data.bpm !== undefined) setLiveBpm(data.bpm);
        if (data.sqi_score !== undefined) setLiveSqi(data.sqi_score);
        if (data.sqi_status) setLiveSqiStatus(data.sqi_status);
        if (data.elapsed_seconds !== undefined) setElapsedSec(data.elapsed_seconds);
        if (data.screening_category) setScreeningText(data.screening_category);
        if (data.screening_code) setScreeningCode(data.screening_code);

        if (data.analysed_window) setAnalysedWindow(data.analysed_window);
        if (data.why_generated) setWhyGenerated(data.why_generated);
        if (data.signal_characteristics) setSignalCharacteristics(data.signal_characteristics);
        if (data.processing_pipeline) setProcessingPipeline(data.processing_pipeline);
        if (data.model_version) setModelVersion(data.model_version);
        if (data.algorithm_used) setAlgorithmUsed(data.algorithm_used);

        if (data.event_flag) {
          const newEvt = {
            id: `evt_${Date.now()}`,
            time: data.event_flag.timestamp_sec,
            type: data.event_flag.type,
            message: data.event_flag.message,
            snippet: data.samples,
          };
          setEvents((prev) => [newEvt, ...prev.slice(0, 9)]);
        }
      } catch (err) {
        console.error('Failed to parse SSE packet', err);
      }
    };

    es.onerror = () => {
      if (connectionStatus === 'CONNECTED') {
        onSetConnectionStatus('RECONNECTING');
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isMonitoring, connectionStatus, selectedScenario]);

  // Controls: Start, Pause, Resume, Stop
  const handleStart = () => {
    setIsMonitoring(true);
    if (connectionStatus === 'DISCONNECTED') {
      onSetConnectionStatus('CONNECTED');
    }
  };

  const handlePause = () => {
    setIsMonitoring(false);
  };

  const handleStop = () => {
    setIsMonitoring(false);
    setLiveSamples([]);
    setEvents([]);
    setElapsedSec(0);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDisconnected = connectionStatus === 'DISCONNECTED';
  const isPoorSignal = liveSqiStatus === 'INSUFFICIENT' || liveSqiStatus === 'DEGRADED';
  const isSimulation = selectedScenario.startsWith('rec_') || selectedScenario.includes('sample');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. Header with exact required titles */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-3 h-3 rounded-full bg-teal animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
              Your Heart Monitoring Overview
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-light text-action border border-teal/20">
              Live ECG
            </span>
          </div>
          <p className="text-xs text-navy-secondary">
            Review your device status, ECG activity, and recent screening observations.
          </p>
        </div>

        {/* Start / Pause / Resume / Stop Controls */}
        <div className="flex items-center gap-2">
          {isMonitoring && !isDisconnected ? (
            <button
              onClick={handlePause}
              className="px-4 py-2 rounded-xl border border-border bg-canvas text-navy font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-xs"
            >
              <Pause className="w-3.5 h-3.5 text-navy-secondary" />
              Pause
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-4 py-2 rounded-xl bg-action hover:bg-action-hover text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-card"
            >
              <Play className="w-3.5 h-3.5" />
              {liveSamples.length > 0 ? 'Resume' : 'Start'}
            </button>
          )}

          <button
            onClick={handleStop}
            className="px-3 py-2 rounded-xl border border-border bg-surface text-navy-secondary hover:text-status-critical hover:bg-status-critical-bg transition-colors text-xs font-semibold flex items-center gap-1.5"
            title="Reset Stream & Clear Buffer"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>

          <button
            onClick={onOpenDeviceModal}
            className="px-3.5 py-2 rounded-xl border border-border bg-canvas text-navy text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-teal" />
            Device Setup
          </button>
        </div>
      </div>

      {/* 2. Sample Data Mode Badge */}
      {isSimulation && (
        <div className="p-3.5 rounded-xl bg-status-warning-bg border border-status-warning/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-status-warning">
            <Info className="w-4 h-4 shrink-0 font-bold" />
            <span>
              <strong>Sample Data Mode Active:</strong> Currently streaming calibrated benchmark recording (
              <span className="font-mono font-semibold">{selectedScenario}</span>
              ). Simulated data is for engineering demonstration and validation only &mdash; never display simulated values as real patient measurements.
            </span>
          </div>
          <button
            onClick={onOpenDeviceModal}
            className="text-[11px] font-bold text-status-warning underline whitespace-nowrap shrink-0 hover:opacity-80"
          >
            Change Scenario
          </button>
        </div>
      )}

      {/* 3. Key Vital Metrics Strip (Full Width) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {/* Metric 1: Current Heart Rate */}
        <div className="bg-surface rounded-2xl border border-border border-t-4 border-t-status-critical p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-secondary">Current Heart Rate</span>
            <div className="w-8 h-8 rounded-lg bg-status-critical-bg text-status-critical flex items-center justify-center">
              <Heart className="w-4 h-4 fill-status-critical" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-navy">
              {isDisconnected || isPoorSignal ? '—' : liveBpm ?? '—'}
            </span>
            <span className="text-xs text-navy-secondary font-medium">BPM</span>
          </div>
          <span className="text-[11px] text-navy-secondary mt-1.5 block">
            {isDisconnected
              ? 'Sensor disconnected'
              : isPoorSignal
              ? 'Signal unstable'
              : liveBpm && liveBpm >= 60 && liveBpm <= 100
              ? 'Normal resting range (60–100 BPM)'
              : 'Outside typical resting range'}
          </span>
        </div>

        {/* Metric 2: Signal Quality Status (SQI) */}
        <div className="bg-surface rounded-2xl border border-border border-t-4 border-t-teal p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-secondary">Signal Quality (SQI)</span>
            <div className="w-8 h-8 rounded-lg bg-teal-light text-action flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-navy">
              {isDisconnected ? '0' : liveSqi}
            </span>
            <span className="text-xs text-navy-secondary">/100</span>
          </div>
          <span
            className={`text-[11px] font-semibold mt-1.5 block ${
              isDisconnected || isPoorSignal ? 'text-status-critical' : 'text-status-success'
            }`}
          >
            {isDisconnected
              ? 'No Sensor Connected'
              : liveSqi >= 90
              ? 'Good Quality • High SNR'
              : liveSqi >= 75
              ? 'Good Quality • Clear Waveform'
              : liveSqi >= 60
              ? 'Acceptable • Mild Drift'
              : 'Degraded Signal • Check Contact'}
          </span>
        </div>

        {/* Metric 3: Monitoring Duration */}
        <div className="bg-surface rounded-2xl border border-border border-t-4 border-t-teal p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-secondary">Recording Duration</span>
            <div className="w-8 h-8 rounded-lg bg-teal-light text-action flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-navy">
            {formatTime(elapsedSec)}
          </div>
          <span className="text-[11px] text-navy-secondary mt-1.5 block font-mono">
            {isMonitoring ? 'Continuous Telemetry Run' : 'Monitoring Paused'}
          </span>
        </div>

        {/* Metric 4: Device Connection Status */}
        <div className="bg-surface rounded-2xl border border-border border-t-4 border-t-status-success p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-secondary">Device Connection</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDisconnected
                  ? 'bg-slate-100 text-navy-secondary'
                  : 'bg-status-success-bg text-status-success'
              }`}
            >
              {isDisconnected ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isDisconnected
                  ? 'bg-slate-300'
                  : isPoorSignal
                  ? 'bg-status-warning'
                  : 'bg-status-success animate-pulse'
              }`}
            />
            <span className="text-base font-bold text-navy">
              {isDisconnected
                ? 'DISCONNECTED'
                : isPoorSignal
                ? 'CHECK LEAD'
                : 'PATCH ACTIVE'}
            </span>
          </div>
          <span className="text-[11px] text-navy-secondary mt-1.5 block">
            {isDisconnected ? 'Connect wireless patch sensor' : 'BLE 5.2 • 250 Hz Stream • Lead I'}
          </span>
        </div>
      </div>

      {/* 4. Live ECG Waveform Display (Oscilloscope) */}
      <div className="space-y-2">
        {isDisconnected ? (
          /* Realistic Disconnected State */
          <div className="bg-surface rounded-2xl border border-dashed border-border p-12 text-center shadow-card space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-navy-secondary flex items-center justify-center mx-auto">
              <WifiOff className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy">Leadless ECG Patch Disconnected</h3>
              <p className="text-xs text-navy-secondary max-w-md mx-auto mt-1">
                No telemetry signal received. Please make sure your wireless patch is powered on and adhering firmly to the chest.
              </p>
            </div>
            <button
              onClick={() => onSetConnectionStatus('CONNECTED')}
              className="px-5 py-2.5 rounded-xl bg-action hover:bg-action-hover text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Reconnect Sensor
            </button>
          </div>
        ) : (
          <LiveECGCanvas
            samples={liveSamples}
            samplingRate={250}
            isStreaming={isMonitoring}
            onToggleStreaming={handleStart}
            onClearBuffer={handleStop}
            connectionStatus={connectionStatus}
            height={320}
          />
        )}
      </div>

      {/* 5. DEDICATED REAL-TIME AI EXPLAINABILITY & TRANSPARENCY PANEL (Sections A, G & Final Requirement) */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-6">
        
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                screeningCode === 'NORMAL' && !isDisconnected && !isPoorSignal
                  ? 'bg-status-success-bg text-status-success'
                  : isDisconnected || isPoorSignal
                  ? 'bg-status-warning-bg text-status-warning'
                  : 'bg-status-critical-bg text-status-critical'
              }`}
            >
              {screeningCode === 'NORMAL' && !isDisconnected && !isPoorSignal ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : isDisconnected || isPoorSignal ? (
                <HelpCircle className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-secondary block">
                  AI Screening Observation
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-canvas text-navy border border-border">
                  {modelVersion}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-status-info-bg text-status-info border border-status-info/20">
                  Evidence-Supported
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-navy mt-0.5">
                {isDisconnected
                  ? 'Device Disconnected — Observation Suspended'
                  : isPoorSignal
                  ? 'Insufficient Signal Quality — Check Skin Contact'
                  : screeningText}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigate('evidence')}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-action hover:bg-teal-light transition-colors flex items-center gap-1.5"
            >
              <BookOpenCheck className="w-3.5 h-3.5" />
              Model Evidence
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-3 py-1.5 rounded-lg bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              Export Report
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-Time Processing Status Pipeline */}
        <div className="p-3 rounded-xl bg-canvas border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-navy-secondary block mb-2">
            Active Processing Pipeline:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-surface border border-border flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-status-success-bg text-status-success font-bold text-[10px] flex items-center justify-center">1</span>
              <div>
                <span className="font-semibold text-navy block text-[11px]">0.5–40 Hz Filter</span>
                <span className="text-[10px] text-navy-secondary">Butterworth IIR</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-border flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-status-success-bg text-status-success font-bold text-[10px] flex items-center justify-center">2</span>
              <div>
                <span className="font-semibold text-navy block text-[11px]">Pan-Tompkins QRS</span>
                <span className="text-[10px] text-navy-secondary">R-Peak Detector</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-border flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-status-success-bg text-status-success font-bold text-[10px] flex items-center justify-center">3</span>
              <div>
                <span className="font-semibold text-navy block text-[11px]">Feature Extraction</span>
                <span className="text-[10px] text-navy-secondary">RMSSD, CV, QRS width</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-border flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-status-success-bg text-status-success font-bold text-[10px] flex items-center justify-center">4</span>
              <div>
                <span className="font-semibold text-navy block text-[11px]">Calibrated Screening</span>
                <span className="text-[10px] text-navy-secondary">CardioSense-Net</span>
              </div>
            </div>
          </div>
        </div>

        {/* The Three Essential Questions Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-left">
          {/* Question 1: What did the model observe? */}
          <div className="p-5 rounded-2xl bg-canvas border border-border border-t-4 border-t-teal space-y-2 flex flex-col justify-between shadow-subtle">
            <div>
              <span className="font-bold text-navy flex items-center gap-1.5 text-xs mb-1.5">
                <Activity className="w-4 h-4 text-teal" /> 1. What Did the Model Observe?
              </span>
              <p className="text-navy-secondary leading-relaxed">
                {whyGenerated}
              </p>
            </div>
            <div className="pt-3 border-t border-border font-mono text-[11px] text-navy-secondary space-y-1">
              <div className="flex justify-between">
                <span>Analysed Window:</span>
                <strong className="text-navy">[{analysedWindow.start_sec.toFixed(1)}s &ndash; {analysedWindow.end_sec.toFixed(1)}s]</strong>
              </div>
              <div className="flex justify-between">
                <span>Segment Duration:</span>
                <strong className="text-navy">{analysedWindow.duration_sec.toFixed(1)}s</strong>
              </div>
              <div className="flex justify-between">
                <span>Signal SQI:</span>
                <strong className="text-status-success">{liveSqi}/100 ({liveSqiStatus})</strong>
              </div>
            </div>
          </div>

          {/* Question 2: What evidence supports the model's performance? */}
          <div className="p-5 rounded-2xl bg-canvas border border-border border-t-4 border-t-teal space-y-2 flex flex-col justify-between shadow-subtle">
            <div>
              <span className="font-bold text-navy flex items-center gap-1.5 text-xs mb-1.5">
                <Cpu className="w-4 h-4 text-action" /> 2. What Evidence Supports This?
              </span>
              <p className="text-navy-secondary leading-relaxed">
                Screened using <strong>{algorithmUsed}</strong>.
                Benchmarked on 4,820 clinical segments (MIT-BIH &amp; PTB-XL) with <strong>92.4% Accuracy</strong> [90.6&ndash;94.0] and <strong>91.7% Sensitivity</strong>.
              </p>
            </div>
            <div className="pt-3 border-t border-border text-[11px] text-navy-secondary">
              <button
                onClick={() => onNavigate('evidence')}
                className="text-action font-semibold hover:underline flex items-center gap-1"
              >
                Inspect Full Performance Dashboard <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Question 3: What are the limitations of this result? */}
          <div className="p-5 rounded-2xl bg-canvas border border-border border-t-4 border-t-status-warning space-y-2 flex flex-col justify-between shadow-subtle">
            <div>
              <span className="font-bold text-navy flex items-center gap-1.5 text-xs mb-1.5">
                <ShieldAlert className="w-4 h-4 text-status-warning" /> 3. What Are the Limitations?
              </span>
              <p className="text-navy-secondary leading-relaxed">
                CardioSense AI is a screening Proof of Concept (TG0914994). Single-lead ECG <strong>cannot detect STEMI heart attacks</strong> or localized ischemia.
              </p>
            </div>
            <div className="pt-3 border-t border-border text-[11px] text-status-warning font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Mandatory licensed physician review required.
            </div>
          </div>
        </div>

        {/* Relevant Signal Characteristics Telemetry Grid */}
        <div className="text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-navy-secondary block mb-2">
            Relevant Signal Characteristics (Extracted from Analysed Segment):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-canvas border border-border hover:bg-slate-50 transition-colors">
              <span className="text-[10px] text-navy-secondary block">Mean R-R Interval</span>
              <span className="text-base font-bold font-mono text-navy">
                {signalCharacteristics.mean_rr_ms} <span className="text-[10px] font-normal text-navy-secondary">ms</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border hover:bg-slate-50 transition-colors">
              <span className="text-[10px] text-navy-secondary block">HRV (RMSSD)</span>
              <span className="text-base font-bold font-mono text-navy">
                {signalCharacteristics.rmssd_ms} <span className="text-[10px] font-normal text-navy-secondary">ms</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border hover:bg-slate-50 transition-colors">
              <span className="text-[10px] text-navy-secondary block">QRS Duration</span>
              <span className="text-base font-bold font-mono text-navy">
                {signalCharacteristics.qrs_duration_ms} <span className="text-[10px] font-normal text-navy-secondary">ms</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border hover:bg-slate-50 transition-colors">
              <span className="text-[10px] text-navy-secondary block">P-Wave Activity</span>
              <span
                className={`text-xs font-bold block mt-1 ${
                  signalCharacteristics.p_wave_present ? 'text-status-success' : 'text-status-critical'
                }`}
              >
                {signalCharacteristics.p_wave_present ? 'Present (Sinus)' : 'Absent / Chaotic'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border hover:bg-slate-50 transition-colors">
              <span className="text-[10px] text-navy-secondary block">Resting Rate</span>
              <span className="text-base font-bold font-mono text-navy">
                {signalCharacteristics.resting_rate_bpm ?? liveBpm ?? '—'}{' '}
                <span className="text-[10px] font-normal text-navy-secondary">BPM</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Flagged Rhythm Event Timeline & Snippets */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-light text-action flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">Flagged Rhythm Events Timeline</h3>
              <p className="text-xs text-navy-secondary">
                Telemetry segments flagged for detailed clinical review
              </p>
            </div>
          </div>

          <span className="text-xs font-mono bg-canvas px-2.5 py-1 rounded-lg text-navy-secondary border border-border">
            {events.length} flagged events
          </span>
        </div>

        {events.length > 0 ? (
          <div className="divide-y divide-border">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy">{ev.message}</span>
                    <span className="font-mono text-navy-secondary text-[11px]">at {ev.time}s</span>
                  </div>
                  <p className="text-[11px] text-navy-secondary">
                    Lead I telemetry snippet captured and logged with metadata.
                  </p>
                </div>

                <button
                  onClick={() => setSelectedEvent(ev)}
                  className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-border text-action font-semibold text-xs hover:bg-teal-light transition-colors"
                >
                  Inspect Segment
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-navy-secondary bg-canvas rounded-xl border border-border">
            <CheckCircle2 className="w-6 h-6 text-status-success mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-navy">No irregular rhythm events flagged</p>
            <p className="text-[11px] text-navy-secondary mt-0.5">
              Detected beats are currently exhibiting steady sinus rhythm intervals.
            </p>
          </div>
        )}
      </div>

      {/* Snippet Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-elevated w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-navy">Flagged Event Segment Inspection</h3>
                <span className="text-xs text-navy-secondary font-mono">
                  Timestamp: {selectedEvent.time}s &bull; {selectedEvent.message}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-navy-secondary hover:text-navy hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-navy-secondary">
              This ECG window was flagged because successive R-R intervals or morphological wavelet features diverged from the baseline reference profile.
            </p>

            <div className="p-3 bg-canvas rounded-xl border border-border text-xs font-mono text-navy">
              Raw Segment Samples: {selectedEvent.snippet.slice(0, 10).join(', ')} ...
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-action hover:bg-action-hover text-white font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
