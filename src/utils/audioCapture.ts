import { TranscriptSegment, NoteSummary } from "../types";

// Convert a Blob to base64 data string
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Format seconds into MM:SS or HH:MM:SS
export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs.toString().padStart(2, "0")}:${remMins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Format seconds into SRT subtitle timestamp: 00:00:05,000
export function formatSrtTime(seconds: number): string {
  const totalMs = Math.floor(seconds * 1000);
  const ms = totalMs % 1000;
  const totalSecs = Math.floor(totalMs / 1000);
  const s = totalSecs % 60;
  const m = Math.floor(totalSecs / 60) % 60;
  const h = Math.floor(totalSecs / 3600);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

// Generate a plain text notes file
export function generatePlainTextNotes(
  segments: TranscriptSegment[],
  noteSummary?: NoteSummary | null,
  includeEnglishTranslation = true
): string {
  const dateStr = new Date().toLocaleString();
  const divider = "=".repeat(60);
  const subDivider = "-".repeat(60);

  let output = `${divider}\n`;
  output += `VIDEO TRANSCRIPT & NOTES\n`;
  output += `Generated: ${dateStr}\n`;
  output += `Source: Laptop Screen Audio Playback\n`;
  output += `Languages: English / Hindi (हिन्दी)\n`;
  output += `${divider}\n\n`;

  if (noteSummary) {
    output += `[TITLE / TOPIC]\n${noteSummary.title}\n\n`;
    output += `[EXECUTIVE SUMMARY]\n${noteSummary.summary}\n\n`;

    if (noteSummary.keyTakeaways && noteSummary.keyTakeaways.length > 0) {
      output += `[KEY TAKEAWAYS]\n`;
      noteSummary.keyTakeaways.forEach((item, idx) => {
        output += `  ${idx + 1}. ${item}\n`;
      });
      output += `\n`;
    }

    if (noteSummary.actionItems && noteSummary.actionItems.length > 0) {
      output += `[ACTION ITEMS / NEXT STEPS]\n`;
      noteSummary.actionItems.forEach((item, idx) => {
        output += `  [ ] ${item}\n`;
      });
      output += `\n`;
    }

    if (noteSummary.glossary && noteSummary.glossary.length > 0) {
      output += `[GLOSSARY & TERMINOLOGY]\n`;
      noteSummary.glossary.forEach((item) => {
        output += `  * ${item.term}: ${item.definition}\n`;
      });
      output += `\n`;
    }
  }

  output += `${subDivider}\n`;
  output += `[CHRONOLOGICAL TRANSCRIPT]\n`;
  output += `${subDivider}\n\n`;

  if (segments.length === 0) {
    output += `(No transcript recorded)\n`;
  } else {
    segments.forEach((seg) => {
      const speaker = seg.speaker ? ` [${seg.speaker}]` : "";
      const langBadge = seg.language === "hi" ? " [Hindi]" : seg.language === "en" ? " [English]" : "";
      output += `[${seg.timestamp}]${speaker}${langBadge}:\n  ${seg.originalText}\n`;
      if (
        includeEnglishTranslation &&
        seg.englishText &&
        seg.language !== "en" &&
        seg.englishText.trim() !== seg.originalText.trim()
      ) {
        output += `  (English translation): ${seg.englishText}\n`;
      }
      if (seg.romanizedHindi && seg.language === "hi") {
        output += `  (Romanized Hinglish): ${seg.romanizedHindi}\n`;
      }
      output += `\n`;
    });
  }

  output += `${divider}\n`;
  output += `Exported from Screen Video Transcriber\n`;
  output += `${divider}\n`;

  return output;
}

// Generate Markdown formatted notes
export function generateMarkdownNotes(
  segments: TranscriptSegment[],
  noteSummary?: NoteSummary | null,
  includeEnglishTranslation = true
): string {
  const dateStr = new Date().toLocaleString();

  let md = `# Video Transcript & Study Notes\n\n`;
  md += `*Recorded on ${dateStr} via Laptop Audio*\n\n`;

  if (noteSummary) {
    md += `## 📌 Topic: ${noteSummary.title}\n\n`;
    md += `### Summary\n${noteSummary.summary}\n\n`;

    if (noteSummary.keyTakeaways && noteSummary.keyTakeaways.length > 0) {
      md += `### Key Takeaways\n`;
      noteSummary.keyTakeaways.forEach((item) => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (noteSummary.actionItems && noteSummary.actionItems.length > 0) {
      md += `### Action Items\n`;
      noteSummary.actionItems.forEach((item) => {
        md += `- [ ] ${item}\n`;
      });
      md += `\n`;
    }

    if (noteSummary.glossary && noteSummary.glossary.length > 0) {
      md += `### Glossary & Key Terms\n`;
      noteSummary.glossary.forEach((item) => {
        md += `- **${item.term}**: ${item.definition}\n`;
      });
      md += `\n`;
    }
  }

  md += `---\n\n## 📝 Full Timestamped Transcript\n\n`;

  if (segments.length === 0) {
    md += `*(No transcript segments recorded)*\n`;
  } else {
    segments.forEach((seg) => {
      const speaker = seg.speaker ? `**${seg.speaker}** ` : "";
      const langLabel = seg.language === "hi" ? " `Hindi`" : seg.language === "en" ? " `English`" : "";
      md += `> **\`${seg.timestamp}\`** ${speaker}${langLabel}\n>\n`;
      md += `> ${seg.originalText}\n`;

      if (
        includeEnglishTranslation &&
        seg.englishText &&
        seg.language !== "en" &&
        seg.englishText.trim() !== seg.originalText.trim()
      ) {
        md += `>\n> *English: ${seg.englishText}*\n`;
      }
      if (seg.romanizedHindi && seg.language === "hi") {
        md += `>\n> *Romanized: ${seg.romanizedHindi}*\n`;
      }
      md += `\n`;
    });
  }

  return md;
}

// Generate SubRip Subtitle (.srt) format
export function generateSrtSubtitles(segments: TranscriptSegment[]): string {
  let srt = "";
  segments.forEach((seg, index) => {
    const startTime = formatSrtTime(seg.seconds);
    const endTime = formatSrtTime(seg.seconds + 4.5);
    srt += `${index + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${seg.originalText}\n`;
    if (seg.englishText && seg.language === "hi" && seg.englishText !== seg.originalText) {
      srt += `[${seg.englishText}]\n`;
    }
    srt += `\n`;
  });
  return srt;
}

// Download text string as a file to user's computer
export function downloadFile(content: string, filename: string, mimeType: string = "text/plain") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
