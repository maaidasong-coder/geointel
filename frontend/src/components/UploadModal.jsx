import React, { useState } from "react";
import { createCase } from "../utils/api";

export default function UploadModal({ onCreated }) {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!file) { setErr("Attach image or short video"); return; }
    setLoading(true);
    setErr(null);
    const fd = new FormData();
    fd.append("media", file);
    fd.append("notes", notes);
    try {
      const res = await createCase(fd);
      onCreated(res.case_id || res.caseId || res); // support both shapes
    } catch (e) {
      setErr("Upload failed");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="bg-white p-6 rounded shadow max-w-xl mx-auto">
      <h3 className="text-lg font-semibold mb-3">Upload evidence (image or short video)</h3>
      <input type="file" accept="image/*,video/*" onChange={(e)=>setFile(e.target.files[0])} />
      <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Notes / case context" className="w-full mt-3 p-2 border rounded" />
      {err && <div className="text-red-500 mt-2">{err}</div>}
      <div className="flex gap-2 mt-4">
        <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded" disabled={loading}>
          {loading ? "Uploading..." : "Start Analysis"}
        </button>
      </div>
    </form>
  )
}
