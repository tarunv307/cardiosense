import React, { useState, useEffect } from 'react';
import { TopNav, MainNavTab } from './components/layout/TopNav';
import { DeviceModal } from './components/layout/DeviceModal';
import { UploadModal } from './components/common/UploadModal';

import { LandingPage } from './pages/LandingPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { EvidenceCenterPage } from './pages/EvidenceCenterPage';

import { RecordingMetadata, CompleteAnalysisResult } from './types/ecg';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<MainNavTab>('overview');
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string>('rec_normal_01');
  const [analysis, setAnalysis] = useState<CompleteAnalysisResult | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(true);

  // Device & Stream State
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTED');
  const [selectedScenario, setSelectedScenario] = useState<string>('rec_normal_01');
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Load recordings list
  const loadRecordings = async () => {
    try {
      const data = await api.getRecordings();
      setRecordings(data);
      if (data.length > 0 && !data.some((r) => r.id === selectedRecordingId)) {
        setSelectedRecordingId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load recordings', err);
    }
  };

  // Load analysis for selected recording
  const loadAnalysis = async (recId: string) => {
    try {
      setIsLoadingAnalysis(true);
      const data = await api.getAnalysis(recId);
      setAnalysis(data);
    } catch (err) {
      console.error(`Failed to load analysis for ${recId}`, err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    if (selectedRecordingId) {
      loadAnalysis(selectedRecordingId);
    }
  }, [selectedRecordingId]);

  const handleSelectRecording = (id: string) => {
    setSelectedRecordingId(id);
  };

  const handleUploadSuccess = (result: CompleteAnalysisResult) => {
    loadRecordings();
    setSelectedRecordingId(result.recording_id);
    setAnalysis(result);
    setCurrentTab('recordings');
  };

  const handleReRunAnalysis = async () => {
    if (!selectedRecordingId) return;
    try {
      setIsLoadingAnalysis(true);
      const res = await api.triggerAnalysis(selectedRecordingId);
      setAnalysis(res);
    } catch (err) {
      console.error('Failed to re-run analysis', err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-navy flex flex-col font-sans antialiased text-left">
      {/* 1. Horizontal Top Navigation (Zero Left Sidebar, 8 Master Sections) */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        connectionStatus={connectionStatus}
        onOpenDeviceModal={() => setIsDeviceModalOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      {/* 2. Full Width Content Area */}
      <main className="flex-1 w-full pb-20 lg:pb-8">
        {/* Section 1: Overview (Product Landing Page with exact Hero "Understand Every Heartbeat." + 10 sections) */}
        {currentTab === 'overview' && (
          <LandingPage
            onNavigate={setCurrentTab}
            onOpenUpload={() => setIsUploadModalOpen(true)}
          />
        )}

        {/* Section 2: Monitoring (Live Dashboard & Oscilloscope) */}
        {(currentTab === 'monitoring' || currentTab === 'live') && (
          <LiveMonitoringPage
            connectionStatus={connectionStatus}
            onSetConnectionStatus={setConnectionStatus}
            selectedScenario={selectedScenario}
            onSelectScenario={setSelectedScenario}
            onNavigate={setCurrentTab}
            onOpenDeviceModal={() => setIsDeviceModalOpen(true)}
          />
        )}

        {/* Section 3: ECG Analysis (Waveform Inspector & Beat Inspector) */}
        {currentTab === 'analysis' && (
          <HistoryPage
            recordings={recordings}
            selectedRecordingId={selectedRecordingId}
            onSelectRecording={handleSelectRecording}
            analysis={analysis}
            isLoadingAnalysis={isLoadingAnalysis}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onRefreshRecordings={loadRecordings}
            onReRunAnalysis={handleReRunAnalysis}
            onNavigate={setCurrentTab}
            defaultView="inspector"
          />
        )}

        {/* Section 4: Analytics (7 Interactive Scientific Graphs) */}
        {currentTab === 'analytics' && (
          <AnalyticsPage
            analysis={analysis}
            isLoading={isLoadingAnalysis}
          />
        )}

        {/* Section 5: Recordings (Recording Library & Audit Table) */}
        {(currentTab === 'recordings' || currentTab === 'history') && (
          <HistoryPage
            recordings={recordings}
            selectedRecordingId={selectedRecordingId}
            onSelectRecording={handleSelectRecording}
            analysis={analysis}
            isLoadingAnalysis={isLoadingAnalysis}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onRefreshRecordings={loadRecordings}
            onReRunAnalysis={handleReRunAnalysis}
            onNavigate={setCurrentTab}
            defaultView="table"
          />
        )}

        {/* Section 6: Alerts (Event Prioritization & Review Queue) */}
        {currentTab === 'alerts' && (
          <AlertsPage
            onNavigate={setCurrentTab}
            onSelectRecording={handleSelectRecording}
          />
        )}

        {/* Section 7: Model Evaluation & Evidence Center */}
        {currentTab === 'evidence' && (
          <EvidenceCenterPage />
        )}

        {/* Section 8: Clinical Summary Reports */}
        {currentTab === 'reports' && (
          <ReportsPage
            analysis={analysis}
            isLoading={isLoadingAnalysis}
            recordings={recordings}
            selectedRecordingId={selectedRecordingId}
            onSelectRecording={handleSelectRecording}
          />
        )}
      </main>

      {/* 3. Device Pairing & Telemetry Modal */}
      <DeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        connectionStatus={connectionStatus}
        onSetConnectionStatus={setConnectionStatus}
        selectedScenario={selectedScenario}
        onSelectScenario={setSelectedScenario}
      />

      {/* 4. Ingest ECG Recording Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}

export default App;
