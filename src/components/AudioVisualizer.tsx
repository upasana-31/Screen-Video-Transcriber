import React, { useEffect, useRef } from "react";
import { Mic, Radio, Volume2, VolumeX } from "lucide-react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  sourceLabel: string;
  duration: number;
  isPaused: boolean;
  hasAudioTrack: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyser,
  isActive,
  sourceLabel,
  duration,
  isPaused,
  hasAudioTrack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const volumeLevelRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!isActive || !analyser) {
      // Draw idle flatline
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(0, canvas.height / 2 - 1, canvas.width, 2);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteFrequencyData(dataArray);

      // Compute average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      volumeLevelRef.current = avg;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 48) * 0.7;
      let x = 0;

      for (let i = 0; i < 48; i++) {
        // Pick frequency samples
        const index = Math.floor((i / 48) * (bufferLength / 2));
        const val = dataArray[index] || 0;
        const percent = val / 255;
        const barHeight = Math.max(3, percent * (canvas.height - 6));

        // Color based on active sound
        if (percent > 0.05) {
          ctx.fillStyle = "#2563eb"; // vibrant blue
        } else {
          ctx.fillStyle = "#cbd5e1"; // slate-300
        }

        const y = (canvas.height - barHeight) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();

        x += barWidth + 3;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, analyser]);

  const mins = Math.floor(duration / 60)
    .toString()
    .padStart(2, "0");
  const secs = (duration % 60).toString().padStart(2, "0");

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {isActive ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          ) : (
            <span className="inline-flex rounded-full h-3 w-3 bg-slate-300"></span>
          )}
          <span className="text-sm font-semibold text-slate-800">
            {isActive ? (isPaused ? "Audio Paused" : "Listening to Laptop Audio") : "Audio Idle"}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {sourceLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isActive && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Time: <strong className="font-mono text-slate-900">{mins}:{secs}</strong></span>
            </div>
          )}
          {isActive && !hasAudioTrack && (
            <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <VolumeX className="w-3.5 h-3.5" />
              <span>No audio track in share!</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-14 bg-slate-50 rounded-lg p-2 flex items-center justify-center overflow-hidden border border-slate-100">
        <canvas
          ref={canvasRef}
          width={480}
          height={48}
          className="w-full h-full block"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
        <div className="flex items-center gap-1">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time Audio Spectrum</span>
        </div>
        <div>
          {isActive ? (
            <span className="text-emerald-700 font-medium">Receiving sound stream</span>
          ) : (
            <span>Ready to connect</span>
          )}
        </div>
      </div>
    </div>
  );
};
