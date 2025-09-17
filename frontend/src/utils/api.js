// Hardcode your deployed backend for now
const BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.REACT_APP_API_BASE ||
  "https://geointel-backend.onrender.com";

export async function createCase(formData) {
  const res = await fetch(`${BASE}/v1/cases`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function getCase(caseId) {
  const res = await fetch(`${BASE}/v1/cases/${caseId}`);
  return res.json();
}
