// frontend/src/utils/confidence.js

/**
 * Calibrate AI confidence levels with contextual weighting.
 * @param {number} similarity - raw similarity or confidence score (0–1)
 * @param {object} evidence - optional supporting evidence flags and scores
 * @returns {object} - formatted confidence object { score, label, color }
 */
export function calibrateConfidence(similarity = 0, evidence = {}) {
  let score = typeof similarity === "number" ? similarity : 0;

  // Weighted boosts based on supporting AI evidence
  if (evidence.scene) score += 0.07;
  if (evidence.ocr) score += 0.05;
  if (evidence.faceMatch) score += 0.1;
  if (evidence.embedding) score += 0.08;
  if (evidence.geoMatch) score += 0.05;

  // Clamp to [0,1]
  score = Math.min(1, Math.max(0, score));

  // Convert to percentage
  const percent = Math.round(score * 100);

  // Assign a qualitative label
  let label = "Low";
  if (percent >= 80) label = "High";
  else if (percent >= 60) label = "Moderate";
  else if (percent >= 40) label = "Fair";

  // Color code for UI visualization
  const color =
    percent >= 80
      ? "#22c55e" // green
      : percent >= 60
      ? "#facc15" // yellow
      : percent >= 40
      ? "#f97316" // orange
      : "#ef4444"; // red

  return { score: percent, label, color };
}

/**
 * Combine multiple confidence values into one calibrated score.
 * Useful when merging scene + OCR + face + embedding results.
 */
export function mergeConfidences(confidences = []) {
  if (!Array.isArray(confidences) || confidences.length === 0)
    return { score: 0, label: "No Data", color: "#9ca3af" };

  const avg =
    confidences
      .filter((c) => typeof c === "number" && !isNaN(c))
      .reduce((a, b) => a + b, 0) / confidences.length;

  return calibrateConfidence(avg / 100);
}
