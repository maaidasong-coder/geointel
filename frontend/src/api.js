import CONFIG from "./config";

// ✅ Analyze image + optional notes
export async function analyzeImage({ file, notes }) {
  const formData = new FormData();
  formData.append("file", file);
  if (notes) {
    formData.append("notes", notes);
  }

  const response = await fetch(`${CONFIG.BACKEND_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze image");
  }

  return await response.json();
}
