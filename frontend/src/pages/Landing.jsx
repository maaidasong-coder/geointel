Here is what we have in our landing.jsx:

import React from "react";

export default function Landing({ onStart }) {
return (
<div className="text-center py-20">
<h1 className="text-4xl font-bold text-blue-700 mb-4">GeoIntel — Security OSINT & Geolocation</h1>
<p className="text-gray-700 max-w-2xl mx-auto mb-8">
Upload images or short videos of suspicious persons or incidents. GeoIntel will extract faces and scene details, search public sources, and return ranked candidate matches with clear confidence scores for investigator review.
</p>
<div className="flex justify-center gap-4">
<button onClick={onStart} className="px-6 py-3 bg-blue-700 text-white rounded">Upload Evidence</button>
</div>

<section className="mt-14 max-w-4xl mx-auto grid md:grid-cols-3 gap-6">  
    <div className="bg-white p-6 rounded shadow">  
      <h3 className="font-bold">Face Extraction</h3>  
      <p className="text-sm text-gray-600 mt-2">Automated face detection and embeddings to find matches in public sources.</p>  
    </div>  
    <div className="bg-white p-6 rounded shadow">  
      <h3 className="font-bold">Scene & Location Inference</h3>  
      <p className="text-sm text-gray-600 mt-2">Scene classifiers and OCR help infer environment clues and visible text.</p>  
    </div>  
    <div className="bg-white p-6 rounded shadow">  
      <h3 className="font-bold">Case Management</h3>  
      <p className="text-sm text-gray-600 mt-2">Each upload generates a case with audit trail, report export and human-in-the-loop verification.</p>  
    </div>  
  </section>  
</div>

);
}

