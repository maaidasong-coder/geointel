// frontend/src/utils/api.js
const BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.REACT_APP_API_BASE ||
  "https://geointel-backend.onrender.com";

// Upload a new case (expects FormData containing file + notes)
export async function createCase(formData) {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`createCase failed: ${res.status} ${txt}`);
  }
  return res.json();
}

// Fetch a case and normalize the response into the shape CaseDetails.jsx expects
export async function getCase(caseId) {
  const res = await fetch(`${BASE}/cases/${caseId}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`getCase failed: ${res.status} ${txt}`);
  }
  const raw = await res.json();

  // raw may already be the normalized object from backend or a DB-row-like object.
  // Normalize consistently for the frontend component.
  const normalized = {
    case_id: raw.case_id || raw.caseId || raw.id || null,
    created_at: raw.created_at || raw.createdAt || raw.created || null,
    notes: raw.notes || raw.note || "",
    // If backend uses scene_inferences / scene
    scene:
      raw.scene_inferences ||
      raw.scene ||
      // try to parse ai_insights like "Scene: label (0.84)"
      (raw.ai_insights
        ? (() => {
            const m = raw.ai_insights.match(/Scene:\s*([^\(,]+)/i);
            if (m) return [{ label: m[1].trim(), score: 0 }];
            return [];
          })()
        : []),
    ocr_text: raw.ocr_text || raw.ocrText || raw.ocr || "",
    queries: Array.isArray(raw.queries) ? raw.queries : raw.queries ? [raw.queries] : [],
    search_provider: raw.search_provider || raw.searchProvider || raw.provider || { provider: "none" },
    search_results: raw.search_results || raw.searchResults || raw.osint || [],
    face_data: raw.face_data || raw.faceData || [],
    face_attributes: raw.face_attributes || raw.faceAttributes || {},
    embedding: raw.embedding || raw.embedding_vector || null,
    geolocation: raw.geolocation || raw.geo || raw.geo_location || {},
    ai_insights: raw.ai_insights || raw.aiInsights || "",
    // keep raw for debugging
    _raw: raw,
  };

  return normalized;
}
