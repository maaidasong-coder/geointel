import React, { useState } from "react";
import CONFIG from "../config";

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file!");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} className="mb-4" />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Analyzing..." : "Upload & Analyze"}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Results:</h3>
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
    }
