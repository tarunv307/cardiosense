import React from 'react';
import { Activity, Bell, Search, User, ShieldCheck, ChevronDown, UploadCloud } from 'lucide-react';
import { RecordingMetadata } from '../../types/ecg';

interface NavbarProps {
  recordings: RecordingMetadata[];
  selectedRecordingId: string;
  onSelectRecording: (id: string) => void;
  onOpenUpload?: () => void;
  pendingAlertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  recordings,
  selectedRecordingId,
  onSelectRecording,
  onOpenUpload,
  pendingAlertsCount,
}) => {
  const currentRec = recordings.find((r) => r.id === selectedRecordingId);

  return (
    <header className="h-16 bg-white border-b border-brand-border sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Brand & Context */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-brand-navy">CardioSense</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 uppercase tracking-wider">
                AI Screening PoC
              </span>
            </div>
            <p className="text-[11px] text-brand-muted hidden sm:block">
              Techgium Challenge TG0914994
            </p>
          </div>
        </div>

        {/* Active Recording Selector Dropdown */}
        <div className="relative hidden md:block">
          <div className="flex items-center gap-2 bg-[#f8fafc] border border-brand-border rounded-lg px-3 py-1.5 hover:border-slate-300 transition-colors">
            <span className="text-xs text-brand-muted">Active Record:</span>
            <select
              value={selectedRecordingId}
              onChange={(e) => onSelectRecording(e.target.value)}
              className="bg-transparent text-xs font-semibold text-brand-navy focus:outline-none cursor-pointer pr-4"
            >
              {recordings.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.name} ({rec.quality_status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 text-xs font-medium transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload ECG
          </button>
        )}

        {/* Notifications / Alerts Pill */}
        <div className="relative">
          <button
            className="p-2 rounded-lg text-brand-slate hover:bg-slate-100 transition-colors relative"
            title="Review Queue Notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Reviewer Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-brand-border">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-brand-border flex items-center justify-center text-slate-700 text-xs font-medium">
            TV
          </div>
          <div className="hidden lg:block text-left text-xs">
            <span className="font-semibold text-brand-navy block leading-tight">Clinical Reviewer</span>
            <span className="text-[10px] text-brand-muted">CardioSense Evaluator</span>
          </div>
        </div>
      </div>
    </header>
  );
};

