import React, { useEffect, useState } from "react";

export default function Dashboard({ onOpenCase, newCase }) {
  const [cases, setCases] = useState([
    { id: "CASE-20250912-0001", summary: "Motorbike incident — uploaded image", created: "2025-09-12" },
    { id: "CASE-20250912-0002", summary: "Threatening video frame", created: "2025-09-11" }
  ]);

  // ⏺ Whenever a new case comes from Upload.jsx, add it
  useEffect(() => {
    if (newCase) {
      setCases((prev) => [newCase, ...prev]);
    }
  }, [newCase]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <div className="grid gap-4">
        {cases.map((c) => (
          <div
            key={c.id}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{c.id}</div>
              <div className="text-sm text-gray-600">{c.summary}</div>
              <div className="text-xs text-gray-400">📅 {c.created}</div>
            </div>
            <div>
              <button
                onClick={() => onOpenCase(c.id)}
                className="px-3 py-1 bg-blue-700 text-white rounded"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
