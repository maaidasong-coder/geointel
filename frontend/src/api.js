import CONFIG from "./config";

// ✅ Analyze image + optional notes
export async function analyzeImage({ file, notes }) {
  const formData = new FormData();
  formData.append("file", file);
  if (notes) {
    formData.append("notes", notes);
  }

  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to analyze image: ${errorText}`);
    }

    const result = await response.json();

    // ✅ Normalize response so frontend always gets structured data
    return {
      notes: result.notes || null,
      embedding: result.embedding || null,
      scene: result.scene || null,
      ocr_text: result.ocr_text || null,
      queries: result.queries || [],
      search_provider: result.search_provider || {},
      search_results: result.search_results || [],
    };
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
      }
