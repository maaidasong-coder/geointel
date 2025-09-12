import React, { useEffect } from "react";

export default function Map({ center = [9.082, 8.6753], markers = [] }) {
  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadScript = () =>
      new Promise((res) => {
        if (window.L) return res(window.L);
        const s = document.createElement("script");
        s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        s.onload = () => res(window.L);
        document.body.appendChild(s);
      });

    let map;
    loadScript().then((L) => {
      if (!document.getElementById("map")) return;
      // create or reuse
      if (!window.__geointel_map) {
        map = L.map("map").setView(center, 6);
        window.__geointel_map = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
      } else {
        map = window.__geointel_map;
        map.setView(center, 6);
      }
      // clear existing markers (we keep refs on window)
      if (window.__geointel_markers) {
        window.__geointel_markers.forEach((m) => map.removeLayer(m));
      }
      window.__geointel_markers = [];
      markers.forEach((m) => {
        const marker = L.marker([m.lat, m.lng]).addTo(map);
        marker.bindPopup(`<b>${m.name}</b><br/>${m.info || ""}`);
        window.__geointel_markers.push(marker);
      });
    });
    // eslint-disable-next-line
  }, [markers]);

  return <div id="map" className="w-full h-[520px] rounded shadow border" />;
}
