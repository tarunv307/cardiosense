import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Zap } from 'lucide-react';
import { QualityMetrics, SignalQualityStatus } from '../../types/ecg';

interface SignalQualityCardProps {
  quality: QualityMetrics;
}

export const SignalQualityCard: React.FC<SignalQualityCardProps> = ({ quality }) => {
  const isGood = quality.status === 'GOOD';
  const isNeedsReview = quality.status === 'NEEDS REVIEW';
  const isInsufficient = quality.status === 'INSUFFICIENT';

  const badgeColor = isGood
    ? 'bg-status-success-bg text-status-success border-status-success/20'
    : isNeedsReview
    ? 'bg-status-warning-bg text-status-warning border-status-warning/20'
    : 'bg-status-critical-bg text-status-critical border-status-critical/20';

  const progressColor = isGood
    ? 'bg-status-success'
    : isNeedsReview
    ? 'bg-status-warning'
    : 'bg-status-critical';

  return (
    <div className="bg-surface rounded-2xl border border-border border-t-4 border-t-teal p-6 shadow-card space-y-4 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-light text-action flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy">Signal Quality Intelligence (SQI)</h3>
            <p className="text-[11px] text-navy-secondary">Automated leadless artifact &amp; noise assessment</p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${badgeColor}`}>
          {isGood && <CheckCircle2 className="w-3.5 h-3.5" />}
          {isNeedsReview && <AlertTriangle className="w-3.5 h-3.5" />}
          {isInsufficient && <AlertOctagon className="w-3.5 h-3.5" />}
          {quality.status}
        </span>
      </div>

      {/* Main Score Meter */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs text-navy-secondary font-medium">Composite SQI Score</span>
          <span className="text-2xl font-extrabold font-mono text-navy">
            {quality.overall_sqi}
            <span className="text-xs font-normal text-navy-secondary">/100</span>
          </span>
        </div>
        <div className="w-full h-2.5 bg-canvas border border-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${quality.overall_sqi}%` }}
          />
        </div>
      </div>

      {/* Quality Sub-Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl border border-border bg-canvas">
          <span className="text-[10px] text-navy-secondary block">Signal-to-Noise (SNR)</span>
          <span className="font-bold font-mono text-navy text-sm">{quality.snr_db.toFixed(1)} dB</span>
        </div>

        <div className="p-3 rounded-xl border border-border bg-canvas">
          <span className="text-[10px] text-navy-secondary block">Baseline Wander</span>
          <span className="font-bold font-mono text-navy text-sm">{(quality.baseline_wander_ratio * 100).toFixed(1)}%</span>
        </div>

        <div className="p-3 rounded-xl border border-border bg-canvas">
          <span className="text-[10px] text-navy-secondary block">High-Freq Muscle Noise</span>
          <span className="font-bold font-mono text-navy text-sm">{(quality.high_freq_noise_ratio * 100).toFixed(1)}%</span>
        </div>

        <div className="p-3 rounded-xl border border-border bg-canvas">
          <span className="text-[10px] text-navy-secondary block">Flatline Samples</span>
          <span className="font-bold font-mono text-navy text-sm">{(quality.flatline_percentage * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Plain-English Explanation */}
      <div className="p-3 rounded-xl bg-canvas border border-border text-xs text-navy-secondary leading-relaxed">
        <strong>Signal Assessment:</strong> {quality.explanation}
      </div>
    </div>
  );
};
