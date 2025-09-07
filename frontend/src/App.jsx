// frontend/src/App.jsx
import Map from "./components/Map";
import Charts from "./components/Charts";

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-blue-200 p-6 space-y-8">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-700 mb-2">
          🌍 GeoIntel Dashboard
        </h1>
        <p className="text-lg text-gray-700">
          Your React + Tailwind app is running with interactive features!
        </p>
      </header>

      {/* Interactive Map Section */}
      <section className="w-full max-w-5xl bg-white rounded-2xl shadow-md p-4">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">
          🗺 Interactive Map
        </h2>
        <div className="h-[400px] rounded-lg overflow-hidden">
          <Map />
        </div>
      </section>

      {/* Analytics Chart Section */}
      <section className="w-full max-w-5xl bg-white rounded-2xl shadow-md p-4">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">
          📊 Analytics Chart
        </h2>
        <div className="h-[300px]">
          <Charts />
        </div>
      </section>
    </div>
  );
}
