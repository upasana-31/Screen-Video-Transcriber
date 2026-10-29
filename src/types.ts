export interface TranscriptSegment {
  id: string;
  timestamp: string; // e.g. "00:12"
  seconds: number;
  speaker?: string;
  originalText: string;
  englishText?: string;
  romanizedHindi?: string;
  language: "hi" | "en" | "hinglish" | "unknown";
  isInterim?: boolean;
}

export type AudioSourceType = "screen" | "mic" | "demo" | "file";

export type LanguageMode = "auto" | "hi" | "en";

export interface NoteSummary {
  title: string;
  summary: string;
  keyTakeaways: string[];
  actionItems?: string[];
  glossary?: Array<{ term: string; definition: string }>;
  formattedMarkdown: string;
}

export interface TranscriptionResponse {
  isSpeech: boolean;
  detectedLanguage: string;
  transcript: string;
  englishTranslation?: string;
  romanizedHindi?: string;
  segments?: Array<{
    timestamp: string;
    speaker?: string;
    originalText: string;
    englishText?: string;
    language?: string;
  }>;
  summarySnippet?: string;
}
