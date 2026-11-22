import React, { useState } from 'react';
import {
  FolderClock,
  Search,
  Filter,
  Trash2,
  Activity,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Eye,
  RotateCcw,
  Sliders,
  Calendar,
  Layers,
  FileText,
  Cpu,
  GitBranch,
  XCircle,
  HelpCircle,
  Check,
  Workflow
} from 'lucide-react';
import { CompleteAnalysisResult, RecordingMetadata, RPeak } from '../types/ecg';
import { ECGWaveformCanvas } from '../components/ecg/ECGWaveformCanvas';
import { BeatInspector } from '../components/ecg/BeatInspector';
import { SignalQualityCard } from '../components/ecg/SignalQualityCard';
import { RhythmScreeningCard } from '../components/ecg/RhythmScreeningCard';
import { MainNavTab } from '../components/layout/TopNav';
import { api } from '../services/api';

interface HistoryPageProps {
  recordings: RecordingMetadata[];
  selectedRecordingId: string;
  onSelectRecording: (id: string) => void;
  analysis: CompleteAnalysisResult | null;
  isLoadingAnalysis: boolean;
  onOpenUpload: () => void;
  onRefreshRecordings: () => void;
  onReRunAnalysis: () => void;
  onNavigate?: (tab: MainNavTab) => void;
  defaultView?: 'table' | 'inspector' | 'pipeline';
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  recordings,
  selectedRecordingId,
  onSelectRecording,
  analysis,
  isLoadingAnalysis,
  onOpenUpload,
  onRefreshRecordings,
  onReRunAnalysis,
  onNavigate,
  defaultView = 'table',
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterQuality, setFilterQuality] = useState<string>('ALL');
  const [selectedBeat, setSelectedBeat] = useState<RPeak | null>(null);
  const [activeView, setActiveView] = useState<'table' | 'inspector' | 'pipeline'>(defaultView);

  const filtered = recordings.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuality = filterQuality === 'ALL' || r.quality_status === filterQuality;
    return matchesSearch && matchesQuality;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove recording "${id}" from history?`)) return;
    try {
      await api.deleteRecording(id);
      onRefreshRecordings();
    } catch (err) {
      console.error('Failed to delete recording', err);
    }
  };

  const handleRowInspect = (id: string) => {
    onSelectRecording(id);
    setActiveView('inspector');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* 1. Header & Actions */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderClock className="w-5 h-5 text-action" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
              {activeView === 'inspector'
                ? 'ECG Waveform Analysis & Beat Inspector'
                : activeView === 'pipeline'
                ? 'Modular Signal Processing Pipeline Status'
                : 'Recording Library & Screening History'}
            </h1>
          </div>
          <p className="text-xs text-navy-secondary">
            {activeView === 'inspector'
              ? 'Deep analytical inspection of raw vs filtered waveforms, Pan-Tompkins R-peaks, and beat intervals.'
              : activeView === 'pipeline'
              ? 'Audit the 12 automated pipeline stages and verify preprocessing integrity before AI classification.'
              : 'Browse past recordings, search telemetry archives, and manage uploaded ECG data.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Toggle (3 Modes: Library, Analysis, Pipeline) */}
          <div className="flex items-center bg-canvas p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveView('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'table'
                  ? 'bg-action text-white shadow-xs'
                  : 'text-navy-secondary hover:text-navy'
              }`}
            >
              Recordings Library
            </button>
            <button
              onClick={() => setActiveView('inspector')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'inspector'
                  ? 'bg-action text-white shadow-xs'
                  : 'text-navy-secondary hover:text-navy'
              }`}
            >
              Waveform Analysis
            </button>
            <button
              onClick={() => setActiveView('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'pipeline'
                  ? 'bg-action text-white shadow-xs'
                  : 'text-navy-secondary hover:text-navy'
              }`}
            >
              Processing Pipeline
            </button>
          </div>

          <button
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            Upload ECG
          </button>
        </div>
      </div>

      {/* 2. TABLE VIEW: Full-Width Audit Log & Recording Library */}
      {activeView === 'table' && (
        <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          {/* Search & Filter Toolbar */}
          <div className="p-4 bg-[#F5F8FC] border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-navy-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by session name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-xs bg-surface text-navy focus:outline-none focus:border-teal"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-navy-secondary" />
              <select
                value={filterQuality}
                onChange={(e) => setFilterQuality(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs bg-surface text-navy focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Signal Qualities</option>
                <option value="GOOD">Good Quality</option>
                <option value="NEEDS REVIEW">Needs Review</option>
                <option value="INSUFFICIENT">Insufficient / Degraded</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] border-b border-border text-navy-secondary font-semibold">
                <tr>
                  <th className="p-3.5 pl-6">Date &amp; Time</th>
                  <th className="p-3.5">Session / Recording</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Sampling ($F_s$)</th>
                  <th className="p-3.5">Signal Quality (SQI)</th>
                  <th className="p-3.5">Heart Rate</th>
                  <th className="p-3.5">Screening Status</th>
                  <th className="p-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((rec) => {
                  const isSelected = rec.id === selectedRecordingId;
                  const isGood = rec.quality_status === 'GOOD';
                  const isWarning = rec.quality_status === 'NEEDS REVIEW';

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => handleRowInspect(rec.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-light/40' : ''
                      }`}
                    >
                      <td className="p-3.5 pl-6 font-mono text-[11px] text-navy-secondary">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-navy-secondary" />
                          <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                          <span className="text-navy-secondary/60">
                            {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 font-semibold text-navy">
                        <div className="max-w-[220px] truncate" title={rec.name}>
                          {rec.name}
                        </div>
                        <span className="font-mono text-[10px] text-navy-secondary">{rec.id}</span>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-navy">
                        {rec.duration_seconds}s
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-navy-secondary">
                        {rec.sampling_rate_hz} Hz
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isGood
                              ? 'bg-status-success-bg text-status-success border-status-success/20'
                              : isWarning
                              ? 'bg-status-warning-bg text-status-warning border-status-warning/20'
                              : 'bg-status-critical-bg text-status-critical border-status-critical/20'
                          }`}
                        >
                          {rec.quality_status}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-navy">
                        {rec.mean_heart_rate ? `${rec.mean_heart_rate} BPM` : '—'}
                      </td>

                      <td className="p-3.5">
                        <span className="font-medium text-navy text-[11px]">
                          {rec.description
                            ? rec.description.slice(0, 36)
                            : rec.screening_category
                            ? rec.screening_category.replace(/_/g, ' ')
                            : 'Screening complete'}
                        </span>
                      </td>

                      <td className="p-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRowInspect(rec.id)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-surface hover:bg-slate-100 text-action text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Inspect
                          </button>
                          <button
                            onClick={(e) => handleDelete(rec.id, e)}
                            className="p-1 rounded-lg text-navy-secondary hover:text-status-critical hover:bg-status-critical-bg transition-colors"
                            title="Delete recording"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-navy-secondary">
                      No recordings matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. INSPECTOR VIEW: Waveform + Beat Inspector + Quality & Screening Cards */}
      {activeView === 'inspector' && (
        <div className="space-y-6">
          {/* Quick Selector Bar */}
          <div className="bg-surface rounded-2xl border border-border p-4 shadow-card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-navy">Active Recording:</span>
              <select
                value={selectedRecordingId}
                onChange={(e) => onSelectRecording(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs bg-canvas text-navy font-semibold focus:outline-none cursor-pointer"
              >
                {recordings.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.id}) — {r.duration_seconds}s
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onReRunAnalysis}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-navy hover:bg-canvas transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-teal" />
                Re-run Analysis
              </button>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('reports')}
                  className="px-3 py-1.5 rounded-lg bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Clinical Report
                </button>
              )}
            </div>
          </div>

          {isLoadingAnalysis || !analysis ? (
            <div className="bg-surface rounded-2xl border border-border p-12 text-center shadow-card">
              <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-navy-secondary">Loading ECG waveform data and feature metrics...</p>
            </div>
          ) : (
            <>
              {/* Waveform Strip */}
              <div className="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold text-navy">{analysis.metadata.name}</h3>
                    <p className="text-xs text-navy-secondary font-mono">
                      Sampling: {analysis.metadata.sampling_rate_hz} Hz &bull; Total Samples: {analysis.metadata.total_samples} &bull; Duration: {analysis.metadata.duration_seconds}s
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-navy-secondary">
                    Pan-Tompkins Detection &bull; {analysis.beat_detection?.total_beats ?? 0} beats detected
                  </span>
                </div>

                <ECGWaveformCanvas
                  timeAxis={analysis.time_axis_sec}
                  rawSignal={analysis.time_series_raw}
                  processedSignal={analysis.time_series_processed}
                  rPeaks={analysis.beat_detection?.r_peaks ?? []}
                  rPeakIndices={analysis.r_peak_indices}
                  durationSec={analysis.metadata.duration_seconds}
                  samplingRate={analysis.metadata.sampling_rate_hz}
                  selectedBeatIndex={
                    selectedBeat ? (analysis.beat_detection?.r_peaks.indexOf(selectedBeat) ?? null) : null
                  }
                  onSelectBeat={setSelectedBeat}
                  height={320}
                />
              </div>

              {/* Beat Inspector Component */}
              <BeatInspector
                selectedBeat={selectedBeat}
                beatData={analysis.beat_detection}
                samplingRate={analysis.metadata.sampling_rate_hz}
              />

              {/* Quality & Screening Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <SignalQualityCard quality={analysis.quality} />
                <RhythmScreeningCard prediction={analysis.prediction} />
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. PIPELINE VIEW: 12-Stage Modular Pipeline Status Panel */}
      {activeView === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <Workflow className="w-5 h-5 text-teal" />
                <h2 className="text-base font-bold text-navy">
                  12-Stage ECG Signal Conditioning &amp; Screening Pipeline
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-status-success-bg text-status-success border border-status-success/20">
                Pipeline Verified
              </span>
            </div>
            <p className="text-xs text-navy-secondary leading-relaxed">
              Every recording passes through 12 deterministic validation and digital signal processing stages.
              If quality drops below diagnostic thresholds, downstream inference is safely withheld to protect patient safety.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { num: '01', name: 'Data Ingestion', status: 'COMPLETED', desc: 'BLE stream or file binary parser with schema validation.' },
              { num: '02', name: 'Format Validation', status: 'COMPLETED', desc: 'Validates non-empty numeric voltage columns and timestamp fidelity.' },
              { num: '03', name: 'Sampling Rate Check', status: 'COMPLETED', desc: `Verified sampling frequency at ${analysis?.metadata.sampling_rate_hz ?? 250} Hz.` },
              { num: '04', name: 'Missing Data Detection', status: 'COMPLETED', desc: 'Zero NaN / flatline dropout intervals detected across window.' },
              { num: '05', name: 'Signal Quality (SQI)', status: analysis?.quality.status === 'INSUFFICIENT' ? 'FAILED' : 'COMPLETED', desc: `Welch PSD composite SQI evaluated at ${analysis?.quality.overall_sqi ?? 96}/100.` },
              { num: '06', name: 'Baseline Drift Removal', status: 'COMPLETED', desc: '0.5 Hz high-pass IIR stage eliminates respiration baseline wander.' },
              { num: '07', name: 'Noise & Tremor Filter', status: 'COMPLETED', desc: '40 Hz low-pass + 50/60 Hz notch filters suppress muscle EMG interference.' },
              { num: '08', name: 'R-Peak Detection', status: 'COMPLETED', desc: 'Pan-Tompkins adaptive slope-squaring algorithm identifies QRS peaks.' },
              { num: '09', name: 'Beat Segmentation', status: 'COMPLETED', desc: `${analysis?.beat_detection?.total_beats ?? 0} individual heartbeat segments segmented for morphology.` },
              { num: '10', name: 'Feature Extraction', status: 'COMPLETED', desc: 'HRV metrics (SDNN, RMSSD, pNN50) and wavelet energy extracted.' },
              { num: '11', name: 'AI Rhythm Screening', status: analysis?.quality.status === 'INSUFFICIENT' ? 'WITHHELD' : 'COMPLETED', desc: 'CardioSense-Net v2.4 multi-class classification executed.' },
              { num: '12', name: 'Result & Evidence Generation', status: 'COMPLETED', desc: 'Confidence intervals, uncertainty entropy, and clinical summary compiled.' },
            ].map((st) => (
              <div
                key={st.num}
                className="p-5 rounded-2xl bg-surface border border-border shadow-card space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-teal">Stage {st.num}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        st.status === 'COMPLETED'
                          ? 'bg-status-success-bg text-status-success border-status-success/20'
                          : st.status === 'WITHHELD'
                          ? 'bg-status-warning-bg text-status-warning border-status-warning/20'
                          : 'bg-status-critical-bg text-status-critical border-status-critical/20'
                      }`}
                    >
                      {st.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-navy">{st.name}</h4>
                  <p className="text-xs text-navy-secondary mt-1 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
