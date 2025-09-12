import React from "react";

export default function Navbar({ onNavigate }) {
  return (
    <nav className="bg-white shadow py-3">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-blue-700">GeoIntel</div>
          <div className="text-sm text-gray-500">Security Intelligence Platform</div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={()=>onNavigate("landing")} className="text-gray-700 hover:text-blue-700">Home</button>
          <button onClick={()=>onNavigate("dashboard")} className="text-gray-700 hover:text-blue-700">Dashboard</button>
          <button onClick={()=>onNavigate("upload")} className="px-3 py-1 bg-blue-700 text-white rounded" >Upload Evidence</button>
        </div>
      </div>
    </nav>
  );
}
