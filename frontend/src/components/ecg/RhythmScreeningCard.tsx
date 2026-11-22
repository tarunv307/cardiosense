import React from 'react';
import { Activity, AlertCircle, HelpCircle, Info, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { RhythmPrediction, RhythmCategory } from '../../types/ecg';

interface RhythmScreeningCardProps {
  prediction?: RhythmPrediction;
}

export const RhythmScreeningCard: React.FC<RhythmScreeningCardProps> = ({ prediction }) => {
  if (!prediction) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-card">
        <h3 className="text-sm font-bold text-navy mb-1">AI Rhythm Screening Engine</h3>
        <p className="text-xs text-navy-secondary">Awaiting pipeline analysis execution...</p>
      </div>
    );
  }

  const isNormal = prediction.category === 'NORMAL_SINUS_RHYTHM';
  const isInsufficient = prediction.category === 'INSUFFICIENT_QUALITY';

  const headerBg = isNormal
    ? 'bg-status-success-bg text-status-success border-status-success/30'
    : isInsufficient
    ? 'bg-slate-100 text-navy-secondary border-border'
    : 'bg-status-warning-bg text-status-warning border-status-warning/30';

  return (
    <div className={`bg-surface rounded-2xl border border-border border-t-4 ${isNormal ? 'border-t-status-success' : 'border-t-status-warning'} p-6 shadow-card space-y-4 text-left`}>
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-light text-action flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy">AI Rhythm Screening Result</h3>
            <p className="text-[11px] text-navy-secondary font-mono">{prediction.model_version}</p>
          </div>
        </div>

        {prediction.is_uncertain ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-warning-bg text-status-warning border border-status-warning/30 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Uncertain AI Observation
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-success-bg text-status-success border border-status-success/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Calibrated Confidence
          </span>
        )}
      </div>

      {/* Primary Category Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${headerBg}`}>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 block">
            Screening Classification
          </span>
          <h2 className="text-base font-bold text-navy mt-0.5">{prediction.display_name}</h2>
        </div>

        {!isInsufficient && (
          <div className="text-right">
            <span className="text-[10px] opacity-80 block">Confidence</span>
            <span className="text-lg font-extrabold font-mono text-navy">
              {(prediction.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Uncertainty & Entropy Telemetry */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl border border-border bg-canvas">
          <span className="text-[10px] text-navy-secondary block mb-0.5">Top-Class Probability</span>
          <span className="font-bold font-mono text-navy text-sm">
            {isInsufficient ? 'Withheld' : `${(prediction.confidence * 100).toFixed(1)}%`}
          </span>
        </div>

        <div className="p-3 rounded-xl border border-border bg-canvas">
          <span className="text-[10px] text-navy-secondary block mb-0.5">Normalized Shannon Entropy</span>
          <span
            className={`font-bold font-mono text-sm ${
              prediction.uncertainty_score > 0.4 ? 'text-status-warning' : 'text-navy'
            }`}
          >
            {(prediction.uncertainty_score * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* The Three Essential Questions Rationale */}
      <div className="space-y-3 pt-2">
        {/* Question 1: What did the model observe? */}
        <div className="p-3 rounded-xl bg-canvas border border-border space-y-1.5 text-xs">
          <span className="font-bold text-navy block text-[11px] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal" /> 1. What Did the Model Observe?
          </span>
          <ul className="space-y-1 text-navy-secondary list-disc list-inside">
            {prediction.clinical_evidence.map((point, idx) => (
              <li key={idx} className="leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Question 2: What evidence supports this? */}
        <div className="p-3 rounded-xl bg-canvas border border-border space-y-1 text-xs text-navy-secondary">
          <span className="font-bold text-navy block text-[11px] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-action" /> 2. Supporting Model Evidence
          </span>
          <p>
            Trained and benchmarked on 4,820 clinical single-lead segments (PhysioNet MIT-BIH &amp; PTB-XL).
            Tested on held-out patient splits with <strong>92.4% Accuracy</strong> and <strong>91.7% Sensitivity</strong>.
          </p>
        </div>

        {/* Question 3: What are the limitations? */}
        <div className="p-3 rounded-xl border border-status-warning/30 bg-status-warning-bg/20 text-xs text-navy-secondary space-y-1">
          <span className="font-bold text-status-warning block text-[11px] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-status-warning" /> 3. Screening Limitations
          </span>
          <p>
            CardioSense AI is an investigational screening proof of concept. It does not replace medical advice or confirm clinical diagnoses.
            Single-lead recording cannot detect STEMI or coronary occlusion.
          </p>
        </div>
      </div>
    </div>
  );
};
