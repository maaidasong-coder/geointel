import React, { useState } from "react";
import UploadModal from "../components/UploadModal";

export default function Upload({ onCreated, analyzeImage }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null); // ✅ Store analysis results

  async function handleFileUpload({ file, notes }) {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // ✅ Call backend with both file + notes
      const result = await analyzeImage({ file, notes });
      console.log("Analysis result:", result);

      // Store in local state for display
      setResults(result);

      // Generate temporary unique ID for case
      const caseId = Date.now();
      onCreated({ id: caseId, notes, ...result });
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Upload Evidence</h2>

      {/* ✅ Hook into modal */}
      <UploadModal onFileSelected={handleFileUpload} />

      {loading && <p className="text-blue-500 mt-2">Analyzing image...</p>}
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* ✅ Show results */}
      {results && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
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

          {/* AI insights */}
          <div className="mb-3">
            <p className="font-medium">AI Insights:</p>
            <p className="text-sm text-gray-700">
              {results.ai_insights || "No insights generated."}
            </p>
          </div>

          {/* OSINT results */}
          <div>
            <p className="font-medium">OSINT Findings:</p>
            <p className="text-sm text-gray-700">
              {results.osint || "No public data found yet."}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        By uploading, you confirm you have lawful authority to use this media
        for investigative purposes.
      </p>
    </div>
  );
}
