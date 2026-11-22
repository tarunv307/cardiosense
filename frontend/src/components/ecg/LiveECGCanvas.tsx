import React, { useRef, useEffect } from 'react';
import { Activity, Play, Pause, RotateCcw } from 'lucide-react';

interface LiveECGCanvasProps {
  samples: number[];
  samplingRate: number;
  height?: number;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onClearBuffer: () => void;
  connectionStatus: string;
}

export const LiveECGCanvas: React.FC<LiveECGCanvasProps> = ({
  samples,
  samplingRate,
  height = 320,
  isStreaming,
  onToggleStreaming,
  onClearBuffer,
  connectionStatus,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const canvasHeight = rect.height;

    // Clean white surface
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, canvasHeight);

    const padding = { top: 25, bottom: 25, left: 55, right: 20 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = canvasHeight - padding.top - padding.bottom;

    // 1. Draw Medical ECG Grid (Standard 1mm / 5mm scale)
    // Minor grid (#DFE8F5)
    ctx.save();
    ctx.strokeStyle = '#DFE8F5';
    ctx.lineWidth = 0.5;
    const minorStep = 12; // 12px grid
    for (let x = padding.left; x <= width - padding.right; x += minorStep) {
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, canvasHeight - padding.bottom);
      ctx.stroke();
    }
    for (let y = padding.top; y <= canvasHeight - padding.bottom; y += minorStep) {
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Major grid (#C8D7EE)
    ctx.strokeStyle = '#C8D7EE';
    ctx.lineWidth = 1.0;
    const majorStep = minorStep * 5; // 60px
    for (let x = padding.left; x <= width - padding.right; x += majorStep) {
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, canvasHeight - padding.bottom);
      ctx.stroke();
    }
    for (let y = padding.top; y <= canvasHeight - padding.bottom; y += majorStep) {
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Baseline (0.0 mV)
    const yBaseline = padding.top + plotHeight * 0.55;
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, yBaseline);
    ctx.lineTo(width - padding.right, yBaseline);
    ctx.stroke();
    ctx.setLineDash([]);

    // Voltage scale ticks
    ctx.fillStyle = '#526176';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('0.0 mV', padding.left - 6, yBaseline + 3);
    ctx.fillText('+1.0 mV', padding.left - 6, yBaseline - 60 + 3);
    ctx.fillText('-1.0 mV', padding.left - 6, yBaseline + 60 + 3);

    // Border
    ctx.strokeStyle = '#D8E1EA';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding.left, padding.top, plotWidth, plotHeight);
    ctx.restore();

    // 2. Draw Scrolling Waveform (#1E60E2)
    const windowSeconds = 5.0; // 5 seconds window
    const maxVisibleSamples = Math.floor(windowSeconds * samplingRate);
    const visibleSamples = samples.slice(-maxVisibleSamples);

    if (visibleSamples.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#1E60E2'; // Master Accent Royal Blue Waveform
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const xStep = plotWidth / (maxVisibleSamples - 1);
      const startX = padding.left + (maxVisibleSamples - visibleSamples.length) * xStep;

      // Scale: 1 mV = 60 pixels
      const mvScale = 60;

      for (let i = 0; i < visibleSamples.length; i++) {
        const x = startX + i * xStep;
        const val = visibleSamples[i];
        const y = yBaseline - val * mvScale;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Lead tip pulse dot
      const lastX = startX + (visibleSamples.length - 1) * xStep;
      const lastY = yBaseline - visibleSamples[visibleSamples.length - 1] * mvScale;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#1E60E2';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    } else {
      ctx.fillStyle = '#526176';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        connectionStatus === 'DISCONNECTED'
          ? 'Device disconnected — awaiting telemetry signal'
          : 'Connecting to live ECG stream...',
        width / 2,
        canvasHeight / 2
      );
    }
  }, [samples, samplingRate, connectionStatus]);

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
      {/* Real-time Oscilloscope Header */}
      <div className="px-5 py-3 bg-[#F5F8FC] border-b border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 font-bold text-navy">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'CONNECTED' || connectionStatus === 'STREAMING'
                  ? 'bg-teal animate-ping'
                  : 'bg-status-warning'
              }`}
            />
            Live Oscilloscope Trace (Lead I)
          </span>
          <span className="text-navy-secondary hidden sm:inline">&bull; 25 mm/s &bull; 10 mm/mV</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleStreaming}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isStreaming
                ? 'bg-status-warning-bg text-status-warning border border-status-warning/30 hover:bg-status-warning-bg/80'
                : 'bg-teal-light text-action border border-teal/20 hover:bg-teal-light/80'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5 text-status-warning" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-action" />
                Resume
              </>
            )}
          </button>

          <button
            onClick={onClearBuffer}
            className="p-1.5 rounded-lg text-navy-secondary hover:text-navy hover:bg-slate-100 transition-colors"
            title="Reset Buffer & Re-sync"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
        />
      </div>

      {/* Real-time Oscilloscope Footer */}
      <div className="px-5 py-2 bg-[#F5F8FC] border-t border-border text-[11px] font-mono text-navy-secondary flex items-center justify-between">
        <div>Window: 5.0s &bull; Fs: {samplingRate} Hz &bull; Buffer: {samples.length} samples</div>
        <div className="hidden sm:block">Server-Sent Events (SSE) Live Feed</div>
      </div>
    </div>
  );
};
