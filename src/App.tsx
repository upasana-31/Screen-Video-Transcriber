import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Download,
  Sparkles,
  Volume2,
  Languages,
  Monitor,
  Mic,
  RotateCcw,
  BookOpen,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Laptop,
  Puzzle,
} from "lucide-react";
import { TranscriptSegment, AudioSourceType, LanguageMode, NoteSummary } from "./types";
import { formatTime, blobToBase64, generatePlainTextNotes, downloadFile } from "./utils/audioCapture";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { SourceSelector } from "./components/SourceSelector";
import { TranscriptView } from "./components/TranscriptView";
import { NotesSummaryView } from "./components/NotesSummaryView";
import { ExportModal } from "./components/ExportModal";
import { ExtensionModal } from "./components/ExtensionModal";
import { SampleClip } from "./utils/sampleClips";

export default function App() {
  // Session & Audio State
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSource, setCurrentSource] = useState<AudioSourceType | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [hasAudioTrack, setHasAudioTrack] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Language & Options
  const [languageMode, setLanguageMode] = useState<LanguageMode>("auto");
  const [translateToEnglish, setTranslateToEnglish] = useState(true);
  const [showEnglishTranslation, setShowEnglishTranslation] = useState(true);
  const [showRomanized, setShowRomanized] = useState(false);

  // Transcript Data
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState("");
  const [interimLanguage, setInterimLanguage] = useState("");
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);

  // Notes Summary Data
  const [noteSummary, setNoteSummary] = useState<NoteSummary | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<"transcript" | "notes">("transcript");

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  // Refs for Web Audio & MediaRecorder
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksBufferRef = useRef<Blob[]>([]);
  const chunkProcessingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  // Timer interval for session duration
  useEffect(() => {
    if (isListening && !isPaused) {
      timerIntervalRef.current = window.setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isListening, isPaused]);

  // Clean stop of all media streams, recorders, and visualizers
  const stopAllMedia = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping MediaRecorder:", e);
      }
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    setIsListening(false);
    setIsPaused(false);
    setInterimText("");
  };

  // Start Screen / Chrome Tab Audio Capture
  const handleStartScreenCapture = async () => {
    setAudioError(null);
    try {
      // Prompt user to select screen or tab with audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          // Echo cancellation and noise suppression can sometimes muffle music/video, disable to capture crisp audio
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        setHasAudioTrack(false);
        setAudioError(
          "No audio track was detected from the screen share! Please make sure to check the 'Share audio' or 'Also share tab audio' checkbox in the Chrome/browser window selection dialog."
        );
      } else {
        setHasAudioTrack(true);
      }

      // Handle user clicking native "Stop sharing" bar
      displayStream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          handleStop();
        };
      });
      if (audioTracks[0]) {
        audioTracks[0].onended = () => {
          handleStop();
        };
      }

      initAudioPipeline(displayStream, "screen");
    } catch (err: any) {
      console.warn("Screen capture cancelled or failed:", err);
      if (err.name !== "NotAllowedError") {
        setAudioError(err.message || "Failed to capture screen audio.");
      }
    }
  };

  // Start Laptop Microphone Capture
  const handleStartMicCapture = async () => {
    setAudioError(null);
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      setHasAudioTrack(true);
      initAudioPipeline(micStream, "mic");
    } catch (err: any) {
      console.error("Mic capture failed:", err);
      setAudioError("Microphone access was denied or not found. Please allow microphone permissions.");
    }
  };

  // Initialize Web Audio Analyzer & MediaRecorder Chunk pipeline
  const initAudioPipeline = (stream: MediaStream, source: AudioSourceType) => {
    mediaStreamRef.current = stream;
    setCurrentSource(source);
    setIsListening(true);
    setIsPaused(false);

    // 1. Setup AudioContext & AnalyserNode for the live visualizer
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const sourceNode = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
        sourceNode.connect(analyser);
      }
    } catch (e) {
      console.warn("AudioContext setup warning:", e);
    }

    // 2. Setup MediaRecorder for audio chunk capture
    try {
      const audioTrack = stream.getAudioTracks()[0];
      const recordStream = audioTrack ? new MediaStream([audioTrack]) : stream;

      // Supported mimeTypes
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/ogg")
          ? "audio/ogg"
          : "";
      }

      const recorder = new MediaRecorder(recordStream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksBufferRef.current = [];

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksBufferRef.current.push(e.data);
          // Process accumulated chunk
          await processAudioChunk(new Blob(audioChunksBufferRef.current, { type: recorder.mimeType }));
          audioChunksBufferRef.current = [];
        }
      };

      // Slice recording into 7-second chunks for continuous transcription
      recorder.start(7000);
    } catch (e) {
      console.error("MediaRecorder init error:", e);
    }

    // 3. Setup Web Speech API for immediate sub-second interim live subtitles
    setupWebSpeechRecognition();
  };

  // Browser Web Speech API for real-time live captions
  const setupWebSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languageMode === "hi" ? "hi-IN" : "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            // Already handled by Gemini chunks or fallback
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimText(interim);
        setInterimLanguage(languageMode === "hi" ? "Hindi (Live)" : "English (Live)");
      };

      recognition.onerror = (e: any) => {
        // Ignore aborted errors
        if (e.error !== "aborted" && e.error !== "no-speech") {
          console.warn("SpeechRecognition error:", e.error);
        }
      };

      recognition.onend = () => {
        if (isListening && !isPaused && recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Web Speech API error:", e);
    }
  };

  // Process an audio chunk via the backend Gemini API
  const processAudioChunk = async (blob: Blob) => {
    if (blob.size < 500) return; // ignore empty silent ticks
    if (chunkProcessingRef.current) return;

    chunkProcessingRef.current = true;
    setIsLoadingChunk(true);

    try {
      const base64Data = await blobToBase64(blob);
      const currentOffset = formatTime(sessionDuration);

      // Grab last sentence for context
      const prevContext = segments.length > 0 ? segments[segments.length - 1].originalText : "";

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType: blob.type || "audio/webm",
          languageMode,
          translateToEnglish,
          timestampOffset: currentOffset,
          previousContext: prevContext,
        }),
      });

      const resData = await response.json();

      if (resData.success && resData.data) {
        const result = resData.data;

        // If human speech is detected and transcript is not empty
        if (result.isSpeech && result.transcript && result.transcript.trim().length > 0) {
          const detectedLang = result.detectedLanguage?.toLowerCase().includes("hindi")
            ? "hi"
            : result.detectedLanguage?.toLowerCase().includes("hinglish")
            ? "hinglish"
            : "en";

          // If structured segments were parsed, append them
          if (result.segments && Array.isArray(result.segments) && result.segments.length > 0) {
            const newSegs: TranscriptSegment[] = result.segments.map((s: any, idx: number) => ({
              id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: s.timestamp || currentOffset,
              seconds: sessionDuration,
              speaker: s.speaker || "Speaker",
              originalText: s.originalText,
              englishText: s.englishText,
              romanizedHindi: result.romanizedHindi,
              language: (s.language as any) || detectedLang,
            }));
            setSegments((prev) => [...prev, ...newSegs]);
          } else {
            // Fallback single segment
            const newSeg: TranscriptSegment = {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: currentOffset,
              seconds: sessionDuration,
              speaker: "Speaker",
              originalText: result.transcript,
              englishText: result.englishTranslation,
              romanizedHindi: result.romanizedHindi,
              language: detectedLang,
            };
            setSegments((prev) => [...prev, newSeg]);
          }

          // Clear interim preview once official chunk arrived
          setInterimText("");
        }
      } else if (resData.error) {
        console.warn("API Transcribe note:", resData.error);
      }
    } catch (err: any) {
      console.error("Chunk upload error:", err);
    } finally {
      chunkProcessingRef.current = false;
      setIsLoadingChunk(false);
    }
  };

  // Run Demo sample clip
  const handlePlaySampleClip = (clip: SampleClip) => {
    stopAllMedia();
    setCurrentSource("demo");
    setIsListening(true);
    setHasAudioTrack(true);
    setAudioError(null);

    // Simulate playback & transcription
    setInterimText(clip.transcript.slice(0, 40) + "...");
    setInterimLanguage(clip.language);

    const targetLang: "hi" | "en" | "hinglish" =
      clip.language === "Hindi" ? "hi" : clip.language === "English" ? "en" : "hinglish";

    // Use browser speechSynthesis if available to actually play audio on the laptop!
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(clip.transcript);
      utterance.rate = 1.0;
      if (clip.language === "Hindi") {
        utterance.lang = "hi-IN";
      } else {
        utterance.lang = "en-US";
      }
      window.speechSynthesis.speak(utterance);
    }

    setTimeout(() => {
      setInterimText("");
      const newSeg: TranscriptSegment = {
        id: `demo-${Date.now()}`,
        timestamp: formatTime(sessionDuration),
        seconds: sessionDuration,
        speaker: "Presenter",
        originalText: clip.transcript,
        englishText: clip.englishTranslation,
        romanizedHindi:
          clip.language === "Hindi"
            ? "Namaste dosto! Aaj ke is vishesh video me hum AI aur machine learning ke niyamon ko samjhenge..."
            : undefined,
        language: targetLang,
      };
      setSegments((prev) => [...prev, newSeg]);
      setIsListening(false);
    }, 2500);
  };

  // Upload local video or audio file
  const handleUploadFile = async (file: File) => {
    stopAllMedia();
    setCurrentSource("file");
    setIsLoadingChunk(true);
    setAudioError(null);

    try {
      const base64 = await blobToBase64(file);
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType: file.type || "audio/mp4",
          languageMode,
          translateToEnglish,
          timestampOffset: "00:00",
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const result = resData.data;
        if (result.transcript) {
          const detectedLang = result.detectedLanguage?.toLowerCase().includes("hindi")
            ? "hi"
            : result.detectedLanguage?.toLowerCase().includes("hinglish")
            ? "hinglish"
            : "en";

          if (result.segments && result.segments.length > 0) {
            const newSegs = result.segments.map((s: any, idx: number) => ({
              id: `file-${Date.now()}-${idx}`,
              timestamp: s.timestamp || "00:00",
              seconds: 0,
              speaker: s.speaker || "Speaker",
              originalText: s.originalText,
              englishText: s.englishText,
              romanizedHindi: result.romanizedHindi,
              language: s.language || detectedLang,
            }));
            setSegments((prev) => [...prev, ...newSegs]);
          } else {
            setSegments((prev) => [
              ...prev,
              {
                id: `file-${Date.now()}`,
                timestamp: "00:00",
                seconds: 0,
                speaker: "Speaker",
                originalText: result.transcript,
                englishText: result.englishTranslation,
                romanizedHindi: result.romanizedHindi,
                language: detectedLang,
              },
            ]);
          }
        }
      } else {
        setAudioError(resData.error || "Could not transcribe file.");
      }
    } catch (e: any) {
      setAudioError("Error processing file: " + e.message);
    } finally {
      setIsLoadingChunk(false);
      setCurrentSource(null);
    }
  };

  // Stop Session
  const handleStop = () => {
    stopAllMedia();
  };

  // Toggle Pause/Resume
  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
      }
    } else {
      setIsPaused(true);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause();
      }
    }
  };

  // Clear Session
  const handleClear = () => {
    setSegments([]);
    setNoteSummary(null);
    setSessionDuration(0);
    setInterimText("");
  };

  // Update segment text (inline editing)
  const handleUpdateSegmentText = (id: string, newText: string) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, originalText: newText } : seg))
    );
  };

  // Delete individual segment
  const handleDeleteSegment = (id: string) => {
    setSegments((prev) => prev.filter((seg) => seg.id !== id));
  };

  // Generate structured study notes via Gemini
  const handleGenerateNotes = async () => {
    if (segments.length === 0) return;
    setIsGeneratingNotes(true);
    setAudioError(null);

    const fullTranscript = segments
      .map(
        (s) =>
          `[${s.timestamp}] ${s.speaker || "Speaker"} (${s.language}): ${s.originalText}${
            s.englishText && s.language !== "en" ? ` [EN Translation: ${s.englishText}]` : ""
          }`
      )
      .join("\n");

    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          title: "Laptop Video Notes",
          languagePreference: languageMode,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setNoteSummary(resData.data);
        setActiveTab("notes"); // switch to notes tab to reveal formatted summary
      } else {
        setAudioError(resData.error || "Failed to generate notes.");
      }
    } catch (e: any) {
      setAudioError("Notes error: " + e.message);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  // 1-Click quick export to text file
  const handleQuickExportTxt = () => {
    const txt = generatePlainTextNotes(segments, noteSummary, showEnglishTranslation);
    const filename = `video-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    downloadFile(txt, filename, "text/plain");
  };

  const getSourceLabel = () => {
    if (currentSource === "screen") return "Screen / Tab Audio";
    if (currentSource === "mic") return "Laptop Mic";
    if (currentSource === "demo") return "Demo Sample";
    if (currentSource === "file") return "File Audio";
    return "Not connected";
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Screen Video Transcriber
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Hindi &amp; English
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Capture video audio playing on your laptop screen and export directly to text notes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chrome Extension Guide Button */}
            <button
              type="button"
              onClick={() => setShowExtensionModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              title="View or download Chrome Extension"
            >
              <Puzzle className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Chrome Extension</span>
            </button>

            {/* Export Directly to Text File Button */}
            <button
              type="button"
              disabled={segments.length === 0}
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Notes (.txt)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Error / Warning Alert Banner */}
        {audioError && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Note on Audio Capture:</strong>
                <p className="text-amber-800 leading-relaxed">{audioError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAudioError(null)}
              className="text-amber-600 hover:text-amber-800 text-xs font-bold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Control Grid: Source Selector & Audio Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2">
            <SourceSelector
              isListening={isListening}
              isPaused={isPaused}
              currentSource={currentSource}
              languageMode={languageMode}
              onLanguageModeChange={setLanguageMode}
              translateToEnglish={translateToEnglish}
              onTranslateToEnglishChange={setTranslateToEnglish}
              onStartScreenCapture={handleStartScreenCapture}
              onStartMicCapture={handleStartMicCapture}
              onPlaySampleClip={handlePlaySampleClip}
              onUploadFile={handleUploadFile}
              onStop={handleStop}
              onTogglePause={handleTogglePause}
              onClear={handleClear}
              segmentCount={segments.length}
            />
          </div>

          <div className="lg:col-span-1">
            <AudioVisualizer
              analyser={analyserRef.current}
              isActive={isListening}
              sourceLabel={getSourceLabel()}
              duration={sessionDuration}
              isPaused={isPaused}
              hasAudioTrack={hasAudioTrack}
            />
          </div>
        </div>

        {/* Tab switcher for Transcript vs Structured AI Notes */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="inline-flex rounded-xl bg-slate-200/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("transcript")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "transcript"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Live Transcript ({segments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "notes"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Structured Notes &amp; Takeaways {noteSummary ? "✓" : ""}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {segments.length > 0 && (
              <button
                type="button"
                onClick={handleQuickExportTxt}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                title="Quick download as .txt"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Quick Save .txt</span>
              </button>
            )}
          </div>
        </div>

        {/* Dual Panel or Tabbed Content */}
        <div>
          {activeTab === "transcript" ? (
            <TranscriptView
              segments={segments}
              interimText={interimText}
              interimLanguage={interimLanguage}
              showEnglishTranslation={showEnglishTranslation}
              onToggleEnglishTranslation={() => setShowEnglishTranslation(!showEnglishTranslation)}
              showRomanized={showRomanized}
              onToggleRomanized={() => setShowRomanized(!showRomanized)}
              onUpdateSegmentText={handleUpdateSegmentText}
              onDeleteSegment={handleDeleteSegment}
              onClearAll={handleClear}
              isLoadingChunk={isLoadingChunk}
            />
          ) : (
            <NotesSummaryView
              noteSummary={noteSummary}
              onGenerateNotes={handleGenerateNotes}
              isGeneratingNotes={isGeneratingNotes}
              hasTranscript={segments.length > 0}
              onExportNotes={() => setShowExportModal(true)}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Screen Video Transcriber</span>
            <span>•</span>
            <span>Supports Hindi (हिन्दी), English, and mixed Hinglish</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowExtensionModal(true)}
              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Install as Browser Extension
            </button>
            <span>•</span>
            <span>Zero latency screen audio capture</span>
          </div>
        </div>
      </footer>

      {/* Export to File Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        segments={segments}
        noteSummary={noteSummary}
      />

      {/* Browser Extension Modal */}
      <ExtensionModal
        isOpen={showExtensionModal}
        onClose={() => setShowExtensionModal(false)}
      />
    </div>
  );
}
