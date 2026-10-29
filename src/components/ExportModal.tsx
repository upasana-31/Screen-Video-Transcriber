import React, { useState, useMemo } from "react";
import {
  Download,
  FileText,
  Copy,
  Check,
  X,
  FileCode,
  Film,
  Sliders,
} from "lucide-react";
import { TranscriptSegment, NoteSummary } from "../types";
import {
  generatePlainTextNotes,
  generateMarkdownNotes,
  generateSrtSubtitles,
  downloadFile,
} from "../utils/audioCapture";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: TranscriptSegment[];
  noteSummary: NoteSummary | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  segments,
  noteSummary,
}) => {
  const [format, setFormat] = useState<"txt" | "md" | "srt">("txt");
  const [includeEnglishTranslation, setIncludeEnglishTranslation] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [customTitle, setCustomTitle] = useState(
    `video-notes-${new Date().toISOString().slice(0, 10)}`
  );
  const [copied, setCopied] = useState(false);

  // Generate file content based on selected format & options
  const fileContent = useMemo(() => {
    const summaryToUse = includeSummary ? noteSummary : null;

    if (format === "txt") {
      return generatePlainTextNotes(segments, summaryToUse, includeEnglishTranslation);
    }
    if (format === "md") {
      return generateMarkdownNotes(segments, summaryToUse, includeEnglishTranslation);
    }
    if (format === "srt") {
      return generateSrtSubtitles(segments);
    }
    return "";
  }, [format, segments, noteSummary, includeSummary, includeEnglishTranslation]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const ext = format;
    const cleanTitle = customTitle.replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `${cleanTitle}.${ext}`;
    const mimeType =
      format === "md"
        ? "text/markdown"
        : format === "srt"
        ? "application/x-subrip"
        : "text/plain";
    downloadFile(fileContent, filename, mimeType);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Export Transcript to Text File
              </h3>
              <p className="text-xs text-slate-500">
                Save your laptop video notes directly to your computer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            File Format:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setFormat("txt")}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                format === "txt"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <FileText className={`w-4 h-4 mt-0.5 ${format === "txt" ? "text-blue-600" : "text-slate-500"}`} />
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Plain Text (.txt)
                </span>
                <span className="text-[11px] text-slate-500">
                  Universal clean notes file
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat("md")}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                format === "md"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <FileCode className={`w-4 h-4 mt-0.5 ${format === "md" ? "text-blue-600" : "text-slate-500"}`} />
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Markdown (.md)
                </span>
                <span className="text-[11px] text-slate-500">
                  For Obsidian, Notion, Docs
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat("srt")}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                format === "srt"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <Film className={`w-4 h-4 mt-0.5 ${format === "srt" ? "text-blue-600" : "text-slate-500"}`} />
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Subtitles (.srt)
                </span>
                <span className="text-[11px] text-slate-500">
                  Timecoded video subtitles
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Options & Filename */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              File Name:
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-l-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
              />
              <span className="bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg px-2.5 py-1.5 text-slate-600 font-mono text-xs">
                .{format}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="font-semibold text-slate-700 block">
              Export Inclusions:
            </label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeEnglishTranslation}
                  onChange={(e) => setIncludeEnglishTranslation(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-slate-700">Include English translations for Hindi</span>
              </label>

              {noteSummary && format !== "srt" && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSummary}
                    onChange={(e) => setIncludeSummary(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span className="text-slate-700">Include Executive Summary & Takeaways</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Preview of Text File:
            </span>
            <span className="text-slate-400 font-mono">
              {segments.length} segments
            </span>
          </div>
          <pre className="h-44 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-y-auto leading-relaxed border border-slate-800 whitespace-pre-wrap select-all">
            {fileContent}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy Full Text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .{format} File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
