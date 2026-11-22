import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Radio,
  FolderClock,
  FileBarChart2,
  BookOpenCheck,
  Wifi,
  WifiOff,
  Bell,
  Heart,
  ExternalLink,
  ChevronRight,
  Info,
  BarChart3,
  ShieldAlert,
  Cpu,
  Layers,
  Settings,
  MoreHorizontal,
  ChevronDown,
  Check,
  UploadCloud
} from 'lucide-react';

export type MainNavTab =
  | 'overview'
  | 'monitoring'
  | 'analysis'
  | 'analytics'
  | 'recordings'
  | 'alerts'
  | 'evidence'
  | 'reports'
  // Backwards compatibility aliases
  | 'live'
  | 'history';

interface TopNavProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  connectionStatus: string;
  onOpenDeviceModal?: () => void;
  onOpenUpload?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  connectionStatus,
  onOpenDeviceModal,
  onOpenUpload,
}) => {
  const isConnected = connectionStatus === 'CONNECTED' || connectionStatus === 'STREAMING';
  const isConnecting = connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING';

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMoreMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Normalize active tab
  const activeNormalized =
    currentTab === 'live' ? 'monitoring' : currentTab === 'history' ? 'recordings' : currentTab;

  const isOverflowActive = [
    'analytics',
    'recordings',
    'alerts',
    'evidence',
    'reports'
  ].includes(activeNormalized);

  return (
    <>
      {/* Desktop & Tablet Top Horizontal Navigation */}
      <header className="sticky top-0 z-40 bg-surface/98 backdrop-blur-md border-b border-border shadow-subtle no-print text-left">
        {/* Decorative Top Accent Bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-teal via-action to-[#3B82F6]" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Brand Identity & Primary Nav Links */}
          <div className="flex items-center gap-3 lg:gap-5 min-w-0">
            {/* Brand Logo */}
            <button
              onClick={() => onSelectTab('overview')}
              className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0"
              aria-label="CardioSense AI Home"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-light border border-teal/20 flex items-center justify-center text-teal shadow-xs group-hover:bg-teal/15 transition-all">
                <Heart className="w-4 h-4 fill-teal text-teal" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-navy whitespace-nowrap">
                  CardioSense <span className="text-teal">AI</span>
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-light text-action border border-teal/20 uppercase tracking-wider hidden sm:inline-block">
                  Screening
                </span>
              </div>
            </button>

            {/* Horizontal Nav Links: 3 Primary + 3-Dot Overflow Concept */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
              {/* 1. Overview */}
              <button
                onClick={() => onSelectTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeNormalized === 'overview'
                    ? 'bg-action text-white shadow-xs'
                    : 'text-navy-secondary hover:text-navy hover:bg-slate-100'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Overview
              </button>

              {/* 2. Monitoring */}
              <button
                onClick={() => onSelectTab('monitoring')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeNormalized === 'monitoring'
                    ? 'bg-action text-white shadow-xs'
                    : 'text-navy-secondary hover:text-navy hover:bg-slate-100'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <Radio className="w-3.5 h-3.5" />
                Monitoring
              </button>

              {/* 3. ECG Analysis */}
              <button
                onClick={() => onSelectTab('analysis')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeNormalized === 'analysis'
                    ? 'bg-action text-white shadow-xs'
                    : 'text-navy-secondary hover:text-navy hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                ECG Analysis
              </button>

              {/* 4. THE 3-DOT CONCEPT MENU (Fresh High-Contrast Color Redesign) */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border cursor-pointer ${
                    isOverflowActive
                      ? 'bg-action text-white font-bold border-teal shadow-card'
                      : showMoreMenu
                      ? 'bg-teal-light/80 text-action font-bold border-teal shadow-xs'
                      : 'bg-teal-light/40 hover:bg-teal-light text-action font-semibold border-teal/30 hover:border-teal'
                  }`}
                  aria-expanded={showMoreMenu}
                  aria-haspopup="true"
                  title="Click to view all specialized workspaces"
                >
                  {activeNormalized === 'analytics' ? (
                    <>
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Analytics</span>
                    </>
                  ) : activeNormalized === 'recordings' ? (
                    <>
                      <FolderClock className="w-3.5 h-3.5" />
                      <span>Recordings</span>
                    </>
                  ) : activeNormalized === 'alerts' ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Alerts</span>
                    </>
                  ) : activeNormalized === 'evidence' ? (
                    <>
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Model Evaluation</span>
                    </>
                  ) : activeNormalized === 'reports' ? (
                    <>
                      <FileBarChart2 className="w-3.5 h-3.5" />
                      <span>Reports</span>
                    </>
                  ) : (
                    <>
                      <MoreHorizontal className="w-4 h-4 text-action" />
                      <span>More Tools</span>
                    </>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showMoreMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu Panel (High Contrast, z-[100], Beautiful Colors) */}
                {showMoreMenu && (
                  <div className="absolute left-0 mt-2 w-80 bg-surface rounded-2xl border-2 border-teal/40 shadow-2xl p-2.5 z-[100] animate-in fade-in slide-in-from-top-2 text-left ring-4 ring-teal/5">
                    {/* Header */}
                    <div className="px-3 py-2 bg-canvas rounded-xl border border-border/80 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                        <span className="text-[11px] font-bold text-navy uppercase tracking-wider">
                          Platform Workspaces
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-teal-light text-action border border-teal/20 text-[10px] font-bold">
                        5 Modules
                      </span>
                    </div>

                    <div className="space-y-1">
                      {/* 1. Analytics */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('analytics');
                          setShowMoreMenu(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                          activeNormalized === 'analytics'
                            ? 'bg-teal-light text-action font-semibold border border-teal/30 shadow-2xs'
                            : 'hover:bg-slate-50 text-navy border border-transparent'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-light text-action border border-teal/20 flex items-center justify-center shrink-0">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold block truncate text-navy">
                              Scientific Analytics
                            </span>
                            {activeNormalized === 'analytics' && (
                              <span className="text-[10px] font-bold text-action bg-teal/15 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-navy-secondary truncate mt-0.5">
                            7 interactive ECG &amp; HRV charts
                          </p>
                        </div>
                      </button>

                      {/* 2. Recordings */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('recordings');
                          setShowMoreMenu(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                          activeNormalized === 'recordings'
                            ? 'bg-teal-light text-action font-semibold border border-teal/30 shadow-2xs'
                            : 'hover:bg-slate-50 text-navy border border-transparent'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-light text-action border border-teal/20 flex items-center justify-center shrink-0">
                          <FolderClock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold block truncate text-navy">
                              Recordings Library
                            </span>
                            {activeNormalized === 'recordings' && (
                              <span className="text-[10px] font-bold text-action bg-teal/15 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-navy-secondary truncate mt-0.5">
                            Archive &amp; signal history
                          </p>
                        </div>
                      </button>

                      {/* 3. Alerts */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('alerts');
                          setShowMoreMenu(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                          activeNormalized === 'alerts'
                            ? 'bg-teal-light text-action font-semibold border border-teal/30 shadow-2xs'
                            : 'hover:bg-slate-50 text-navy border border-transparent'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-status-critical-bg text-status-critical border border-status-critical/20 flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold block truncate text-navy">
                              Alert Review Queue
                            </span>
                            {activeNormalized === 'alerts' && (
                              <span className="text-[10px] font-bold text-action bg-teal/15 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-navy-secondary truncate mt-0.5">
                            Prioritized arrhythmia triage
                          </p>
                        </div>
                      </button>

                      {/* 4. Model Evaluation */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('evidence');
                          setShowMoreMenu(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                          activeNormalized === 'evidence'
                            ? 'bg-teal-light text-action font-semibold border border-teal/30 shadow-2xs'
                            : 'hover:bg-slate-50 text-navy border border-transparent'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center shrink-0">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold block truncate text-navy">
                              Model Evaluation
                            </span>
                            {activeNormalized === 'evidence' && (
                              <span className="text-[10px] font-bold text-action bg-teal/15 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-navy-secondary truncate mt-0.5">
                            CardioSense-Net v2.4 benchmarks (92.4%)
                          </p>
                        </div>
                      </button>

                      {/* 5. Reports */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('reports');
                          setShowMoreMenu(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                          activeNormalized === 'reports'
                            ? 'bg-teal-light text-action font-semibold border border-teal/30 shadow-2xs'
                            : 'hover:bg-slate-50 text-navy border border-transparent'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-status-success-bg text-status-success border border-status-success/20 flex items-center justify-center shrink-0">
                          <FileBarChart2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold block truncate text-navy">
                              Structured Reports
                            </span>
                            {activeNormalized === 'reports' && (
                              <span className="text-[10px] font-bold text-action bg-teal/15 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-navy-secondary truncate mt-0.5">
                            Doctor summary, PDF print &amp; export
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Controls: Compact & Collision-Proof */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Device Connection Status Indicator */}
            <button
              type="button"
              onClick={onOpenDeviceModal}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer ${
                isConnected
                  ? 'bg-status-success-bg border-status-success/30 text-status-success hover:bg-status-success-bg/80'
                  : isConnecting
                  ? 'bg-status-warning-bg border-status-warning/30 text-status-warning'
                  : 'bg-slate-50 border-border text-navy-secondary hover:bg-slate-100'
              }`}
              title="Click to manage ECG device and signal telemetry"
            >
              {isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span className="hidden xl:inline font-mono">Leadless Patch 01</span>
                  <span className="font-semibold text-[11px] bg-status-success/15 px-1.5 py-0.5 rounded text-status-success">
                    Active
                  </span>
                </>
              ) : isConnecting ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin text-status-warning shrink-0" />
                  <span className="text-status-warning font-semibold text-[11px]">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-navy-secondary shrink-0" />
                  <span className="text-navy-secondary text-[11px]">Disconnected</span>
                </>
              )}
            </button>

            {/* Ingest ECG Quick Button */}
            {onOpenUpload && (
              <button
                type="button"
                onClick={onOpenUpload}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-action hover:bg-action-hover text-white text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload ECG
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative shrink-0" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg border border-border bg-surface text-navy-secondary hover:text-navy hover:bg-slate-50 flex items-center justify-center transition-colors relative cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-action rounded-full ring-2 ring-white" />
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface rounded-2xl border border-border shadow-elevated p-3 z-[100] animate-in fade-in slide-in-from-top-2 text-left">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                    <span className="font-bold text-xs text-navy">Screening Notifications</span>
                    <span className="text-[10px] text-teal font-semibold">2 New</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-status-info-bg/70 border border-status-info/20 text-navy">
                      <div className="font-semibold text-[11px] text-status-info flex items-center gap-1">
                        <Info className="w-3 h-3" /> Telemetry Calibration
                      </div>
                      <p className="text-[11px] text-navy-secondary mt-0.5">
                        Butterworth filter (0.5–40 Hz) active with Welch SQI score tracking at 0.96.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-border text-navy">
                      <div className="font-semibold text-[11px] text-navy">
                        CardioSense-Net v2.4 Loaded
                      </div>
                      <p className="text-[11px] text-navy-secondary mt-0.5">
                        Evaluated on MIT-BIH &amp; PTB-XL benchmarks (92.4% test accuracy).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-border shrink-0">
              <div className="w-8 h-8 rounded-full bg-teal-light border border-teal/20 flex items-center justify-center text-teal font-extrabold text-xs shadow-2xs">
                CS
              </div>
              <div className="hidden 2xl:block text-left text-xs">
                <span className="font-semibold text-navy block leading-tight">Patient User</span>
                <span className="text-[10px] text-navy-secondary">Leadless Single-Lead</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (All 8 Workspaces Supported) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/98 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-between overflow-x-auto no-scrollbar gap-1 shadow-elevated no-print">
        <button
          onClick={() => onSelectTab('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors shrink-0 ${
            activeNormalized === 'overview' ? 'text-teal font-bold' : 'text-navy-secondary'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => onSelectTab('monitoring')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors shrink-0 relative ${
            activeNormalized === 'monitoring' ? 'text-teal font-bold' : 'text-navy-secondary'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Monitor</span>
          {isConnected && (
            <span className="w-1.5 h-1.5 rounded-full bg-teal absolute top-1 right-2" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('analysis')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors shrink-0 ${
            activeNormalized === 'analysis' ? 'text-teal font-bold' : 'text-navy-secondary'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Analysis</span>
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors shrink-0 ${
            activeNormalized === 'analytics' ? 'text-teal font-bold' : 'text-navy-secondary'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => onSelectTab('recordings')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors shrink-0 ${
            activeNormalized === 'recordings' ? 'text-teal font-bold' : 'text-navy-secondary'
          }`}
        >
          <FolderClock className="w-4 h-4" />
          <span>Library</span>
        </button>

        <button
          onClick={() => onSelectTab('alerts')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors shrink-0 ${
            activeNormalized === 'alerts' ? 'text-teal font-bold' : 'text-navy-secondary'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Alerts</span>
        </button>

        <button
          onClick={() => onSelectTab('evidence')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors shrink-0 ${
            activeNormalized === 'evidence' ? 'text-teal font-bold' : 'text-navy-secondary'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Evidence</span>
        </button>

        <button
          onClick={() => onSelectTab('reports')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors shrink-0 ${
            activeNormalized === 'reports' ? 'text-teal font-bold' : 'text-navy-secondary'
          }`}
        >
          <FileBarChart2 className="w-4 h-4" />
          <span>Reports</span>
        </button>
      </nav>
    </>
  );
};
