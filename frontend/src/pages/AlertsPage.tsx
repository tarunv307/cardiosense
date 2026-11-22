import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  X,
  FileText,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { RhythmEvent, ReviewStatus, AlertSeverity } from '../types/ecg';
import { api } from '../services/api';
import { MainNavTab } from '../components/layout/TopNav';

interface AlertsPageProps {
  onNavigate?: (tab: MainNavTab) => void;
  onSelectRecording?: (id: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigate, onSelectRecording }) => {
  const [alerts, setAlerts] = useState<RhythmEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Selected event for review modal
  const [selectedEvent, setSelectedEvent] = useState<RhythmEvent | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('REVIEWED');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleOpenReview = (ev: RhythmEvent) => {
    setSelectedEvent(ev);
    setReviewStatus(ev.review_status);
    setReviewerNotes(ev.reviewer_notes || '');
  };

  const handleSaveReview = async () => {
    if (!selectedEvent) return;
    try {
      setIsSubmitting(true);
      const updated = await api.reviewAlert(selectedEvent.event_id, reviewStatus, reviewerNotes);
      setAlerts((prev) =>
        prev.map((e) => (e.event_id === updated.event_id ? updated : e))
      );
      setSelectedEvent(null);
    } catch (err) {
      console.error('Failed to save review', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAlerts = alerts.filter((ev) => {
    const matchesSearch =
      ev.event_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.recording_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.evidence_summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ev.review_status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || ev.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const pendingCount = alerts.filter(
    (e) => e.review_status === 'NEW' || e.review_status === 'NEEDS_REVIEW'
  ).length;
  const reviewedCount = alerts.filter((e) => e.review_status === 'REVIEWED').length;
  const criticalCount = alerts.filter(
    (e) => e.severity === 'CRITICAL' || e.severity === 'HIGH'
  ).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* 1. Header & KPI Metrics */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-action" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                Cardiac Event Prioritization &amp; Review System
              </h1>
            </div>
            <p className="text-xs text-navy-secondary">
              Review flagged rhythm observations, inspect ECG evidence segments, and audit screening status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-canvas border border-border text-navy">
              Total Ingested Events: <strong>{alerts.length}</strong>
            </span>
          </div>
        </div>

        {/* 3 KPI Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-canvas border border-border border-t-4 border-t-status-critical flex items-center justify-between">
            <div>
              <span className="text-[11px] text-navy-secondary block">High / Critical Alerts</span>
              <span className="text-2xl font-extrabold font-mono text-status-critical">{criticalCount}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-status-critical-bg text-status-critical flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-canvas border border-border border-t-4 border-t-status-warning flex items-center justify-between">
            <div>
              <span className="text-[11px] text-navy-secondary block">Pending Clinician Review</span>
              <span className="text-2xl font-extrabold font-mono text-status-warning">{pendingCount}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-status-warning-bg text-status-warning flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-canvas border border-border border-t-4 border-t-status-success flex items-center justify-between">
            <div>
              <span className="text-[11px] text-navy-secondary block">Reviewed &amp; Cleared</span>
              <span className="text-2xl font-extrabold font-mono text-status-success">{reviewedCount}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-status-success-bg text-status-success flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-navy-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, recording, or finding..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-xs bg-canvas text-navy focus:outline-none focus:border-teal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-navy-secondary">
            <Filter className="w-3.5 h-3.5 text-navy-secondary" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border text-xs bg-canvas text-navy focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="NEW">New</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <span className="text-navy-secondary/40">|</span>

          <span className="text-xs text-navy-secondary">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border text-xs bg-canvas text-navy focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* 3. Event Review Queue Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F5F8FC] border-b border-border text-navy-secondary font-semibold">
              <tr>
                <th className="p-3.5 pl-6">Event ID</th>
                <th className="p-3.5">Recording</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Screening Category</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Signal Quality (SQI)</th>
                <th className="p-3.5">Review Status</th>
                <th className="p-3.5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAlerts.map((ev) => {
                const isNew = ev.review_status === 'NEW';
                const isNeedsReview = ev.review_status === 'NEEDS_REVIEW';
                const isReviewed = ev.review_status === 'REVIEWED';

                const isCritical = ev.severity === 'CRITICAL' || ev.severity === 'HIGH';
                const isMedium = ev.severity === 'MEDIUM';

                return (
                  <tr key={ev.event_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 pl-6 font-mono text-[11px] font-semibold text-navy">
                      {ev.event_id}
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => {
                          if (onSelectRecording) onSelectRecording(ev.recording_id);
                          if (onNavigate) onNavigate('history');
                        }}
                        className="font-mono text-action font-semibold hover:underline text-[11px]"
                      >
                        {ev.recording_id}
                      </button>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-navy-secondary">
                      {ev.timestamp_sec.toFixed(2)}s
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-navy block text-[11px]">
                        {ev.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-navy-secondary truncate max-w-[200px] block">
                        {ev.evidence_summary}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isCritical
                            ? 'bg-status-critical-bg text-status-critical border-status-critical/20'
                            : isMedium
                            ? 'bg-status-warning-bg text-status-warning border-status-warning/20'
                            : 'bg-slate-100 text-navy-secondary border-border'
                        }`}
                      >
                        {ev.severity}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ev.quality_status === 'GOOD'
                            ? 'bg-status-success-bg text-status-success border-status-success/20'
                            : ev.quality_status === 'NEEDS REVIEW'
                            ? 'bg-status-warning-bg text-status-warning border-status-warning/20'
                            : 'bg-status-critical-bg text-status-critical border-status-critical/20'
                        }`}
                      >
                        {ev.quality_status}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isNew
                            ? 'bg-teal-light text-action border-teal/20'
                            : isNeedsReview
                            ? 'bg-status-warning-bg text-status-warning border-status-warning/20'
                            : isReviewed
                            ? 'bg-status-success-bg text-status-success border-status-success/20'
                            : 'bg-slate-100 text-navy-secondary border-border'
                        }`}
                      >
                        {ev.review_status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="p-3.5 pr-6 text-right">
                      <button
                        onClick={() => handleOpenReview(ev)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-slate-100 text-action text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Audit
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-navy-secondary">
                    {isLoading ? 'Loading prioritized cardiac alerts...' : 'No alert events matching your query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CLINICAL REVIEW MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-2xl border border-border border-t-4 border-t-action shadow-elevated w-full max-w-xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs font-bold text-teal">{selectedEvent.event_id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-status-critical-bg text-status-critical border border-status-critical/20">
                    {selectedEvent.severity} Severity
                  </span>
                </div>
                <h3 className="text-base font-bold text-navy">
                  {selectedEvent.category.replace(/_/g, ' ')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-navy-secondary hover:text-navy hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Event Telemetry Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-canvas border border-border">
                <span className="text-[10px] text-navy-secondary block">Recording</span>
                <span className="font-mono font-semibold text-navy">{selectedEvent.recording_id}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-border">
                <span className="text-[10px] text-navy-secondary block">Timestamp</span>
                <span className="font-mono font-semibold text-navy">{selectedEvent.timestamp_sec.toFixed(2)}s</span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-border">
                <span className="text-[10px] text-navy-secondary block">Duration</span>
                <span className="font-mono font-semibold text-navy">{selectedEvent.duration_sec.toFixed(2)}s</span>
              </div>
              <div className="p-2.5 rounded-xl bg-canvas border border-border">
                <span className="text-[10px] text-navy-secondary block">Signal Quality</span>
                <span className="font-bold text-status-success">{selectedEvent.quality_status}</span>
              </div>
            </div>

            {/* Evidence Rationale */}
            <div className="p-3.5 rounded-xl bg-canvas border border-border space-y-1.5 text-xs">
              <span className="font-bold text-navy flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-teal" /> Detection Evidence Summary:
              </span>
              <p className="text-navy-secondary leading-relaxed">
                {selectedEvent.evidence_summary}
              </p>
              <div className="pt-2 border-t border-border font-mono text-[11px] text-navy-secondary">
                Snippet Sample Index: [{selectedEvent.snippet_start_idx} &ndash; {selectedEvent.snippet_end_idx}]
              </div>
            </div>

            {/* Clinician Review Audit Form */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-navy block mb-1">
                  Update Review Status:
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border text-xs bg-canvas text-navy font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="NEW">New (Unreviewed)</option>
                  <option value="NEEDS_REVIEW">Needs Further Specialist Review</option>
                  <option value="REVIEWED">Reviewed &bull; Confirmed Screening Observation</option>
                  <option value="DISMISSED">Dismissed &bull; Benign or Artifact</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-navy block mb-1">
                  Clinician Reviewer Notes:
                </label>
                <textarea
                  rows={3}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Enter clinical interpretation, follow-up recommendations, or artifact notes..."
                  className="w-full p-2.5 rounded-lg border border-border text-xs bg-canvas text-navy focus:outline-none focus:border-teal"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-navy-secondary hover:bg-canvas transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveReview}
                className="px-5 py-2 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {isSubmitting ? 'Saving...' : 'Save Clinical Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Non-Diagnostic Safety Disclaimer */}
      <div className="p-4 rounded-xl bg-surface border border-border border-l-4 border-l-status-warning shadow-subtle flex items-start gap-3">
        <Stethoscope className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
        <div className="text-xs text-navy-secondary space-y-1">
          <strong className="text-navy">Clinical Safety Disclaimer:</strong>
          <p className="leading-relaxed">
            CardioSense AI is a screening Proof of Concept (Techgium TG0914994) developed to aid in the prioritization of ambulatory ECG signals.
            Event prioritization does not constitute an automated medical diagnosis. All flagged observations must be corroborated by a licensed physician using a 12-lead diagnostic ECG.
          </p>
        </div>
      </div>
    </div>
  );
};

