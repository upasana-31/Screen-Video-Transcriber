import React, { useState } from "react";
import {
  Search,
  Copy,
  Check,
  Languages,
  Clock,
  Trash2,
  Edit2,
  Volume2,
  Sparkles,
} from "lucide-react";
import { TranscriptSegment } from "../types";

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  interimText: string;
  interimLanguage: string;
  showEnglishTranslation: boolean;
  onToggleEnglishTranslation: () => void;
  showRomanized: boolean;
  onToggleRomanized: () => void;
  onUpdateSegmentText: (id: string, newText: string) => void;
  onDeleteSegment: (id: string) => void;
  onClearAll: () => void;
  isLoadingChunk: boolean;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  segments,
  interimText,
  interimLanguage,
  showEnglishTranslation,
  onToggleEnglishTranslation,
  showRomanized,
  onToggleRomanized,
  onUpdateSegmentText,
  onDeleteSegment,
  onClearAll,
  isLoadingChunk,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (seg: TranscriptSegment) => {
    setEditingId(seg.id);
    setEditText(seg.originalText);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateSegmentText(id, editText);
    setEditingId(null);
  };

  const filteredSegments = segments.filter((seg) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      seg.originalText.toLowerCase().includes(q) ||
      (seg.englishText && seg.englishText.toLowerCase().includes(q)) ||
      (seg.speaker && seg.speaker.toLowerCase().includes(q)) ||
      seg.timestamp.includes(q)
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[520px]">
      {/* Header Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>Video Live Transcript</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
              {segments.length}
            </span>
          </h3>
          {isLoadingChunk && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transcribing audio chunk...</span>
            </div>
          )}
        </div>

        {/* Search & Display Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
            />
          </div>

          <button
            type="button"
            onClick={onToggleEnglishTranslation}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
              showEnglishTranslation
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            title="Toggle English translation under Hindi segments"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>EN Translation</span>
          </button>

          <button
            type="button"
            onClick={onToggleRomanized}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              showRomanized
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            title="Toggle Hinglish / Romanized script for Hindi"
          >
            Romanized
          </button>

          {segments.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
              title="Clear transcript"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Transcript Content List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Interim Subtitle banner */}
        {interimText && (
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-start gap-2 animate-fadeIn">
            <Volume2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-[11px] text-blue-700 uppercase tracking-wide">
                  Live Listening Subtitle
                </span>
                {interimLanguage && (
                  <span className="px-1.5 py-0.2 bg-blue-200 text-blue-800 rounded text-[10px]">
                    {interimLanguage}
                  </span>
                )}
              </div>
              <p className="font-medium text-slate-800 italic">
                &ldquo;{interimText}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {segments.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-sm">
                No Video Audio Captured Yet
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Click <strong>&quot;Capture Video Tab / Screen Audio&quot;</strong> above, play your video in Hindi or English, and transcripts will appear here in real-time.
              </p>
            </div>
          </div>
        )}

        {/* Filtered Segments */}
        {filteredSegments.map((seg) => {
          const isHindi = seg.language === "hi";
          const isEnglish = seg.language === "en";
          const isHinglish = seg.language === "hinglish";

          return (
            <div
              key={seg.id}
              className="group p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-2xs transition-all space-y-1.5 relative"
            >
              {/* Segment Metadata Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {seg.timestamp}
                  </span>

                  {seg.speaker && (
                    <span className="text-xs font-bold text-slate-800">
                      {seg.speaker}
                    </span>
                  )}

                  {/* Language Badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isHindi
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : isEnglish
                        ? "bg-indigo-100 text-indigo-900 border border-indigo-200"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    }`}
                  >
                    {isHindi ? "Hindi (हिन्दी)" : isEnglish ? "English" : "Hinglish"}
                  </span>
                </div>

                {/* Actions: Copy & Edit & Delete */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(seg.id, seg.originalText)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                    title="Copy text"
                  >
                    {copiedId === seg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(seg)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                    title="Edit segment"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteSegment(seg.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors"
                    title="Delete segment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Spoken Text (Editable) */}
              {editingId === seg.id ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full text-sm p-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(seg.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-normal text-slate-900 leading-relaxed break-words">
                  {seg.originalText}
                </p>
              )}

              {/* Optional English Translation */}
              {showEnglishTranslation &&
                seg.englishText &&
                seg.language !== "en" &&
                seg.englishText.trim() !== seg.originalText.trim() && (
                  <div className="pl-3 border-l-2 border-blue-300 pt-0.5 text-xs text-blue-900/90 font-medium">
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mr-1">
                      EN:
                    </span>
                    {seg.englishText}
                  </div>
                )}

              {/* Optional Romanized Hindi (Transliteration) */}
              {showRomanized && seg.romanizedHindi && seg.language === "hi" && (
                <div className="pl-3 border-l-2 border-amber-300 pt-0.5 text-xs text-amber-900/90 font-mono">
                  <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider mr-1">
                    Rom:
                  </span>
                  {seg.romanizedHindi}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
