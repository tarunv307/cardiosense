import React, { useEffect } from 'react';
import { X, Wifi, Smartphone, Radio, CheckCircle2, Battery, Activity, ShieldCheck } from 'lucide-react';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: string;
  onSetConnectionStatus: (status: string) => void;
  selectedScenario: string;
  onSelectScenario: (scenario: string) => void;
}

export const DeviceModal: React.FC<DeviceModalProps> = ({
  isOpen,
  onClose,
  connectionStatus,
  onSetConnectionStatus,
  selectedScenario,
  onSelectScenario,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isConnected = connectionStatus === 'CONNECTED' || connectionStatus === 'STREAMING';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl border border-border shadow-elevated w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-[#F5F8FC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-light border border-teal/20 flex items-center justify-center text-teal">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">Device Telemetry &amp; Sensor Setup</h3>
              <p className="text-xs text-navy-secondary">Leadless patch sensor pairing and data stream</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-navy-secondary hover:text-navy hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Active Sensor Hardware Card */}
          <div className="p-4 rounded-xl border border-border bg-canvas space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-action" />
                <span className="font-semibold text-xs text-navy">CardioSense Patch BLE-01</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                  isConnected
                    ? 'bg-status-success-bg text-status-success border border-status-success/20'
                    : 'bg-slate-100 text-navy-secondary'
                }`}
              >
                {isConnected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                    Connected &bull; Active
                  </>
                ) : (
                  'Disconnected'
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-navy-secondary flex items-center gap-1">
                  <Battery className="w-3 h-3 text-status-success" /> Battery
                </span>
                <span className="font-semibold text-navy">88% (14 hrs)</span>
              </div>
              <div>
                <span className="text-navy-secondary block">Contact Impedance</span>
                <span className="font-semibold text-navy">12 k&Omega; (Good)</span>
              </div>
              <div>
                <span className="text-navy-secondary block">Sampling Rate</span>
                <span className="font-semibold font-mono text-navy">250 Hz</span>
              </div>
            </div>

            {/* Connect / Disconnect Action */}
            <div className="pt-2">
              {isConnected ? (
                <button
                  onClick={() => onSetConnectionStatus('DISCONNECTED')}
                  className="w-full py-2 rounded-lg border border-border bg-surface text-xs font-semibold text-navy-secondary hover:text-status-critical hover:border-status-critical/40 transition-colors"
                >
                  Disconnect Patch Sensor
                </button>
              ) : (
                <button
                  onClick={() => onSetConnectionStatus('CONNECTED')}
                  className="w-full py-2 rounded-lg bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Connect &amp; Start Telemetry Stream
                </button>
              )}
            </div>
          </div>

          {/* Telemetry Scenario Selector */}
          <div>
            <label className="text-xs font-semibold text-navy block mb-2">
              Select Incoming Rhythm Scenario (Benchmarking):
            </label>
            <div className="space-y-2 text-xs">
              {[
                {
                  id: 'rec_normal_01',
                  label: 'Normal Sinus Rhythm',
                  desc: 'Regular healthy heartbeat intervals (72 BPM) with intact P waves and high SQI.',
                },
                {
                  id: 'rec_afib_02',
                  label: 'Atrial Fibrillation Pattern',
                  desc: 'Irregularly irregular ventricular intervals with absent P waves for screening test.',
                },
                {
                  id: 'rec_pvc_05',
                  label: 'Occasional Ectopic Beats (PVC)',
                  desc: 'Normal baseline with intermittent premature widened ventricular beats.',
                },
                {
                  id: 'rec_noise_06',
                  label: 'Loose Sensor / Motion Artifact',
                  desc: 'Simulates high-frequency EMG noise and loose skin contact to verify Welch SQI rejection.',
                },
              ].map((scen) => (
                <div
                  key={scen.id}
                  onClick={() => onSelectScenario(scen.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedScenario === scen.id
                      ? 'border-teal bg-teal-light/40 shadow-xs'
                      : 'border-border hover:border-slate-300 bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-navy">{scen.label}</span>
                    {selectedScenario === scen.id && (
                      <CheckCircle2 className="w-4 h-4 text-action" />
                    )}
                  </div>
                  <p className="text-[11px] text-navy-secondary">{scen.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-[#F5F8FC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors shadow-xs"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
