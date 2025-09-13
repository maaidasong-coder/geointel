import React, { useEffect, useState } from "react";
import { getCase } from "../utils/api";
import Map from "../components/Map";
import Charts from "../components/Charts";
import { calibrateConfidence } from "../utils/confidence";

export default function CaseDetails({ caseId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    getCase(caseId)
      .then((r) => {
        setData(r);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [caseId]);

  if (loading) return <div>Loading case...</div>;
  if (!data) return <div>No data for this case.</div>;

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
          <div className="text-sm text-gray-500">{data.created_at}</div>
        </div>
        <button
          onClick={onBack}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Back
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Map markers={markers} />

          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {/* Scene Inference */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">Scene Inference</h3>
              <div className="text-sm text-gray-600 mt-2">
                {data.scene_inferences?.[0]?.label || "No inference"} — Confidence:{" "}
                {Math.round((data.scene_inferences?.[0]?.confidence || 0) * 100)}%
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">EXIF / Metadata</h3>
              <pre className="text-xs text-gray-600">
                {JSON.stringify(data.media?.[0]?.exif || {}, null, 2)}
              </pre>
            </div>

            {/* Reports */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">Reports</h3>
              {data.report?.download_url ? (
                <a
                  href={data.report.download_url}
                  className="text-blue-700"
                >
                  Download PDF
                </a>
              ) : (
                <div className="text-sm text-gray-600">No report yet</div>
              )}
            </div>
          </div>

          {/* ✅ NEW: AI Insights + OSINT */}
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">AI Insights</h3>
              <p className="text-sm text-gray-700 mt-2">
                {data.ai_insights || "No AI insights generated."}
              </p>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">OSINT Findings</h3>
              <p className="text-sm text-gray-700 mt-2">
                {data.osint || "No public data found."}
              </p>
            </div>
          </div>
        </div>

        <div>
          {/* Faces */}
          <div className="bg-white p-4 rounded shadow mb-4">
            <h3 className="font-semibold">Detected Faces</h3>
            {data.faces && data.faces.length ? (
              data.faces.map((f) => (
                <div
                  key={f.face_id}
                  className="mt-3 border p-2 rounded"
                >
                  <img
                    src={f.thumbnail_url}
                    alt=""
                    className="w-full object-cover rounded"
                  />
                  <div className="mt-2 text-sm">Candidates:</div>
                  <ul className="text-sm">
                    {f.candidates.map((c, i) => (
                      <li key={i} className="mt-2">
                        <div className="font-medium">
                          {c.metadata?.name || "Candidate"}
                        </div>
                        <div className="text-xs text-gray-600">
                          Source:{" "}
                          <a
                            href={c.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600"
                          >
                            link
                          </a>
                        </div>
                        <div className="text-xs text-gray-700">
                          Similarity: {Math.round(c.similarity * 100)}% — Calibrated:{" "}
                          {calibrateConfidence(c.similarity, {
                            scene: !!data.scene_inferences?.length,
                            ocr: !!data.media?.[0]?.exif?.has_gps,
                          })}
                          %
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600 mt-2">
                No detected faces.
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Analytics</h3>
            <Charts />
          </div>
        </div>
      </div>
    </div>
  );
                }
