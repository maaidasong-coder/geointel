import React from "react";
import UploadModal from "../components/UploadModal";

export default function Upload({ onCreated }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Upload Evidence</h2>
      <UploadModal onCreated={(caseId) => onCreated(caseId)} />
      <p className="text-xs text-gray-500 mt-4">
        By uploading, you confirm you have lawful authority to use this media for investigative purposes.
      </p>
    </div>
  );
}
