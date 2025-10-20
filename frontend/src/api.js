import CONFIG from "./config";

// ✅ Utility: handle API responses consistently
async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "API request failed");
  }
  return response.json();
}

/**
 * ✅ Analyze Image
 * Sends an image + optional notes to the backend for analysis
 */
export async function analyzeImage({ file, notes }) {
  const formData = new FormData();
  formData.append("file", file);
  if (notes) formData.append("notes", notes);

  const response = await fetch(`${CONFIG.BACKEND_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  const result = await handleResponse(response);

  // Normalize the backend response for React
  return {
    notes: result.notes || null,
    embedding: result.embedding || null,
    scene: result.scene || null,
    ocr_text: result.ocr_text || null,
    queries: result.queries || [],
    search_provider: result.search_provider || {},
    search_results: result.search_results || [],
  };
}

/**
 * ✅ Get All Uploaded Files (history, database, etc.)
 */
export async function fetchUploads() {
  const response = await fetch(`${CONFIG.BACKEND_URL}/uploads`, {
    method: "GET",
  });
  return handleResponse(response);
}

/**
 * ✅ Delete an Uploaded File by ID or Name
 */
export async function deleteUpload(fileId) {
  const response = await fetch(`${CONFIG.BACKEND_URL}/uploads/${fileId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

/**
 * ✅ Run Geo-Query or Search
 * Example: searching for related locations, coordinates, or intelligence data
 */
export async function searchGeoData(query) {
  const response = await fetch(`${CONFIG.BACKEND_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return handleResponse(response);
}

/**
 * ✅ Get AI Insights (summary or context analysis)
 */
export async function getAIInsights(text) {
  const response = await fetch(`${CONFIG.BACKEND_URL}/insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return handleResponse(response);
}

/**
 * ✅ Health Check (optional)
 * Verifies if the backend server is alive
 */
export async function pingServer() {
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/ping`);
    return response.ok;
  } catch (err) {
    console.error("Backend unreachable:", err);
    return false;
  }
}
