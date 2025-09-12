export async function mockProcess(caseId, fileBuffer) {
  // simulate work (no blocking)
  await new Promise((r) => setTimeout(r, 1200));

  // Mock outputs
  return {
    scene_inferences: [
      {
        label: "rural road",
        confidence: 0.62,
        explanation: "red soil, sparse trees"
      }
    ],
    locations: [
      { name: "Adamawa (inferred)", lat: 9.25, lng: 12.5, info: "inferred by scene model" }
    ],
    media: [
      { media_id: "m1", type: "image", exif: { has_gps: false } }
    ],
    faces: [
      {
        face_id: "f1",
        thumbnail_url: "https://via.placeholder.com/240x240.png?text=face+1",
        embedding_vector_id: "vec-1",
        candidates: [
          {
            source: "public-social-mock",
            source_url: "https://example.com/profile/123",
            similarity: 0.87,
            metadata: { name: "Possible Match A", username: "userA123" }
          },
          {
            source: "public-archive",
            source_url: "https://images.example/456",
            similarity: 0.53,
            metadata: { username: "maybeSomeone" }
          }
        ]
      }
    ],
    report: {
      download_url: null
    }
  };
}
