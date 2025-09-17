import React, { useEffect, useState } from "react";
import { getCase } from "../utils/api";
import Map from "../components/Map";
import Charts from "../components/Charts";

export default function CaseDetails({ caseId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    getCase(caseId)
      .then((r) => {
        console.log("Fetched case details:", r); // 🔎 Debugging
        setData(r);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching case:", err);
        setLoading(false);
      });
  }, [caseId]);

  if (loading) return <div>Loading case...</div>;
  if (!data || Object.keys(data).length === 0) {
    return <div>No data for this case.</div>;
  }

  // ✅ Safe fallbacks since backend may not return all fields
  const markers = (data.locations || []).map((l) => ({
    lat: l.lat,
    lng: l.lng,
    name: l.name,
    info: l.info,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Case: {data.case_id}</h2>
          <div className="text-sm text-gray-500">
            {data.created_at ? new Date(data.created_at).toLocaleString() : "Unknown date"}
          </div>
          {data.notes && (
            <div className="text-sm text-gray-600 mt-1">Notes: {data.notes}</div>
          )}
        </div>
        <button onClick={onBack} className="px-3 py-1 bg-gray-200 rounded">
          Back
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {/* Map */}
          <Map markers={markers} />

          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {/* Scene Inference (from ai_insights) */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">Scene Inference</h3>
              {data.ai_insights ? (
                <div className="text-sm text-gray-600 mt-2">{data.ai_insights}</div>
              ) : (
                <div className="text-sm text-gray-600 mt-2">No inference</div>
              )}
            </div>

            {/* OCR Text */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">OCR Text</h3>
              <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {data.ocr_text || "No text detected"}
              </pre>
            </div>

            {/* Search Queries */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">Search Queries</h3>
              {data.queries && data.queries.length > 0 ? (
                <ul className="text-sm text-gray-700 mt-2 list-disc list-inside">
                  {data.queries.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-600">No queries generated</div>
              )}
            </div>
          </div>

          {/* OSINT Results */}
          <div className="mt-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold">
              OSINT Results ({data.search_provider?.provider || "none"})
            </h3>
            {data.search_results && data.search_results.length > 0 ? (
              data.search_results.map((sr, i) => (
                <div key={i} className="mt-3 border-b pb-2">
                  <div className="font-medium">Query: {sr.query}</div>
                  <ul className="ml-4 text-sm list-disc list-inside">
                    {(sr.hits || []).map((h, j) => (
                      <li key={j}>
                        <a
                          href={h.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600"
                        >
                          {h.title}
                        </a>{" "}
                        — {h.snippet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600 mt-2">No search results</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Analytics</h3>
            <Charts />
          </div>
        </div>
      </div>
    </div>
  );
}
