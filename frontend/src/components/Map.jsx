// frontend/src/components/Map.jsx
import { useEffect, useState } from "react";

export default function Map() {
  const [markerList, setMarkerList] = useState([]);

  useEffect(() => {
    // Load Leaflet CSS
    const leafletCSS = document.createElement("link");
    leafletCSS.rel = "stylesheet";
    leafletCSS.href =
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(leafletCSS);

    // Load Leaflet JS
    const leafletScript = document.createElement("script");
    leafletScript.src =
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    leafletScript.onload = () => {
      const L = window.L;

      // Initialize map
      const map = L.map("map", {
        zoomControl: true,
      }).setView([9.082, 8.6753], 6); // Nigeria center

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Helper function to add markers
      const addMarker = (name, coords, isCustom = false) => {
        const marker = L.marker(coords).addTo(map);
        marker.bindPopup(`<b>${name}</b>`);
        marker.on("contextmenu", () => {
          map.removeLayer(marker);
          setMarkerList((prev) =>
            prev.filter((m) => m.id !== marker._leaflet_id)
          );
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

      // Default locations
      const locations = [
        { name: "Yola", coords: [9.2035, 12.4954] },
        { name: "Abuja", coords: [9.0579, 7.4951] },
        { name: "Lagos", coords: [6.5244, 3.3792] },
        { name: "Kano", coords: [12.0022, 8.5919] },
      ];
      locations.forEach((loc) => addMarker(loc.name, loc.coords));

      // Allow user to add markers by clicking
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        addMarker(
          `Custom (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
          [lat, lng],
          true
        );
      });
    };
    document.body.appendChild(leafletScript);
  }, []);

  // Zoom to marker when clicked in list
  const zoomToMarker = (marker) => {
    if (marker?.marker) {
      marker.marker.openPopup();
      marker.marker._map.setView(marker.coords, 10);
    }
  };

  // Remove marker from list & map
  const removeMarker = (marker) => {
    if (marker?.marker) {
      marker.marker._map.removeLayer(marker.marker);
      setMarkerList((prev) => prev.filter((m) => m.id !== marker.id));
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Map container */}
      <div
        id="map"
        className="flex-1 h-[500px] rounded-2xl shadow-lg border border-gray-300"
      ></div>

      {/* Side panel */}
      <div className="w-full md:w-72 h-[500px] overflow-y-auto bg-white rounded-2xl shadow-lg border border-gray-300 p-4">
        <h2 className="text-lg font-semibold mb-2">📍 Markers</h2>
        {markerList.length === 0 ? (
          <p className="text-gray-500">No markers added yet.</p>
        ) : (
          <ul className="space-y-2">
            {markerList.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <span
                  className="cursor-pointer text-blue-600"
                  onClick={() => zoomToMarker(m)}
                >
                  {m.name}
                </span>
                <button
                  className="text-red-500 hover:text-red-700"
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
