import React, { useRef, useEffect } from 'react';
import {
  FileBarChart2,
  Printer,
  Download,
  ShieldCheck,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Clock,
  Activity,
  FileText,
  HelpCircle
} from 'lucide-react';
import { CompleteAnalysisResult, RecordingMetadata } from '../types/ecg';

interface ReportsPageProps {
  analysis: CompleteAnalysisResult | null;
  isLoading: boolean;
  recordings?: RecordingMetadata[];
  selectedRecordingId?: string;
  onSelectRecording?: (id: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  analysis,
  isLoading,
  recordings = [],
  selectedRecordingId,
  onSelectRecording,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw miniature calibrated ECG rhythm strip on the report
  useEffect(() => {
    if (!analysis) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = 120 * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.offsetWidth;
    const height = 120;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Clinical grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Baseline
    const baseline = height * 0.55;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseline);
    ctx.lineTo(width, baseline);
    ctx.stroke();

    // Signal
    const signal = analysis.time_series_processed.slice(0, 750); // First 3-5 seconds
    if (signal.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#1E60E2';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';

      const xStep = width / (signal.length - 1);
      for (let i = 0; i < signal.length; i++) {
        const x = i * xStep;
        const y = baseline - signal[i] * 35;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [analysis]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadStructuredHTML = () => {
    if (!analysis) return;

    const { metadata, quality, beat_detection, prediction, events } = analysis;
    const isNormal = prediction?.category === 'NORMAL_SINUS_RHYTHM';
    const isInsufficient = quality.status === 'INSUFFICIENT';

    const resultTitle = isInsufficient
      ? 'Insufficient signal quality — recording cannot be analysed reliably'
      : isNormal
      ? 'No rhythm pattern flagged in this recording'
      : 'Possible irregular rhythm pattern detected — professional review recommended';

    const resultMessage = isNormal
      ? 'Heartbeats followed regular intervals throughout this recording. This screening result does not confirm lifelong cardiovascular health.'
      : isInsufficient
      ? 'Excessive motion artifacts or lead detachment were detected. Downstream classification was withheld.'
      : 'This screening result is not a medical diagnosis. Please consult a qualified healthcare professional for further evaluation.';

    const eventsRows =
      events.length > 0
        ? events
            .map(
              (ev) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E9F0;">${ev.timestamp_sec}s</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E9F0; font-weight: 600;">${ev.category.replace(/_/g, ' ')}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E9F0;"><span style="background: #FFFBEB; color: #B45309; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">${ev.severity}</span></td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E9F0; color: #5A6B82;">${ev.evidence_summary}</td>
          </tr>`
            )
            .join('')
        : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #5A6B82;">No irregular episodes flagged in this recording.</td></tr>`;

    // Self-contained, beautifully styled clinical report HTML document
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CardioSense AI — Screening Report (${metadata.id})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #17243A;
      background: #F7F9FC;
      margin: 0;
      padding: 32px;
    }
    .report-container {
      max-width: 820px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E5E9F0;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 4px 16px rgba(23, 36, 58, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #E5E9F0;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 22px;
      font-weight: 800;
      color: #17243A;
      letter-spacing: -0.5px;
    }
    .logo span {
      color: #1E60E2;
    }
    .badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 6px;
      background: #EEF4FF;
      color: #1E60E2;
      margin-left: 8px;
    }
    .result-banner {
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      background: ${isNormal && !isInsufficient ? '#E8F5ED' : isInsufficient ? '#F7F9FC' : '#FDEBEC'};
      border: 1px solid ${isNormal && !isInsufficient ? '#A2D4B6' : isInsufficient ? '#D8E1EA' : '#F4B6BC'};
    }
    .result-title {
      font-size: 16px;
      font-weight: 700;
      color: ${isNormal && !isInsufficient ? '#176B45' : isInsufficient ? '#17243A' : '#B42335'};
      margin: 0 0 6px 0;
    }
    .result-desc {
      font-size: 12px;
      color: #526176;
      margin: 0;
      line-height: 1.5;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .metric-card {
      background: #F7F9FC;
      border: 1px solid #E5E9F0;
      padding: 14px;
      border-radius: 10px;
      text-align: left;
    }
    .metric-label {
      font-size: 11px;
      color: #5A6B82;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: #17243A;
      font-family: monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 28px;
    }
    th {
      background: #F7F9FC;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      color: #5A6B82;
      border-bottom: 1px solid #E5E9F0;
      font-size: 11px;
      text-transform: uppercase;
    }
    .disclaimer {
      background: #F7F9FC;
      border: 1px solid #E5E9F0;
      padding: 14px;
      border-radius: 10px;
      font-size: 11px;
      color: #5A6B82;
      line-height: 1.5;
      margin-top: 24px;
    }
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #CBD5E1;
      font-size: 11px;
      color: #5A6B82;
    }
    .print-btn {
      display: block;
      margin: 0 auto 20px auto;
      padding: 10px 20px;
      background: #1542A1;
      color: #FFFFFF;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .print-btn:hover {
      background: #0F317B;
    }
    @media print {
      body { padding: 0; background: white; }
      .report-container { border: none; box-shadow: none; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
  <div class="report-container">
    <div class="header">
      <div>
        <div class="logo">CardioSense <span>AI</span> <span class="badge">Screening Summary</span></div>
        <div style="font-size: 12px; color: #5A6B82; margin-top: 4px;">Leadless Single-Vector Cardiac Telemetry • Techgium Challenge TG0914994</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #5A6B82; font-family: monospace;">
        <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
        <div><strong>Record:</strong> ${metadata.name}</div>
        <div><strong>ID:</strong> ${metadata.id}</div>
      </div>
    </div>

    <div class="result-banner">
      <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #5A6B82; margin-bottom: 4px;">Primary Screening Finding</div>
      <div class="result-title">${resultTitle}</div>
      <p class="result-desc">${resultMessage}</p>
    </div>

    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #17243A; margin-bottom: 8px;">Physiological Heartbeat Telemetry</div>
    <div class="grid">
      <div class="metric-card">
        <div class="metric-label">Mean Heart Rate</div>
        <div class="metric-value">${beat_detection ? beat_detection.mean_hr_bpm : '—'} <span style="font-size: 11px; font-weight: normal;">BPM</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Heart Rate Range</div>
        <div class="metric-value">${beat_detection ? `${beat_detection.min_hr_bpm}–${beat_detection.max_hr_bpm}` : '—'} <span style="font-size: 11px; font-weight: normal;">BPM</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">HRV (RMSSD)</div>
        <div class="metric-value">${beat_detection ? beat_detection.hrv_rmssd_ms : '—'} <span style="font-size: 11px; font-weight: normal;">ms</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Signal Quality Index</div>
        <div class="metric-value" style="color: #1E60E2;">${quality.overall_sqi} <span style="font-size: 11px; font-weight: normal; color: #5A6B82;">/100</span></div>
      </div>
    </div>

    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #17243A; margin-bottom: 8px;">Flagged Rhythm Events (${events.length})</div>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Classification</th>
          <th>Severity</th>
          <th>Clinical Observation</th>
        </tr>
      </thead>
      <tbody>
        ${eventsRows}
      </tbody>
    </table>

    <div class="disclaimer">
      <strong>Medical Screening Notice:</strong> CardioSense AI is a screening Proof of Concept (TG0914994) developed to support early rhythm awareness. It is not an FDA/CE diagnostic medical device and does not replace professional consultation. Please present this report to a licensed physician or cardiologist for clinical evaluation.
    </div>

    <div class="signature-row">
      <div>Physician / Reviewer Signature: _______________________</div>
      <div>Date & Hospital Stamp: _______________________</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardiosense_screening_report_${analysis.recording_id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardiosense_raw_data_${analysis.recording_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !analysis) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-navy-muted">Preparing structured screening report...</p>
      </div>
    );
  }

  const { metadata, quality, beat_detection, prediction, events } = analysis;
  const isNormal = prediction?.category === 'NORMAL_SINUS_RHYTHM';
  const isInsufficient = quality.status === 'INSUFFICIENT';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Action Bar (Hidden in Print) */}
      <div className="no-print bg-surface rounded-2xl border border-border p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-navy">Structured Medical Screening Report</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-secondary">Active Session:</span>
            {recordings.length > 0 && onSelectRecording ? (
              <select
                value={selectedRecordingId}
                onChange={(e) => onSelectRecording(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-border text-xs bg-canvas text-navy font-semibold focus:outline-none cursor-pointer"
              >
                {recordings.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.id})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-mono font-semibold text-navy">{metadata.name}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary structured download */}
          <button
            onClick={handleDownloadStructuredHTML}
            className="px-4 py-2 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-2"
            title="Download formatted structured document that opens in any browser"
          >
            <Download className="w-4 h-4" />
            Download Structured Report (.html)
          </button>

          {/* Print / Save as PDF */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-border text-navy text-xs font-semibold hover:bg-canvas transition-colors flex items-center gap-1.5"
            title="Print or Save directly as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-teal" />
            Print / PDF
          </button>

          {/* Raw JSON */}
          <button
            onClick={handleDownloadJSON}
            className="px-2.5 py-2 rounded-xl border border-border text-navy-secondary text-xs hover:bg-canvas transition-colors"
            title="Export raw machine-readable JSON data"
          >
            Raw JSON
          </button>
        </div>
      </div>

      {/* Structured Clinical Document Card */}
      <div className="max-w-5xl mx-auto bg-surface rounded-3xl border border-border border-t-8 border-t-action shadow-card p-8 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0 text-left">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-xl text-navy tracking-tight">CardioSense</span>
              <span className="text-teal font-extrabold text-xl">AI</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-teal-light text-action border border-teal/20">
                Screening Summary
              </span>
            </div>
            <p className="text-xs text-navy-secondary">
              Leadless Single-Vector Cardiac Telemetry • Techgium Challenge TG0914994
            </p>
          </div>

          <div className="text-right text-xs text-navy font-mono space-y-0.5">
            <div><strong>Report Date:</strong> {new Date().toLocaleDateString()}</div>
            <div className="text-navy-secondary">Record: {metadata.name}</div>
            <div className="text-navy-secondary">ID: {metadata.id}</div>
          </div>
        </div>

        {/* Screening Result Outcome Banner */}
        <div
          className={`p-6 rounded-2xl border ${
            isNormal && !isInsufficient
              ? 'bg-status-success-bg border-status-success/30 text-status-success'
              : isInsufficient
              ? 'bg-slate-100 border-border text-navy'
              : 'bg-status-critical-bg border-status-critical/30 text-status-critical'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block mb-1">
            Primary Screening Finding
          </span>
          <h2 className="text-lg font-bold text-navy">
            {isInsufficient
              ? 'Insufficient signal quality — recording cannot be analysed reliably'
              : isNormal
              ? 'No rhythm pattern flagged in this recording'
              : 'Possible irregular rhythm pattern detected — professional review recommended'}
          </h2>
          <p className="text-xs text-navy-secondary mt-1 leading-relaxed">
            {isNormal
              ? 'Heartbeats followed regular intervals throughout this recording. This screening result does not confirm lifelong cardiovascular health.'
              : isInsufficient
              ? 'Excessive motion artifacts or lead detachment were detected. Downstream classification was withheld.'
              : 'This screening result is not a medical diagnosis. Please consult a qualified healthcare professional for further evaluation.'}
          </p>
        </div>

        {/* Embedded ECG Rhythm Strip Canvas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-navy uppercase tracking-wider text-[11px]">
              Continuous ECG Lead Strip (Sample Window)
            </span>
            <span className="text-navy-secondary font-mono text-[10px]">
              Calibration: 25 mm/s, 10 mm/mV • Filter: 0.5–40 Hz
            </span>
          </div>
          <div className="border border-border rounded-xl overflow-hidden p-2 bg-white shadow-subtle">
            <canvas ref={canvasRef} style={{ width: '100%', height: '120px', display: 'block' }} />
          </div>
        </div>

        {/* Vital Telemetry Statistics Grid */}
        <div>
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-3">
            Physiological Heartbeat Telemetry
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-canvas border border-border border-t-2 border-t-status-critical">
              <span className="text-navy-secondary text-[11px] block">Mean Heart Rate</span>
              <span className="text-lg font-bold font-mono text-navy">
                {beat_detection?.mean_hr_bpm ?? '—'} <span className="text-xs font-normal text-navy-secondary">BPM</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border border-t-2 border-t-action">
              <span className="text-navy-secondary text-[11px] block">Heart Rate Range</span>
              <span className="text-base font-bold font-mono text-navy">
                {beat_detection ? `${beat_detection.min_hr_bpm}–${beat_detection.max_hr_bpm}` : '—'} <span className="text-xs font-normal text-navy-secondary">BPM</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border border-t-2 border-t-teal">
              <span className="text-navy-secondary text-[11px] block">HRV (RMSSD)</span>
              <span className="text-lg font-bold font-mono text-navy">
                {beat_detection?.hrv_rmssd_ms ?? '—'} <span className="text-xs font-normal text-navy-secondary">ms</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-border border-t-2 border-t-teal">
              <span className="text-navy-secondary text-[11px] block">Signal Quality Index</span>
              <span className="text-lg font-bold font-mono text-teal">
                {quality.overall_sqi} <span className="text-xs font-normal text-navy-secondary">/100</span>
              </span>
            </div>
          </div>
        </div>

        {/* Flagged Rhythm Events Table */}
        <div>
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-3">
            Flagged Rhythm Events ({events.length})
          </h3>
          {events.length > 0 ? (
            <div className="border border-border rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F5F8FC] text-navy-secondary font-semibold text-[11px] border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-navy font-mono">
                  {events.map((ev) => (
                    <tr key={ev.event_id}>
                      <td className="py-2.5 px-3">{ev.timestamp_sec}s</td>
                      <td className="py-2.5 px-3 font-sans font-semibold">
                        {ev.category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-status-warning-bg text-status-warning border border-status-warning/30">
                          {ev.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-navy-secondary">{ev.evidence_summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-navy-secondary italic p-3 bg-canvas rounded-xl border border-border">
              No irregular episodes were flagged during this recording session.
            </p>
          )}
        </div>

        {/* Clinical Disclaimer & Physician Signature Block */}
        <div className="pt-6 border-t border-border space-y-6">
          <div className="p-4 rounded-xl bg-canvas border border-border text-[11px] text-navy-secondary leading-relaxed">
            <strong>Medical Notice:</strong> CardioSense AI is a screening Proof of Concept (TG0914994) designed to support early awareness of heart rhythm patterns. It does not replace medical advice or confirm clinical diagnoses. A physician review is required for medical diagnosis and treatment planning.
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="border-t border-slate-300 pt-2 text-xs text-navy-secondary">
              Physician Signature
            </div>
            <div className="border-t border-slate-300 pt-2 text-xs text-navy-secondary text-right">
              Date & Clinical Stamp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
