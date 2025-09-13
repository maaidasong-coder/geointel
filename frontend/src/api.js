import CONFIG from "./config";

export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${CONFIG.BACKEND_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze image");
  }

  return await response.json();
}
