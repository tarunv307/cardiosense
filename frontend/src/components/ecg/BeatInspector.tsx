import React from 'react';
import { Heart, Activity, Clock, Zap } from 'lucide-react';
import { RPeak, BeatSegmentation } from '../../types/ecg';

interface BeatInspectorProps {
  selectedBeat: RPeak | null;
  beatData?: BeatSegmentation;
  samplingRate: number;
}

export const BeatInspector: React.FC<BeatInspectorProps> = ({
  selectedBeat,
  beatData,
  samplingRate,
}) => {
  if (!beatData) return null;

  return (
    <div className="bg-surface rounded-2xl border border-border border-t-4 border-t-action p-6 shadow-card space-y-4 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-light text-action flex items-center justify-center">
            <Heart className="w-4 h-4 fill-action" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy">Beat Detection &amp; HRV Telemetry</h3>
            <p className="text-[11px] text-navy-secondary">Pan-Tompkins QRS peak detection &amp; interval analysis</p>
          </div>
        </div>

        <span className="text-xs font-mono bg-canvas text-navy-secondary px-2.5 py-1 rounded-lg border border-border">
          {beatData.total_beats} Total Beats Detected
        </span>
      </div>

      {/* Aggregate Heart Rate & HRV Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-xl bg-canvas border border-border">
          <span className="text-[10px] text-navy-secondary block">Mean Heart Rate</span>
          <span className="text-lg font-bold font-mono text-navy">
            {beatData.mean_hr_bpm} <span className="text-[10px] font-normal">BPM</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-canvas border border-border">
          <span className="text-[10px] text-navy-secondary block">Heart Rate Range</span>
          <span className="text-sm font-bold font-mono text-navy mt-0.5 block">
            {beatData.min_hr_bpm} &ndash; {beatData.max_hr_bpm} BPM
          </span>
        </div>

        <div className="p-3 rounded-xl bg-canvas border border-border">
          <span className="text-[10px] text-navy-secondary block">HRV (RMSSD)</span>
          <span className="text-lg font-bold font-mono text-navy">
            {beatData.hrv_rmssd_ms} <span className="text-[10px] font-normal">ms</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-canvas border border-border">
          <span className="text-[10px] text-navy-secondary block">pNN50 Ratio</span>
          <span className="text-lg font-bold font-mono text-navy">
            {beatData.hrv_pnn50_percent}%
          </span>
        </div>
      </div>

      {/* Selected Beat Detail Callout */}
      {selectedBeat ? (
        <div className="p-3.5 rounded-xl bg-teal-light/40 border border-teal/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-action block text-[11px]">
              Inspected Beat at {selectedBeat.timestamp_sec.toFixed(3)}s
            </span>
            <span className="text-navy-secondary text-[11px]">
              Amplitude: <strong>{selectedBeat.amplitude_mv.toFixed(3)} mV</strong> &bull; R-R Interval:{' '}
              <strong>{selectedBeat.rr_interval_ms ? `${selectedBeat.rr_interval_ms} ms` : 'Initial beat'}</strong>
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              selectedBeat.is_ectopic
                ? 'bg-status-critical-bg text-status-critical border border-status-critical/20'
                : 'bg-status-success-bg text-status-success border border-status-success/20'
            }`}
          >
            {selectedBeat.is_ectopic ? 'Ectopic Beat Flagged' : 'Normal Sinus Beat'}
          </span>
        </div>
      ) : (
        <div className="p-2.5 rounded-lg bg-canvas text-center text-xs text-navy-secondary font-mono">
          Click any R-peak dot on the waveform canvas above to inspect individual beat interval metrics.
        </div>
      )}
    </div>
  );
};
