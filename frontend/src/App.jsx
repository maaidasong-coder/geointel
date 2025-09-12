// frontend/src/App.jsx
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.js";

function App() {
  useEffect(() => {
    // Initialize map
    const map = L.map("map").setView([9.05785, 12.4565], 7); // Adamawa, Nigeria

    // Base layers
    const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    });

    const satellite = L.tileLayer(
      "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap, Humanitarian OSM",
      }
    );

    street.addTo(map);

    // Layer control
    L.control.layers({ Street: street, Satellite: satellite }).addTo(map);

    // Geocoder (search box)
    L.Control.geocoder().addTo(map);

    // Click to add marker
    map.on("click", (e) => {
      L.marker(e.latlng).addTo(map).bindPopup(`📍 ${e.latlng.lat}, ${e.latlng.lng}`).openPopup();
    });

    return () => map.remove();
  }, []);

  return (
    <div className="w-screen h-screen">
      <header className="bg-blue-600 text-white p-3 text-center font-bold shadow-md">
        🌍 GeoIntel – Geospatial Intelligence
      </header>
      <div id="map" className="w-full h-[92%]"></div>
    </div>
  );
}

export default App;
