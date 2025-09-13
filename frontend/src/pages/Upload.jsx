import React, { useState } from "react";
import UploadModal from "../components/UploadModal";

export default function Upload({ onCreated, analyzeImage }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileUpload(file) {
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeImage(file); // ✅ Call backend
      console.log("Analysis result:", result);

      // You can store the entire result as the "case"
      const caseId = Date.now(); // temporary unique ID
      onCreated({ id: caseId, ...result }); // pass up to App
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
        By uploading, you confirm you have lawful authority to use this media for investigative purposes.
      </p>
    </div>
  );
}
