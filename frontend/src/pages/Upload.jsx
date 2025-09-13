import React, { useState } from "react";
import UploadModal from "../components/UploadModal";

export default function Upload({ onCreated, analyzeImage }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileUpload({ file, notes }) {
    setLoading(true);
    setError(null);

    try {
      // ✅ Call backend with both file + notes
      const result = await analyzeImage({ file, notes });
      console.log("Analysis result:", result);

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

      <p className="text-xs text-gray-500 mt-4">
        By uploading, you confirm you have lawful authority to use this media
        for investigative purposes.
      </p>
    </div>
  );
}
