import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder";

export default function App() {
  useEffect(() => {
    // Create the map
    const map = L.map("map").setView([9.3265, 12.3984], 7); // Center: Yola, Adamawa

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add a marker for Yola
    L.marker([9.3265, 12.3984])
      .addTo(map)
      .bindPopup("Yola - Adamawa State")
      .openPopup();

    // Add search box
    L.Control.geocoder().addTo(map);

    // Add scale
    L.control.scale().addTo(map);
  }, []);

  return (
    <div className="w-full h-screen">
      <h1 className="text-center text-2xl font-bold p-2 bg-gray-800 text-white shadow">
        🌍 GeoIntel – Real Map Viewer
      </h1>
      <div id="map" className="w-full h-[90vh]"></div>
    </div>
  );
}
