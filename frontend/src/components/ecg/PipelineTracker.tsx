import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Ban, ArrowRight } from 'lucide-react';
import { PipelineStatus, PipelineStageStatus } from '../../types/ecg';

interface PipelineTrackerProps {
  pipeline?: PipelineStatus;
}

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({ pipeline }) => {
  if (!pipeline) return null;

  const stages = [
    { key: 'data_ingestion', label: 'Data Ingest', status: pipeline.data_ingestion },
    { key: 'signal_validation', label: 'Validation', status: pipeline.signal_validation },
    { key: 'quality_assessment', label: 'SQI Analysis', status: pipeline.quality_assessment },
    { key: 'preprocessing', label: 'Filtering', status: pipeline.preprocessing },
    { key: 'beat_detection', label: 'Beat Detect', status: pipeline.beat_detection },
    { key: 'feature_extraction', label: 'HRV Features', status: pipeline.feature_extraction },
    { key: 'ai_screening', label: 'AI Screening', status: pipeline.ai_screening },
  ];

  const getStatusIcon = (status: PipelineStageStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-teal-600" />;
      case 'RUNNING':
        return <Clock className="w-4 h-4 text-sky-600 animate-spin" />;
      case 'WITHHELD':
        return <Ban className="w-4 h-4 text-amber-500" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-300" />;
    }
  };

  const getStatusBadge = (status: PipelineStageStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'RUNNING':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'WITHHELD':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FAILED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-brand-border p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-brand-navy uppercase tracking-wider">
          ECG Signal Processing Pipeline
        </h4>
        <span className="text-[11px] font-mono text-brand-muted">
          7-Stage Modular Micro-Architecture
        </span>
      </div>

      {/* Progress Flow */}
      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {stages.map((stage, idx) => (
          <div
            key={stage.key}
            className={`p-2 rounded-lg border text-center transition-all ${getStatusBadge(stage.status)}`}
          >
            <div className="flex justify-center mb-1">{getStatusIcon(stage.status)}</div>
            <span className="text-[11px] font-medium block truncate">{stage.label}</span>
            <span className="text-[9px] font-mono uppercase tracking-tight opacity-75">
              {stage.status}
            </span>
          </div>
        ))}
      </div>

      {/* Execution logs */}
      {pipeline.messages && pipeline.messages.length > 0 && (
        <div className="p-2.5 bg-[#f8fafc] rounded-lg border border-brand-border text-[11px] font-mono text-brand-slate space-y-1 max-h-24 overflow-y-auto">
          {pipeline.messages.map((msg, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-teal-600 font-bold">›</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

