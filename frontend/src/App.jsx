import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import CaseDetails from "./pages/CaseDetails";
import { analyzeImage } from "./api"; // ✅ Import backend function

export default function App() {
  const [route, setRoute] = useState({ name: "landing", payload: null });

  function go(name, payload = null) {
    setRoute({ name, payload });
    window.scrollTo(0, 0);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onNavigate={go} />
      <div className="max-w-7xl mx-auto p-6">
        {route.name === "landing" && <Landing onStart={() => go("upload")} />}

        {/* ✅ Pass backend function into Upload */}
        {route.name === "upload" && (
          <Upload onCreated={(c) => go("case", c)} analyzeImage={analyzeImage} />
        )}

        {route.name === "dashboard" && (
          <Dashboard onOpenCase={(id) => go("case", id)} />
        )}

        {route.name === "case" && (
          <CaseDetails caseId={route.payload} onBack={() => go("dashboard")} />
        )}
      </div>

      {/* ✅ Fixed quotes here */}
      <footer className="text-center text-sm text-gray-500 p-6">
        © {new Date().getFullYear()} GeoIntel — For authorized security use only.
      </footer>
    </div>
  );
}
