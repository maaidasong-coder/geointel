import React, { useState } from "react";

export default function UploadModal({ onFileSelected }) {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setErr("Attach image or short video");
      return;
    }
    setErr(null);

    // ✅ Pass file + notes upward
    onFileSelected({ file, notes });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow max-w-xl mx-auto"
    >
      <h3 className="text-lg font-semibold mb-3">
        Upload evidence (image or short video)
      </h3>

      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files[0])}
        className="block w-full mb-3"
      />

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes / case context"
        className="w-full mt-3 p-2 border rounded"
      />

      {err && <div className="text-red-500 mt-2">{err}</div>}

      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-700 text-white rounded"
        >
          Start Analysis
        </button>
      </div>
    </form>
  );
}
