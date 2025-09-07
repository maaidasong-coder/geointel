// frontend/src/components/Map.jsx
import { useEffect, useState } from "react";

export default function Map() {
  const [markerList, setMarkerList] = useState([]);

  useEffect(() => {
    // Ensure Leaflet CSS is loaded once
    if (!document.querySelector("link[href*='leaflet.css']")) {
      const leafletCSS = document.createElement("link");
      leafletCSS.rel = "stylesheet";
      leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(leafletCSS);
    }

    // Ensure Leaflet JS is loaded once
    const initMap = () => {
      const L = window.L;
      if (!L) return;

      // Initialize map
      const map = L.map("map", { zoomControl: true }).setView(
        [9.082, 8.6753],
        6 // Nigeria center
      );

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Helper to add markers
      const addMarker = (name, coords, isCustom = false) => {
        const marker = L.marker(coords).addTo(map);
        marker.bindPopup(`<b>${name}</b><br/>Lat: ${coords[0].toFixed(
          2
        )}, Lng: ${coords[1].toFixed(2)}`);

        // Right-click (contextmenu) removes marker
        marker.on("contextmenu", () => {
          map.removeLayer(marker);
          setMarkerList((prev) => prev.filter((m) => m.id !== marker._leaflet_id));
        });

        setMarkerList((prev) => [
          ...prev,
          {
            id: marker._leaflet_id,
            name,
            coords,
            marker,
            isCustom,
          },
        ]);
      };

      // Default markers
      [
        { name: "Yola", coords: [9.2035, 12.4954] },
        { name: "Abuja", coords: [9.0579, 7.4951] },
        { name: "Lagos", coords: [6.5244, 3.3792] },
        { name: "Kano", coords: [12.0022, 8.5919] },
      ].forEach((loc) => addMarker(loc.name, loc.coords));

      // Allow user to add markers by clicking
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        addMarker(`Custom (${lat.toFixed(2)}, ${lng.toFixed(2)})`, [lat, lng], true);
      });

      // Cleanup on unmount
      return () => {
        map.remove();
      };
    };

    if (!window.L) {
      const leafletScript = document.createElement("script");
      leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      leafletScript.onload = initMap;
      document.body.appendChild(leafletScript);
    } else {
      initMap();
    }
  }, []);

  // Zoom to marker from side panel
  const zoomToMarker = (marker) => {
    if (marker?.marker) {
      marker.marker.openPopup();
      marker.marker._map.setView(marker.coords, 10);
    }
  };

  // Remove marker from side panel
  const removeMarker = (marker) => {
    if (marker?.marker) {
      marker.marker._map.removeLayer(marker.marker);
      setMarkerList((prev) => prev.filter((m) => m.id !== marker.id));
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Map */}
      <div
        id="map"
        className="flex-1 h-[500px] rounded-2xl shadow-lg border border-gray-300"
      ></div>

      {/* Marker panel */}
      <div className="w-full md:w-72 h-[500px] overflow-y-auto bg-white rounded-2xl shadow-lg border border-gray-300 p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">📍 Markers</h2>
        {markerList.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No markers added yet. Click on the map to add one.
          </p>
        ) : (
          <ul className="space-y-2">
            {markerList.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                <span
                  className="cursor-pointer text-blue-600 font-medium"
                  onClick={() => zoomToMarker(m)}
                >
                  {m.name}
                </span>
                <button
                  className="text-red-500 hover:text-red-700 font-bold"
                  onClick={() => removeMarker(m)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
        }
