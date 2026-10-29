import React, { useState } from "react";
import {
  Monitor,
  Mic,
  FileAudio,
  Play,
  Square,
  Pause,
  HelpCircle,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AudioSourceType, LanguageMode } from "../types";
import { SAMPLE_CLIPS, SampleClip } from "../utils/sampleClips";

interface SourceSelectorProps {
  isListening: boolean;
  isPaused: boolean;
  currentSource: AudioSourceType | null;
  languageMode: LanguageMode;
  onLanguageModeChange: (mode: LanguageMode) => void;
  translateToEnglish: boolean;
  onTranslateToEnglishChange: (val: boolean) => void;
  onStartScreenCapture: () => void;
  onStartMicCapture: () => void;
  onPlaySampleClip: (clip: SampleClip) => void;
  onUploadFile: (file: File) => void;
  onStop: () => void;
  onTogglePause: () => void;
  onClear: () => void;
  segmentCount: number;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({
  isListening,
  isPaused,
  currentSource,
  languageMode,
  onLanguageModeChange,
  translateToEnglish,
  onTranslateToEnglishChange,
  onStartScreenCapture,
  onStartMicCapture,
  onPlaySampleClip,
  onUploadFile,
  onStop,
  onTogglePause,
  onClear,
  segmentCount,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Top Header & Settings */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Audio Source & Language</span>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              title="How does screen audio capture work?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select how to capture your laptop video audio for instant Hindi & English transcription
          </p>
        </div>

        {/* Language Mode & Translation Switches */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <span>Detect:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => onLanguageModeChange("auto")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  languageMode === "auto"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Auto (Hindi & English)
              </button>
              <button
                type="button"
                onClick={() => onLanguageModeChange("hi")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  languageMode === "hi"
                    ? "bg-white text-amber-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hindi (हिन्दी)
              </button>
              <button
                type="button"
                onClick={() => onLanguageModeChange("en")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  languageMode === "en"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100/70">
            <input
              type="checkbox"
              checked={translateToEnglish}
              onChange={(e) => onTranslateToEnglishChange(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Include English translation</span>
          </label>
        </div>
      </div>

      {/* Help Banner if toggled */}
      {showHelp && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-900 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-950">
                How to capture video audio playing on your laptop screen:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-900/90 pl-1">
                <li>
                  Click <strong>&quot;Capture Video Tab / Screen Audio&quot;</strong> below.
                </li>
                <li>
                  In the browser popup, choose <strong>&quot;Microsoft Edge Tab&quot;</strong> or <strong>&quot;Chrome Tab&quot;</strong> (e.g., YouTube, Coursera, Netflix) or <strong>&quot;Entire Screen&quot;</strong>.
                </li>
                <li>
                  <strong>Crucial step:</strong> Make sure the checkbox labeled <strong>&quot;Share audio&quot;</strong> or <strong>&quot;Also share tab audio&quot;</strong> at the bottom is checked.
                </li>
                <li>
                  Play your video! The tool will listen to the internal digital audio stream in pure clarity with zero room noise.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isListening ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* 1. Primary: Screen / Tab capture */}
          <button
            type="button"
            onClick={onStartScreenCapture}
            className="md:col-span-2 group relative flex flex-col items-start p-4 rounded-xl border-2 border-blue-600 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm hover:from-blue-700 hover:to-indigo-800 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="p-2 rounded-lg bg-white/15 text-white">
                <Monitor className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                Recommended
              </span>
            </div>
            <span className="text-sm font-bold tracking-tight">
              Capture Video Tab / Screen Audio
            </span>
            <span className="text-xs text-blue-100/90 mt-1 line-clamp-2">
              Transcribes directly from YouTube, Netflix, lectures, or Zoom tabs in Microsoft Edge &amp; Chrome.
            </span>
          </button>

          {/* 2. Microphone Capture */}
          <button
            type="button"
            onClick={onStartMicCapture}
            className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all text-left cursor-pointer shadow-2xs"
          >
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700 mb-2">
              <Mic className="w-5 h-5" />
            </span>
            <span className="text-sm font-semibold text-slate-900">
              Laptop Microphone
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Listens to videos playing through your laptop speakers via mic.
            </span>
          </button>

          {/* 3. Demo / Samples & File upload */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 font-medium text-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Test with Demo Audio</span>
            </button>

            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer">
              <FileAudio className="w-4 h-4 text-slate-500" />
              <span>Upload Video / Audio</span>
              <input
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onUploadFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>
      ) : (
        /* Active Recording Controls */
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div className="text-xs">
              <span className="font-bold text-slate-900">
                {currentSource === "screen"
                  ? "Capturing Screen / Video Tab Audio"
                  : currentSource === "mic"
                  ? "Listening via Laptop Microphone"
                  : currentSource === "demo"
                  ? "Playing Demo Speech Clip"
                  : "Processing File Audio"}
              </span>
              <span className="text-slate-500 ml-2">
                ({segmentCount} segment{segmentCount === 1 ? "" : "s"} captured)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePause}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pause</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop & Finish</span>
            </button>
          </div>
        </div>
      )}

      {/* Demo Clips Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Test with Sample Video Speeches
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Want to see how the Hindi and English video transcriber works immediately? Select one of the pre-loaded speech clips below:
            </p>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {SAMPLE_CLIPS.map((clip) => (
                <div
                  key={clip.id}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">
                        {clip.title}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                          clip.language === "Hindi"
                            ? "bg-amber-100 text-amber-800"
                            : clip.language === "English"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {clip.language}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic line-clamp-2">
                      &quot;{clip.transcript}&quot;
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDemoModal(false);
                      onPlaySampleClip(clip);
                    }}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Run Demo</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
