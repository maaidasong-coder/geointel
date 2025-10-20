// ✅ config.js
// Centralized configuration for GeoIntel Frontend

const CONFIG = {
  // 🌍 Automatically detect environment
  ENV: import.meta.env.MODE || process.env.NODE_ENV || "production",

  // ✅ Backend URL - prioritizes environment variable if available
  BACKEND_URL:
    import.meta.env.VITE_BACKEND_URL || // Vite environment variable
    process.env.VITE_BACKEND_URL || // fallback for other bundlers
    "https://geointel-backend.onrender.com", // default Render backend URL

  // ⚙️ Optional extra configs you might need soon:
  FRONTEND_URL:
    import.meta.env.VITE_FRONTEND_URL ||
    process.env.VITE_FRONTEND_URL ||
    "https://geointel-frontend.onrender.com",

  // ⏱ Timeout for API requests (milliseconds)
  REQUEST_TIMEOUT: 25000, // 25 seconds

  // 🧠 AI / ML endpoints (if you expand later)
  AI_ANALYTICS_URL:
    import.meta.env.VITE_AI_ANALYTICS_URL ||
    "https://geointel-backend.onrender.com/ai",

  // 🗺️ Map services key placeholder (for Map.jsx)
  MAPBOX_TOKEN:
    import.meta.env.VITE_MAPBOX_TOKEN ||
    "YOUR_MAPBOX_ACCESS_TOKEN_HERE",
};

export default CONFIG;
