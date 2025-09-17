import React, { useEffect, useState } from "react";

export default function Dashboard({ onOpenCase, newCase }) {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    fetch("https://geointel-backend.onrender.com/v1/cases")
      .then((res) => res.json())
      .then((data) => {
        setCases(data || []); // fallback to empty array
      })
      .catch((err) => {
        console.error("Error fetching cases:", err);
      });
  }, []);

  // Add new cases dynamically
  useEffect(() => {
    if (newCase) {
      setCases((prev) => [newCase, ...prev]);
    }
  }, [newCase]);

  // 🔴🟡🟢 Threat badge renderer
  const renderThreatBadge = (level) => {
    let color = "bg-gray-300 text-gray-800";
    if (level === "High") color = "bg-red-600 text-white";
    if (level === "Medium") color = "bg-yellow-400 text-black";
    if (level === "Low") color = "bg-green-600 text-white";

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
        {level}
      </span>
    );
  };

  // 🌍 Geolocation renderer with map link
  const renderLocation = (geo) => {
    if (!geo) return null;
    if (typeof geo === "string") {
      return <span>🌍 {geo}</span>;
    }
    if (geo.lat && geo.lng) {
      return (
        <a
          href={`https://www.google.com/maps?q=${geo.lat},${geo.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          🌍 {geo.lat}, {geo.lng}
        </a>
      );
    }
    return null;
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold mb-6">📊 Dashboard</h2>
      <div className="grid gap-6">
        {cases.map((c) => (
          <div
            key={c.case_id}
            className="bg-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:justify-between md:items-center border-l-4 border-blue-600"
          >
            {/* Left side - case info */}
            <div className="flex-1">
              <div className="font-bold text-lg text-gray-800">{c.case_id}</div>
              <div className="text-sm text-gray-600 mb-3">
                {c.ai_insights || "No AI insights available"}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div>📅 {c.created_at || "Unknown date"}</div>
                {c.geolocation && <div>{renderLocation(c.geolocation)}</div>}
                {c.face_recognition && (
                  <div>👤 Faces: {c.face_recognition.count}</div>
                )}
                {c.objects_detected && (
                  <div>
                    🖼 Objects:{" "}
                    <span className="italic">
                      {c.objects_detected.join(", ")}
                    </span>
                  </div>
                )}
                {c.threat_level && (
                  <div>⚠️ Threat: {renderThreatBadge(c.threat_level)}</div>
                )}
              </div>
            </div>

            {/* Right side - button */}
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => onOpenCase(c.case_id)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow"
              >
                Open
              </button>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {cases.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            🚫 No cases available
          </div>
        )}
      </div>
    </div>
  );
}
