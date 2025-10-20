// frontend/src/utils/api.js
import CONFIG from "../config";

const BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.REACT_APP_API_BASE ||
  CONFIG.BACKEND_URL ||
  "https://geointel-backend.onrender.com";

/* -----------------------------------------------------------
   Helper function: Safe fetch with timeout + better error logs
-------------------------------------------------------------*/
async function safeFetch(url, options = {}, timeout = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`${res.status} ${txt}`);
    }
    return await res.json();
  } catch (err) {
    console.error("❌ API Error:", url, err.message);
    throw new Error(`Request failed: ${err.message}`);
  }
}

/* -----------------------------------------------------------
   Upload new evidence (image or video)
   POST /analyze
-------------------------------------------------------------*/
export async function analyzeImage({ file, notes }) {
  const formData = new FormData();
  formData.append("file", file);
  if (notes) formData.append("notes", notes);

  const result = await safeFetch(`${BASE}/analyze`, {
    method: "POST",
    body: formData,
  });

  // Normalize backend response for UI consistency
  return {
    case_id: result.case_id || result.id || null,
    notes: result.notes || "",
    embedding: result.embedding || null,
    scene: result.scene || result.scene_inferences || [],
    ocr_text: result.ocr_text || "",
    queries: result.queries || [],
    search_provider: result.search_provider || {},
    search_results: result.search_results || [],
    geolocation: result.geolocation || {},
    ai_insights: result.ai_insights || "",
    timestamp: result.timestamp || new Date().toISOString(),
  };
}

/* -----------------------------------------------------------
   Create Case (alias for analyzeImage)
-------------------------------------------------------------*/
export async function createCase(formData) {
  const res = await safeFetch(`${BASE}/analyze`, {
    method: "POST",
    body: formData,
  });
  return res;
}

/* -----------------------------------------------------------
   Get Case Details by ID
-------------------------------------------------------------*/
export async function getCase(caseId) {
  const raw = await safeFetch(`${BASE}/cases/${caseId}`);

  return {
    case_id: raw.case_id || raw.caseId || raw.id || null,
    created_at: raw.created_at || raw.createdAt || raw.created || null,
    notes: raw.notes || raw.note || "",
    scene:
      raw.scene_inferences ||
      raw.scene ||
      (raw.ai_insights
        ? (() => {
            const m = raw.ai_insights.match(/Scene:\s*([^\(,]+)/i);
            return m ? [{ label: m[1].trim(), score: 0 }] : [];
          })()
        : []),
    ocr_text: raw.ocr_text || raw.ocrText || raw.ocr || "",
    queries: Array.isArray(raw.queries)
      ? raw.queries
      : raw.queries
      ? [raw.queries]
      : [],
    search_provider:
      raw.search_provider || raw.searchProvider || { provider: "none" },
    search_results: raw.search_results || raw.searchResults || [],
    face_data: raw.face_data || [],
    face_attributes: raw.face_attributes || {},
    embedding: raw.embedding || null,
    geolocation: raw.geolocation || {},
    ai_insights: raw.ai_insights || "",
    _raw: raw,
  };
}

/* -----------------------------------------------------------
   Optional: Ping the backend for health-check
-------------------------------------------------------------*/
export async function pingBackend() {
  try {
    const res = await fetch(`${BASE}/`);
    return res.ok;
  } catch {
    return false;
  }
}

/* -----------------------------------------------------------
   Optional: List all cases (if backend supports it)
-------------------------------------------------------------*/
export async function listCases() {
  try {
    return await safeFetch(`${BASE}/cases`);
  } catch (e) {
    console.warn("No /cases endpoint or server error:", e.message);
    return [];
  }
}

export default {
  analyzeImage,
  createCase,
  getCase,
  listCases,
  pingBackend,
};
