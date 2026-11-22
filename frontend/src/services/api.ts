import {
  RecordingMetadata,
  CompleteAnalysisResult,
  RhythmEvent,
  ModelEvaluationMetrics,
  AnalyticsOverview,
  ReviewStatus,
} from '../types/ecg';

const rawBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawBase ? `${rawBase.replace(/\/+$/, '')}/api` : '/api';

export const api = {
  // Recordings
  async getRecordings(): Promise<RecordingMetadata[]> {
    const res = await fetch(`${API_BASE}/recordings`);
    if (!res.ok) throw new Error('Failed to fetch recordings');
    return res.json();
  },

  async getRecording(id: string): Promise<RecordingMetadata> {
    const res = await fetch(`${API_BASE}/recordings/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch recording ${id}`);
    return res.json();
  },

  async deleteRecording(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/recordings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete recording ${id}`);
  },

  async uploadRecording(
    file: File,
    samplingRateHz: number = 250,
    signalColumn?: string,
    name?: string,
    description?: string
  ): Promise<CompleteAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sampling_rate_hz', samplingRateHz.toString());
    if (signalColumn) formData.append('signal_column', signalColumn);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);

    const res = await fetch(`${API_BASE}/recordings/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload ECG recording' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // Analysis
  async getAnalysis(recordingId: string): Promise<CompleteAnalysisResult> {
    const res = await fetch(`${API_BASE}/analysis/${recordingId}`);
    if (!res.ok) throw new Error(`Failed to fetch analysis for ${recordingId}`);
    return res.json();
  },

  async triggerAnalysis(recordingId: string): Promise<CompleteAnalysisResult> {
    const res = await fetch(`${API_BASE}/analysis/${recordingId}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to run analysis for ${recordingId}`);
    return res.json();
  },

  // Alerts & Events
  async getAlerts(): Promise<RhythmEvent[]> {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async reviewAlert(
    eventId: string,
    status: ReviewStatus,
    reviewerNotes?: string
  ): Promise<RhythmEvent> {
    const res = await fetch(`${API_BASE}/alerts/${eventId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewer_notes: reviewerNotes }),
    });
    if (!res.ok) throw new Error('Failed to update alert review status');
    return res.json();
  },

  // Model Evaluation & Overview
  async getModelEvaluation(): Promise<ModelEvaluationMetrics> {
    const res = await fetch(`${API_BASE}/models/evaluation`);
    if (!res.ok) throw new Error('Failed to fetch model evaluation');
    return res.json();
  },

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    if (!res.ok) throw new Error('Failed to fetch analytics overview');
    return res.json();
  },
};

