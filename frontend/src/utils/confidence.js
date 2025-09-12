// Simple calibrated confidence function
export function calibrateConfidence(similarity, evidence = { scene: false, ocr: false }) {
  // base weight
  let score = similarity; // 0..1

  // boost if supporting evidence exists
  if (evidence.scene) score = Math.min(1, score + 0.08);
  if (evidence.ocr) score = Math.min(1, score + 0.06);

  // convert to percent
  return Math.round(score * 100);
}
