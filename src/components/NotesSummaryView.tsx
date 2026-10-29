import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  ListChecks,
  Bookmark,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  FileText,
  HelpCircle,
} from "lucide-react";
import { NoteSummary } from "../types";

interface NotesSummaryViewProps {
  noteSummary: NoteSummary | null;
  onGenerateNotes: () => void;
  isGeneratingNotes: boolean;
  hasTranscript: boolean;
  onExportNotes: () => void;
}

export const NotesSummaryView: React.FC<NotesSummaryViewProps> = ({
  noteSummary,
  onGenerateNotes,
  isGeneratingNotes,
  hasTranscript,
  onExportNotes,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyNotes = () => {
    if (!noteSummary) return;
    navigator.clipboard.writeText(noteSummary.formattedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[520px]">
      {/* Header Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            AI Notes & Key Takeaways
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {noteSummary && (
            <button
              type="button"
              onClick={handleCopyNotes}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Notes</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            disabled={!hasTranscript || isGeneratingNotes}
            onClick={onGenerateNotes}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer"
          >
            {isGeneratingNotes ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{noteSummary ? "Regenerate Notes" : "Generate Notes"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!noteSummary ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-sm">
                No Notes Generated Yet
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {hasTranscript
                  ? "Click 'Generate Notes' above to turn your video transcript into structured study notes, key takeaways, and action items."
                  : "Start capturing laptop video audio to record transcript segments, then generate structured notes."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Title & Summary */}
            <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
              <span className="font-bold text-slate-900 text-sm block">
                {noteSummary.title}
              </span>
              <p className="text-slate-700 leading-relaxed text-xs">
                {noteSummary.summary}
              </p>
            </div>

            {/* Key Takeaways */}
            {noteSummary.keyTakeaways && noteSummary.keyTakeaways.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Key Takeaways & Core Concepts</span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {noteSummary.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5"></span>
                      <span className="leading-normal">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {noteSummary.actionItems && noteSummary.actionItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Action Items & Next Steps</span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {noteSummary.actionItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Glossary */}
            {noteSummary.glossary && noteSummary.glossary.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Key Terminology & Hindi-English Glossary</span>
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {noteSummary.glossary.map((g, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-amber-50/40 border border-amber-200/60 flex items-baseline gap-2"
                    >
                      <strong className="text-amber-950 font-bold shrink-0">
                        {g.term}:
                      </strong>
                      <span className="text-slate-700">{g.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Export CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onExportNotes}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Notes Directly to Text File (.txt / .md)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
