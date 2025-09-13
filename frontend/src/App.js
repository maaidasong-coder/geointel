import React from "react";
import UploadForm from "./components/UploadForm";

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">🌍 GeoIntel</h1>
      <p className="mb-6 text-gray-600">
        Upload an image to analyze with Hugging Face AI
      </p>
      <UploadForm />
    </div>
  );
}

export default App;
