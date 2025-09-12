import React from 'react'
import Map from './components/Map'

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-600 text-white p-4 text-xl font-bold shadow-md">
        🌍 GeoIntel
      </header>

      <main className="flex-1">
        <Map />
      </main>

      <footer className="bg-gray-800 text-gray-200 text-center p-4">
        © {new Date().getFullYear()} GeoIntel. All rights reserved.
      </footer>
    </div>
  )
}
