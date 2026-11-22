export type SignalQualityStatus = 'GOOD' | 'NEEDS REVIEW' | 'INSUFFICIENT';

export type RhythmCategory =
  | 'NORMAL_SINUS_RHYTHM'
  | 'ATRIAL_FIBRIL'
  | 'SINUS_BRADYCARDIA'
  | 'SINUS_TACHYCARDIA'
  | 'VENTRICULAR_ECTOPY'
  | 'INSUFFICIENT_QUALITY';

export type ReviewStatus = 'NEW' | 'NEEDS_REVIEW' | 'REVIEWED' | 'DISMISSED';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface QualityMetrics {
  overall_sqi: number;
  status: SignalQualityStatus;
  snr_db: number;
  baseline_wander_ratio: number;
  high_freq_noise_ratio: number;
  flatline_percentage: number;
  missing_samples_count: number;
  explanation: string;
  is_reliable_for_ai: boolean;
}

export interface RPeak {
  sample_index: number;
  timestamp_sec: number;
  amplitude_mv: number;
  rr_interval_ms: number | null;
  is_ectopic: boolean;
}

export interface BeatSegmentation {
  total_beats: number;
  mean_hr_bpm: number;
  min_hr_bpm: number;
  max_hr_bpm: number;
  hrv_sdnn_ms: number;
  hrv_rmssd_ms: number;
  hrv_pnn50_percent: number;
  r_peaks: RPeak[];
}

export interface FeatureSet {
  mean_rr_ms: number;
  median_rr_ms: number;
  sdnn_ms: number;
  rmssd_ms: number;
  pnn50_percent: number;
  rr_cv_percent: number;
  qrs_width_mean_ms: number;
  r_peak_amplitude_mean_mv: number;
  spectral_entropy: number;
  lf_hf_ratio: number | null;
  top_contributing_features: Record<string, number>;
}

export interface RhythmPrediction {
  category: RhythmCategory;
  display_name: string;
  confidence: number;
  uncertainty_score: number;
  is_uncertain: boolean;
  model_version: string;
  probabilities: Record<string, number>;
  clinical_evidence: string[];
  safety_disclaimer: string;
}

export type PipelineStageStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WITHHELD';

export interface PipelineStatus {
  data_ingestion: PipelineStageStatus;
  signal_validation: PipelineStageStatus;
  quality_assessment: PipelineStageStatus;
  preprocessing: PipelineStageStatus;
  beat_detection: PipelineStageStatus;
  feature_extraction: PipelineStageStatus;
  ai_screening: PipelineStageStatus;
  messages: string[];
}

export interface RhythmEvent {
  event_id: string;
  recording_id: string;
  timestamp_sec: number;
  duration_sec: number;
  category: RhythmCategory;
  severity: AlertSeverity;
  confidence: number;
  quality_status: SignalQualityStatus;
  review_status: ReviewStatus;
  reviewer_notes?: string;
  snippet_start_idx: number;
  snippet_end_idx: number;
  evidence_summary: string;
}

export interface RecordingMetadata {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  sampling_rate_hz: number;
  duration_seconds: number;
  total_samples: number;
  source: 'SAMPLE_DATASET' | 'USER_UPLOAD';
  quality_status: SignalQualityStatus;
  screening_category?: RhythmCategory;
  mean_heart_rate?: number;
  is_demo: boolean;
}

export interface CompleteAnalysisResult {
  recording_id: string;
  metadata: RecordingMetadata;
  pipeline_status: PipelineStatus;
  quality: QualityMetrics;
  beat_detection?: BeatSegmentation;
  features?: FeatureSet;
  prediction?: RhythmPrediction;
  events: RhythmEvent[];
  time_series_raw: number[];
  time_series_processed: number[];
  time_axis_sec: number[];
  r_peak_indices: number[];
}

export interface ModelEvaluationMetrics {
  model_version: string;
  dataset_name: string;
  last_evaluated: string;
  overall_accuracy: number;
  overall_accuracy_ci_95?: number[];
  macro_f1: number;
  macro_f1_ci_95?: number[];
  macro_precision: number;
  macro_precision_ci_95?: number[];
  macro_recall: number;
  macro_sensitivity?: number;
  macro_sensitivity_ci_95?: number[];
  macro_specificity?: number;
  macro_specificity_ci_95?: number[];
  macro_auroc?: number;
  test_dataset_size?: number;
  unique_patients?: number;
  classes: string[];
  confusion_matrix: number[][];
  class_metrics: {
    class_name: string;
    true_count: number;
    precision: number;
    recall: number;
    sensitivity?: number;
    specificity?: number;
    f1_score: number;
    fpr: number;
    auc_roc: number;
    ci_95?: { sensitivity: number[]; specificity: number[] };
  }[];
  roc_curve: { fpr: number; tpr: number }[];
  pr_curve: { recall: number; precision: number }[];
  dataset_distribution: {
    total_recordings: number;
    train_samples: number;
    validation_samples: number;
    test_samples: number;
    total_patients?: number;
    sampling_rates_hz: number[];
    class_breakdown: { name: string; count: number; percent: number }[];
    quality_distribution: { status: string; count: number; percent: number }[];
    duration_distribution?: { range: string; count: number }[];
  };
  dataset_evidence?: {
    training: {
      name: string;
      patients: number;
      segments: number;
      recording_type: string;
      lead_configuration: string;
      sampling_rate_hz: string;
      license: string;
      source_url: string;
    };
    validation: {
      name: string;
      patients: number;
      segments: number;
      purpose: string;
    };
    test: {
      name: string;
      patients: number;
      segments: number;
      total_beats?: number;
      purpose: string;
    };
    split_methodology: string;
    dataset_limitations: string[];
  };
  external_validation?: {
    internal_validation: {
      type: string;
      cohort: string;
      accuracy: number;
      macro_f1: number;
      status: string;
      evidence_status_badge: string;
    };
    external_validation: {
      type: string;
      cohort: string;
      accuracy: number;
      sensitivity: number;
      specificity: number;
      macro_f1: number;
      status: string;
      evidence_status_badge: string;
    };
    prospective_clinical_validation: {
      type: string;
      cohort: string;
      status: string;
      evidence_status_badge: string;
      note: string;
    };
  };
  transparency_and_limitations?: {
    intended_use: string;
    intended_user: string;
    limitations: string[];
    known_failure_cases: string[];
    data_quality_requirements: string;
    human_review_required: boolean;
    expert_review_disclaimer: string;
  };
  feature_importances: { feature: string; importance: number }[];
}

export interface AnalyticsOverview {
  total_recordings: number;
  quality_distribution: Record<string, number>;
  rhythm_distribution: Record<string, number>;
  total_alerts: number;
  pending_reviews: number;
  reviewed_events: number;
  system_status: string;
}

