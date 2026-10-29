import React, { useState } from "react";
import {
  Puzzle,
  Download,
  Check,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  Layers,
} from "lucide-react";
import { downloadFile } from "../utils/audioCapture";

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionModal: React.FC<ExtensionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const manifestContent = JSON.stringify(
    {
      manifest_version: 3,
      name: "Screen Video Audio Transcriber (Hindi & English)",
      version: "1.0.0",
      description:
        "Transcribes audio of videos playing on your laptop screen in English and Hindi directly into notes.",
      permissions: ["tabCapture", "storage", "offscreen"],
      action: {
        default_popup: "popup.html",
        default_icon: "icon.png",
      },
      background: {
        service_worker: "background.js",
      },
    },
    null,
    2
  );

  const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Screen Video Transcriber</title>
  <style>
    body { font-family: system-ui, sans-serif; width: 340px; padding: 16px; margin: 0; }
    h2 { font-size: 15px; margin-top: 0; color: #0f172a; }
    p { font-size: 12px; color: #475569; line-height: 1.4; }
    button {
      width: 100%; padding: 10px; background: #2563eb; color: white;
      border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
    }
    button:hover { background: #1d4ed8; }
    .badge { font-size: 10px; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h2>🎙️ Screen Video Transcriber</h2>
  <p>Generates real-time transcripts & notes for video audio playing on your laptop screen (Hindi & English).</p>
  <button id="openAppBtn">Launch Full Transcriber Web App</button>
  <script src="popup.js"></script>
</body>
</html>`;

  const popupJs = `document.getElementById('openAppBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: window.location.origin || 'https://ais-dev-btq5obvdt4b5z4dl2be3i4-662771020272.asia-southeast1.run.app' });
});`;

  const backgroundJs = `// Chrome extension background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log("Screen Video Audio Transcriber extension installed.");
});`;

  const readmeMd = `# Screen Video Audio Transcriber (Chrome Extension)

This Chrome Extension lets you capture audio from any video playing in a Chrome tab or on your laptop screen and transcribe it in English and Hindi, exporting notes to text files.

## How to Install Unpacked in Chrome:
1. Download or extract this extension folder.
2. Open Google Chrome and navigate to: \`chrome://extensions\`
3. In the top right corner, turn ON **Developer mode**.
4. In the top left, click **Load unpacked**.
5. Select this folder!
6. Pin "Screen Video Transcriber" to your Chrome toolbar.
`;

  const handleDownloadManifest = () => {
    downloadFile(manifestContent, "manifest.json", "application/json");
  };

  const handleDownloadReadme = () => {
    downloadFile(readmeMd, "README.md", "text/markdown");
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(id);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Browser Extension & Installation Guide
              </h3>
              <p className="text-xs text-slate-500">
                Run as a Web App or install in Google Chrome &amp; Microsoft Edge
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1.5">
            <span className="font-bold text-blue-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Web App (Works on Edge &amp; Chrome)</span>
            </span>
            <p className="text-blue-900/90 leading-relaxed">
              <strong>No installation needed!</strong> Microsoft Edge and Chrome both natively support screen and tab audio capture. Just click <em>&quot;Capture Video Tab / Screen Audio&quot;</em> and tick <em>&quot;Share audio&quot;</em>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Extension Mode (Edge &amp; Chrome)</span>
            </span>
            <p className="text-slate-600 leading-relaxed">
              Microsoft Edge is built on Chromium, so it runs this exact extension natively. You can pin it to your Edge toolbar for quick access to transcripts.
            </p>
          </div>
        </div>

        {/* Installation Steps */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-900 block">
            How to install in Microsoft Edge or Google Chrome:
          </span>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <li>
              Download the <strong>manifest.json</strong> and <strong>README.md</strong> files below into a folder.
            </li>
            <li>
              <strong>In Microsoft Edge:</strong> Open <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono">edge://extensions</code> and turn ON the <strong>&quot;Developer mode&quot;</strong> switch on the left sidebar.
              <br />
              <span className="text-slate-500 text-[11px] block mt-0.5">
                (In Chrome: Open <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono">chrome://extensions</code> and toggle Developer mode in the top right).
              </span>
            </li>
            <li>
              Click the <strong>&quot;Load unpacked&quot;</strong> button.
            </li>
            <li>
              Select the folder with the downloaded files. The extension will appear in your Edge/Chrome toolbar!
            </li>
          </ol>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadManifest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>manifest.json</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadReadme}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>README.md</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
