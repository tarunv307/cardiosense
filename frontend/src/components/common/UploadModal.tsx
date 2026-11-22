import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, FileText, AlertCircle, CheckCircle2, Sliders, Info, Download, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { CompleteAnalysisResult } from '../../types/ecg';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (result: CompleteAnalysisResult) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [samplingRate, setSamplingRate] = useState<number>(250);
  const [signalColumn, setSignalColumn] = useState<string>('');
  const [voltageUnit, setVoltageUnit] = useState<string>('mV');
  const [customName, setCustomName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'txt', 'json'].includes(ext || '')) {
      setErrorMessage('Unsupported format. Please upload a CSV, TXT, or JSON file.');
      setFile(null);
      return;
    }
    setErrorMessage(null);
    setFile(selectedFile);
    if (!customName) {
      setCustomName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleLoadSample = async (filename: string, label: string) => {
    try {
      setLoadingSample(filename);
      setErrorMessage(null);
      const res = await fetch(`/api/recordings/sample-files/${filename}`);
      if (!res.ok) throw new Error('Failed to load sample file');
      const blob = await res.blob();
      const sampleFile = new File([blob], filename, { type: 'text/csv' });
      setFile(sampleFile);
      setCustomName(label);
      setSignalColumn('lead_I_mv');
      setSamplingRate(250);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load sample file');
    } finally {
      setLoadingSample(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select an ECG recording file.');
      return;
    }
    if (samplingRate <= 0 || isNaN(samplingRate)) {
      setErrorMessage('Please specify a valid sampling frequency greater than 0 Hz.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const result = await api.uploadRecording(
        file,
        samplingRate,
        signalColumn.trim() || undefined,
        customName.trim() || undefined,
        description.trim() || undefined
      );

      onUploadSuccess(result);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process ECG recording.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl border border-border border-t-4 border-t-action shadow-elevated w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-[#F5F8FC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-light border border-teal/20 flex items-center justify-center text-teal">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">Ingest ECG Recording</h3>
              <p className="text-xs text-navy-secondary">Upload raw leadless ECG signal for automated screening</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-navy-secondary hover:text-navy hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              file
                ? 'border-teal bg-teal-light/40'
                : 'border-border hover:border-teal bg-canvas'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center gap-1.5 text-teal">
                <CheckCircle2 className="w-7 h-7 text-teal" />
                <span className="text-xs font-bold text-navy">{file.name}</span>
                <span className="text-[11px] text-navy-secondary font-mono">
                  {(file.size / 1024).toFixed(1)} KB • Ready for Ingestion
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-navy-secondary">
                <UploadCloud className="w-7 h-7 text-teal" />
                <div>
                  <span className="text-xs font-semibold text-navy block">
                    Drop ECG signal file here, or browse
                  </span>
                  <span className="text-[11px] text-navy-secondary">
                    Supports .CSV, .TXT, .JSON (single-lead or multi-column)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Benchmark Sample Files */}
          <div className="p-3.5 rounded-xl bg-canvas border border-border space-y-2">
            <span className="text-[11px] font-semibold text-navy flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal" />
              Test with a pre-formatted benchmark file:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { filename: 'normal_sinus_sample.csv', label: 'Normal Sinus Rhythm' },
                { filename: 'atrial_fibrillation_sample.csv', label: 'Atrial Fibrillation' },
                { filename: 'pvc_arrhythmia_sample.csv', label: 'PVC Arrhythmia' },
                { filename: 'motion_artifact_sample.csv', label: 'Motion Noise Artifact' },
              ].map((s) => (
                <button
                  key={s.filename}
                  type="button"
                  disabled={loadingSample === s.filename}
                  onClick={() => handleLoadSample(s.filename, s.label)}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-white text-navy font-medium hover:border-teal hover:bg-teal-light/50 transition-colors text-left truncate flex items-center justify-between shadow-2xs"
                >
                  <span className="truncate">{s.label}</span>
                  {file?.name === s.filename ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 ml-1" />
                  ) : (
                    <Download className="w-3 h-3 text-navy-secondary shrink-0 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Acquisition Metadata Parameters */}
          <div className="p-3.5 bg-canvas rounded-xl border border-border space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-navy">
              <Sliders className="w-3.5 h-3.5 text-teal" />
              Signal Acquisition Parameters
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-navy-secondary block mb-1">
                  Sampling Frequency (Fs) *
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    value={samplingRate}
                    onChange={(e) => setSamplingRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border text-xs font-mono bg-white focus:border-teal focus:outline-none"
                    required
                  />
                  <span className="text-xs text-navy-secondary font-mono">Hz</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-navy-secondary block mb-1">
                  Voltage Unit
                </label>
                <select
                  value={voltageUnit}
                  onChange={(e) => setVoltageUnit(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border text-xs bg-white text-navy focus:border-teal focus:outline-none cursor-pointer"
                >
                  <option value="mV">Millivolts (mV)</option>
                  <option value="uV">Microvolts (µV)</option>
                  <option value="ADC">Raw ADC Digits</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-navy-secondary block mb-1">
                Signal Column Name (for CSV/JSON with multiple columns)
              </label>
              <input
                type="text"
                placeholder="e.g. lead_I_mv, voltage, signal (optional)"
                value={signalColumn}
                onChange={(e) => setSignalColumn(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border text-xs bg-white text-navy focus:border-teal focus:outline-none"
              />
            </div>
          </div>

          {/* Recording Title */}
          <div>
            <label className="text-[11px] text-navy-secondary block mb-1">
              Recording Title / Subject Identifier
            </label>
            <input
              type="text"
              placeholder="e.g. Telemetry Run 01"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-border text-xs bg-white text-navy focus:border-teal focus:outline-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-status-critical-bg border border-status-critical/30 text-xs text-status-critical flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-navy-secondary hover:bg-canvas transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="px-5 py-2 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-2 shadow-xs"
            >
              {isUploading ? (
                <>Processing Pipeline...</>
              ) : (
                <>Run Signal Ingestion & AI Screening</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
