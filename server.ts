import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY is not set. Transcription will return a helpful guidance response.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Audio chunk transcription endpoint
app.post("/api/transcribe", async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = "audio/webm",
      languageMode = "auto", // "auto" | "hi" | "en"
      translateToEnglish = false,
      timestampOffset = "00:00",
      previousContext = "",
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "Missing audioBase64 data" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is required. Please add it in AI Studio Secrets settings.",
      });
    }

    const ai = getGeminiClient();

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, "");

    const instruction = `
You are an expert audio transcriber specializing in video audio played on laptops (lectures, YouTube, tutorials, meetings, podcasts, films).
The audio may be spoken in English, Hindi (हिन्दी), or mixed Hinglish (code-switched Hindi and English).
Starting timestamp of this chunk: ${timestampOffset}.
Previous context sentences: "${previousContext || "None"}".

Task instructions:
1. Listen carefully to the audio chunk.
2. If the audio is silence, background static, breathing, or empty noise with no discernable speech, set isSpeech to false and transcript to empty string.
3. If speech is present:
   - Identify the primary language: "English", "Hindi", or "Hinglish".
   - Transcribe accurately verbatim with proper punctuation.
   - For Hindi words: Write them in proper Devanagari script (e.g., "नमस्ते दोस्तों", "आज हम बात करेंगे").
   - For English words: Write them in English alphabet.
   - For Hinglish (mixed): Write Hindi words in Devanagari and English technical terms in English (e.g. "इस video में हम React के hooks सीखेंगे") OR Romanized script if natural.
   - Provide an English translation for any Hindi segments so notes can be read in English if requested.
   - Provide a Romanized transliteration (Hinglish in Latin characters) if Hindi is spoken.
   - Break into short conversational segments with approximate timestamps and speaker label if discernible.
`;

    const audioPart = {
      inlineData: {
        mimeType: mimeType || "audio/webm",
        data: cleanBase64,
      },
    };

    const textPart = {
      text: instruction,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [audioPart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSpeech: {
              type: Type.BOOLEAN,
              description: "True if human speech is present in the audio, false if only silence, music, or noise.",
            },
            detectedLanguage: {
              type: Type.STRING,
              description: "Primary detected language: 'English', 'Hindi', 'Hinglish', or 'Unknown'",
            },
            transcript: {
              type: Type.STRING,
              description: "Full verbatim transcript in original languages (Devanagari for Hindi, English for English)",
            },
            englishTranslation: {
              type: Type.STRING,
              description: "English translation of the transcript (if original is Hindi/Hinglish) or identical if English",
            },
            romanizedHindi: {
              type: Type.STRING,
              description: "Transliteration of Hindi words in Latin characters (Hinglish format), e.g. 'Namaste dosto'",
            },
            segments: {
              type: Type.ARRAY,
              description: "Timestamped line-by-line segments",
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: "e.g. '01:23'" },
                  speaker: { type: Type.STRING, description: "e.g. 'Speaker 1' or 'Presenter'" },
                  originalText: { type: Type.STRING, description: "Original spoken text" },
                  englishText: { type: Type.STRING, description: "English translation or equivalent" },
                  language: { type: Type.STRING, description: "'hi' or 'en' or 'hinglish'" },
                },
                required: ["timestamp", "originalText"],
              },
            },
            summarySnippet: {
              type: Type.STRING,
              description: "Brief 1-sentence recap of what was just said in this chunk",
            },
          },
          required: ["isSpeech", "detectedLanguage", "transcript"],
        },
      },
    });

    const jsonText = response.text?.trim() || "{}";
    const result = JSON.parse(jsonText);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Transcription error:", error);
    res.status(500).json({
      error: error.message || "Failed to transcribe audio chunk",
      details: String(error),
    });
  }
});

// Full structured notes generator endpoint
app.post("/api/generate-notes", async (req, res) => {
  try {
    const { transcript, title = "Video Notes", languagePreference = "auto" } = req.body;

    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      return res.status(400).json({ error: "Transcript text is required to generate notes." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is required to generate notes. Please configure it in AI Studio.",
      });
    }

    const ai = getGeminiClient();

    const prompt = `
You are an expert educational note-taker and secretary.
You have been given a raw transcript of a video played on a user's laptop.
The video might have been spoken in Hindi, English, or mixed Hinglish.

User's requested language preference: ${languagePreference}.
Video title/topic: "${title}".

Raw Transcript:
"""
${transcript.slice(0, 40000)}
"""

Please produce comprehensive, beautifully formatted study and reference notes:
1. An Executive Summary (2-3 clear sentences).
2. Key Takeaways & Core Concepts (bullet points with bold terms).
3. Action Items or Next Steps (if applicable).
4. Glossary / Key Terminology (especially clarifying Hindi and English concepts).
5. Clean chronological outline.
6. A ready-to-export clean markdown version suitable for saving to a .txt or .md file.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            glossary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ["term", "definition"],
              },
            },
            formattedMarkdown: {
              type: Type.STRING,
              description: "Complete, formatted markdown notes document ready to be downloaded as a text file.",
            },
          },
          required: ["title", "summary", "keyTakeaways", "formattedMarkdown"],
        },
      },
    });

    const jsonText = response.text?.trim() || "{}";
    const result = JSON.parse(jsonText);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Notes generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate notes",
    });
  }
});

// Chrome Extension files endpoint
// In case the user wants to install it as an unpacked Chrome Extension
app.get("/api/extension-download", (_req, res) => {
  res.json({
    description: "Manifest and instructions to run as a Chrome Extension",
    manifest: {
      manifest_version: 3,
      name: "Screen Video Audio Transcriber (Hindi & English)",
      version: "1.0.0",
      description: "Transcribes audio of videos playing on your laptop screen in English and Hindi directly into notes.",
      permissions: ["tabCapture", "storage", "offscreen"],
      action: {
        default_title: "Screen Video Transcriber",
      },
    },
  });
});

// Setup Vite middleware for development or static serve for production
async function setupApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Screen Video Transcriber server running on http://0.0.0.0:${PORT}`);
  });
}

setupApp();
