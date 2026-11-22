import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ArrowLeft, ArrowRight, Activity, Eye, Layers, Grid } from 'lucide-react';
import { RPeak } from '../../types/ecg';

interface ECGWaveformCanvasProps {
  timeAxis: number[];
  rawSignal: number[];
  processedSignal: number[];
  rPeaks?: RPeak[];
  rPeakIndices?: number[];
  durationSec: number;
  samplingRate: number;
  height?: number;
  onSelectTimeInterval?: (startSec: number, endSec: number) => void;
  selectedBeatIndex?: number | null;
  onSelectBeat?: (beat: RPeak | null) => void;
}

export const ECGWaveformCanvas: React.FC<ECGWaveformCanvasProps> = ({
  timeAxis,
  rawSignal,
  processedSignal,
  rPeaks = [],
  rPeakIndices = [],
  durationSec,
  samplingRate,
  height = 340,
  onSelectTimeInterval,
  selectedBeatIndex = null,
  onSelectBeat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Display toggles
  const [showRaw, setShowRaw] = useState(false);
  const [showProcessed, setShowProcessed] = useState(true);
  const [showRPeaks, setShowRPeaks] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Viewport / Zoom & Pan State
  // windowStart and windowDuration in seconds
  const [windowStart, setWindowStart] = useState(0);
  const [windowDuration, setWindowDuration] = useState(Math.min(durationSec, 5.0)); // Default 5 second window for clinical inspection

  // Hover state
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    time: number;
    voltage: number;
    nearestBeat?: RPeak;
  } | null>(null);

  // Reset viewport when duration changes
  useEffect(() => {
    setWindowStart(0);
    setWindowDuration(Math.min(durationSec, 5.0));
  }, [durationSec]);

  // Handle Zoom
  const handleZoom = (factor: number) => {
    setWindowDuration((prev) => {
      const nextDuration = Math.max(1.0, Math.min(durationSec, prev * factor));
      // Adjust start to zoom centered
      const center = windowStart + prev / 2;
      let newStart = center - nextDuration / 2;
      newStart = Math.max(0, Math.min(durationSec - nextDuration, newStart));
      setWindowStart(newStart);
      return nextDuration;
    });
  };

  // Handle Pan
  const handlePan = (direction: 'left' | 'right') => {
    const shift = windowDuration * 0.3;
    setWindowStart((prev) => {
      if (direction === 'left') {
        return Math.max(0, prev - shift);
      } else {
        return Math.min(durationSec - windowDuration, prev + shift);
      }
    });
  };

  // Reset
  const handleReset = () => {
    setWindowStart(0);
    setWindowDuration(Math.min(durationSec, 5.0));
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || timeAxis.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const canvasHeight = rect.height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, canvasHeight);

    const padding = { top: 25, bottom: 35, left: 50, right: 20 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = canvasHeight - padding.top - padding.bottom;

    // Time window
    const tMin = windowStart;
    const tMax = windowStart + windowDuration;

    // Voltage range (find max/min in visible window)
    const startIndex = Math.max(0, Math.floor((tMin / durationSec) * timeAxis.length));
    const endIndex = Math.min(timeAxis.length, Math.ceil((tMax / durationSec) * timeAxis.length));

    let vMin = -1.2;
    let vMax = 1.8;

    if (endIndex > startIndex) {
      const visibleVals = processedSignal.slice(startIndex, endIndex);
      if (visibleVals.length > 0) {
        const localMin = Math.min(...visibleVals);
        const localMax = Math.max(...visibleVals);
        vMin = Math.min(vMin, localMin - 0.3);
        vMax = Math.max(vMax, localMax + 0.3);
      }
    }

    const getX = (t: number) => padding.left + ((t - tMin) / (tMax - tMin)) * plotWidth;
    const getY = (v: number) => padding.top + plotHeight - ((v - vMin) / (vMax - vMin)) * plotHeight;

    // 1. Draw ECG Clinical Grid
    if (showGrid) {
      ctx.save();
      // Minor grid (every 0.04s and 0.1mV)
      ctx.strokeStyle = '#DFE8F5';
      ctx.lineWidth = 0.5;

      // Vertical minor lines (0.2s)
      const minorTimeStep = 0.2;
      const firstMinorT = Math.floor(tMin / minorTimeStep) * minorTimeStep;
      for (let t = firstMinorT; t <= tMax; t += minorTimeStep) {
        const x = getX(t);
        if (x >= padding.left && x <= width - padding.right) {
          ctx.beginPath();
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, canvasHeight - padding.bottom);
          ctx.stroke();
        }
      }

      // Horizontal minor lines (0.5 mV)
      const minorVoltStep = 0.5;
      const firstMinorV = Math.floor(vMin / minorVoltStep) * minorVoltStep;
      for (let v = firstMinorV; v <= vMax; v += minorVoltStep) {
        const y = getY(v);
        if (y >= padding.top && y <= canvasHeight - padding.bottom) {
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
        }
      }

      // Major grid (every 1.0s and 1.0mV)
      ctx.strokeStyle = '#C8D7EE';
      ctx.lineWidth = 1.0;

      const majorTimeStep = 1.0;
      const firstMajorT = Math.floor(tMin / majorTimeStep) * majorTimeStep;
      for (let t = firstMajorT; t <= tMax; t += majorTimeStep) {
        const x = getX(t);
        if (x >= padding.left && x <= width - padding.right) {
          ctx.beginPath();
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, canvasHeight - padding.bottom);
          ctx.stroke();

          // Time labels
          ctx.fillStyle = '#526176';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${t.toFixed(1)}s`, x, canvasHeight - padding.bottom + 16);
        }
      }

      // Zero baseline
      const yZero = getY(0);
      if (yZero >= padding.top && yZero <= canvasHeight - padding.bottom) {
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, yZero);
        ctx.lineTo(width - padding.right, yZero);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#526176';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('0.0 mV', padding.left - 6, yZero + 3);
      }

      // +1 mV and -1 mV markers
      for (const vMark of [1.0, -1.0]) {
        const yMark = getY(vMark);
        if (yMark >= padding.top && yMark <= canvasHeight - padding.bottom) {
          ctx.fillStyle = '#526176';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${vMark > 0 ? '+' : ''}${vMark.toFixed(1)} mV`, padding.left - 6, yMark + 3);
        }
      }

      ctx.restore();
    }

    // Border
    ctx.strokeStyle = '#D8E1EA';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding.left, padding.top, plotWidth, plotHeight);

    // 2. Draw Raw Signal (in muted slate/grey) if enabled
    if (showRaw && rawSignal.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';

      let started = false;
      for (let i = startIndex; i < endIndex; i++) {
        const t = timeAxis[i];
        const v = rawSignal[i];
        const x = getX(t);
        const y = getY(v);

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Filtered / Processed Signal (in Royal Medical Blue #1E60E2)
    if (showProcessed && processedSignal.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#1E60E2'; // Master Royal Medical Blue
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';

      let started = false;
      for (let i = startIndex; i < endIndex; i++) {
        const t = timeAxis[i];
        const v = processedSignal[i];
        const x = getX(t);
        const y = getY(v);

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw R-peaks Markers & Annotations
    if (showRPeaks && rPeaks.length > 0) {
      ctx.save();
      rPeaks.forEach((peak, idx) => {
        if (peak.timestamp_sec >= tMin && peak.timestamp_sec <= tMax) {
          const x = getX(peak.timestamp_sec);
          const y = getY(peak.amplitude_mv);

          const isSelected = selectedBeatIndex === idx;
          const isEctopic = peak.is_ectopic;

          // Peak dot
          ctx.beginPath();
          ctx.arc(x, y, isSelected ? 6 : 4.5, 0, 2 * Math.PI);
          ctx.fillStyle = isEctopic ? '#B42335' : isSelected ? '#1542A1' : '#1E60E2';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Peak label (R or PVC)
          ctx.fillStyle = isEctopic ? '#dc2626' : '#1542A1';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(isEctopic ? 'PVC' : 'R', x, y - 8);

          // RR Interval above peak if available
          if (peak.rr_interval_ms) {
            ctx.fillStyle = '#64748b';
            ctx.font = '9px monospace';
            ctx.fillText(`${Math.round(peak.rr_interval_ms)}ms`, x, y - 19);
          }
        }
      });
      ctx.restore();
    }

    // 5. Draw Hover Guide Line & Tooltip
    if (hoverData && hoverData.x >= padding.left && hoverData.x <= width - padding.right) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverData.x, padding.top);
      ctx.lineTo(hoverData.x, canvasHeight - padding.bottom);
      ctx.stroke();
      ctx.restore();
    }
  }, [
    timeAxis,
    rawSignal,
    processedSignal,
    rPeaks,
    durationSec,
    windowStart,
    windowDuration,
    showRaw,
    showProcessed,
    showRPeaks,
    showGrid,
    hoverData,
    selectedBeatIndex,
  ]);

  // Mouse Move for Hover & Tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || timeAxis.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padding = { top: 25, bottom: 35, left: 50, right: 20 };
    const plotWidth = rect.width - padding.left - padding.right;

    if (mouseX >= padding.left && mouseX <= rect.width - padding.right) {
      const tMin = windowStart;
      const tMax = windowStart + windowDuration;
      const timeVal = tMin + ((mouseX - padding.left) / plotWidth) * (tMax - tMin);

      // Find nearest sample
      const sampleIdx = Math.min(
        timeAxis.length - 1,
        Math.max(0, Math.round((timeVal / durationSec) * timeAxis.length))
      );
      const voltVal = processedSignal[sampleIdx] ?? 0;

      // Find nearest R peak within 0.15s
      const nearPeak = rPeaks.find((p) => Math.abs(p.timestamp_sec - timeVal) < 0.15);

      setHoverData({
        x: mouseX,
        y: mouseY,
        time: Number(timeVal.toFixed(3)),
        voltage: Number(voltVal.toFixed(3)),
        nearestBeat: nearPeak,
      });
    } else {
      setHoverData(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  const handleClick = () => {
    if (hoverData?.nearestBeat && onSelectBeat) {
      onSelectBeat(hoverData.nearestBeat);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-brand-border shadow-card overflow-hidden">
      {/* Control Toolbar */}
      <div className="px-4 py-3 bg-[#F5F8FC] border-b border-brand-border flex flex-wrap items-center justify-between gap-3 text-sm">
        {/* Signal & Display Layer Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProcessed(!showProcessed)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              showProcessed
                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                : 'bg-white text-brand-muted border border-brand-border hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#1E60E2]"></span>
            Filtered ECG (0.5-40Hz)
          </button>

          <button
            onClick={() => setShowRaw(!showRaw)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              showRaw
                ? 'bg-slate-200 text-slate-800 border border-slate-300'
                : 'bg-white text-brand-muted border border-brand-border hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Raw Ingested Signal
          </button>

          <button
            onClick={() => setShowRPeaks(!showRPeaks)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              showRPeaks
                ? 'bg-teal-100 text-teal-800 border border-teal-300'
                : 'bg-white text-brand-muted border border-brand-border hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            Detected R-Peaks ({rPeaks.length})
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              showGrid
                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                : 'bg-white text-brand-muted border border-brand-border hover:bg-slate-50'
            }`}
            title="Toggle Clinical ECG Grid"
          >
            <Grid className="w-3.5 h-3.5 text-slate-500" />
            ECG Grid
          </button>
        </div>

        {/* Pan, Zoom, and Window Scope Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-brand-muted mr-1 font-mono">
            Window: {windowStart.toFixed(1)}s – {(windowStart + windowDuration).toFixed(1)}s (of {durationSec.toFixed(1)}s)
          </span>

          <button
            onClick={() => handlePan('left')}
            disabled={windowStart <= 0}
            className="p-1 rounded bg-white border border-brand-border text-brand-slate hover:bg-slate-50 disabled:opacity-40 transition-colors"
            title="Pan Left (Shift 30%)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handlePan('right')}
            disabled={windowStart + windowDuration >= durationSec}
            className="p-1 rounded bg-white border border-brand-border text-brand-slate hover:bg-slate-50 disabled:opacity-40 transition-colors"
            title="Pan Right (Shift 30%)"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          <button
            onClick={() => handleZoom(0.7)}
            className="p-1 rounded bg-white border border-brand-border text-brand-slate hover:bg-slate-50 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleZoom(1.4)}
            className="p-1 rounded bg-white border border-brand-border text-brand-slate hover:bg-slate-50 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReset}
            className="p-1 rounded bg-white border border-brand-border text-brand-slate hover:bg-slate-50 transition-colors"
            title="Reset to 5-second initial view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${height}px`, display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />

        {/* Live Cursor Inspection Pill */}
        {hoverData && (
          <div
            className="absolute top-3 right-4 pointer-events-none bg-white/95 backdrop-blur-sm border border-brand-border rounded-md px-3 py-1.5 shadow-sm text-xs font-mono text-brand-charcoal flex items-center gap-3 z-10"
          >
            <div>
              <span className="text-brand-muted">Time:</span> {hoverData.time}s
            </div>
            <div>
              <span className="text-brand-muted">Amp:</span> {hoverData.voltage} mV
            </div>
            {hoverData.nearestBeat && (
              <div className="text-sky-700 font-semibold border-l border-slate-200 pl-2">
                Beat #{rPeaks.indexOf(hoverData.nearestBeat) + 1}
                {hoverData.nearestBeat.is_ectopic && <span className="ml-1 text-red-600">(PVC)</span>}
                {hoverData.nearestBeat.rr_interval_ms && (
                  <span className="ml-1 text-slate-500 font-normal">
                    {Math.round(hoverData.nearestBeat.rr_interval_ms)}ms
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-2 bg-[#F5F8FC] border-t border-brand-border text-[11px] text-brand-muted flex items-center justify-between font-mono">
        <div>
          Calibration: 25 mm/s, 10 mm/mV • Lead: Leadless Single-Vector • Fs: {samplingRate} Hz
        </div>
        <div>
          Click any detected R-peak to inspect beat-to-beat metrics
        </div>
      </div>
    </div>
  );
};

