import React, { useState } from "react";
import UploadModal from "../components/UploadModal";
import { analyzeImage } from "../api"; // ✅ Import directly from main API module

export default function Upload({ onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleFileUpload({ file, notes }) {
    setLoading(true);
    setError(null);
    setResults(null);
    setSuccess(false);

    try {
      // ✅ Call backend with file + notes
      const result = await analyzeImage({ file, notes });
      console.log("✅ Analysis result:", result);

      setResults(result);

      // ✅ Ensure we track created case properly
      if (result.case_id) {
        onCreated(result.case_id);
        setSuccess(true);
      } else {
        console.warn("⚠️ No case_id returned, using fallback.");
        onCreated(Date.now());
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      setError(err.message || "Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Upload Evidence</h2>

      {/* Upload modal */}
      <UploadModal onFileSelected={handleFileUpload} />

      {loading && <p className="text-blue-500 mt-3">🔄 Analyzing image...</p>}
      {error && <p className="text-red-500 mt-3">{error}</p>}
      {success && (
        <p className="text-green-600 mt-3">✅ Case successfully created!</p>
      )}

      {/* Results display */}
      {results && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50 shadow">
          <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>

          {/* Scene classification */}
          {results.scene && Array.isArray(results.scene) && (
            <div className="mb-3">
              <p className="font-medium">Scene Predictions:</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {results.scene.slice(0, 3).map((s, idx) => (
                  <li key={idx}>
                    {s.label} ({(s.score * 100).toFixed(1)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* OCR / text recognition */}
          {results.ocr_text && (
            <div className="mb-3">
              <p className="font-medium">Text Detected (OCR):</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {results.ocr_text}
              </p>
            </div>
          )}

          {/* AI insights */}
          {results.ai_insights && (
            <div className="mb-3">
              <p className="font-medium">AI Insights:</p>
              <p className="text-sm text-gray-700">
                {results.ai_insights || "No insights generated."}
              </p>
            </div>
          )}

          {/* OSINT / search results */}
          {results.search_results && results.search_results.length > 0 && (
            <div>
              <p className="font-medium mb-1">OSINT Findings:</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {results.search_results.map((sr, i) => (
                  <li key={i}>
                    {sr.query && (
                      <span className="font-semibold">{sr.query}: </span>
                    )}
                    {(sr.hits || []).slice(0, 2).map((h, j) => (
                      <a
                        key={j}
                        href={h.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline block"
                      >
                        {h.title}
                      </a>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        By uploading, you confirm you have lawful authority to use this media
        for investigative purposes.
      </p>
    </div>
  );
          }
