import { useNavigate } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

// 📍 UPDATE THIS: paste the Google Maps embed URL for your venue
// How to get it: Google Maps → search venue → Share → Embed a map → copy the src URL
const GOOGLE_MAPS_EMBED_URL =
  "https://share.google/uuMcQ2Tb31kvomawa";

// 📍 UPDATE THIS: direct Google Maps link for "Open in Maps" button
const GOOGLE_MAPS_LINK = "https://share.google/uuMcQ2Tb31kvomawa";

export default function Location() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                ← Back to Home
              </button>
              <h2 className="text-2xl font-bold text-indigo-600">Rajaram Gurukul</h2>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📍 Utsav Venue</h1>
          <p className="text-gray-600">January Utsav 2026 — 19th to 22nd January</p>
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <iframe
            src={GOOGLE_MAPS_EMBED_URL}
            width="100%"
            height="500"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Utsav Venue Location"
          />
        </div>

        {/* Open in Google Maps button */}
        <div className="text-center mt-6">
          <a
            href={GOOGLE_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            🗺️ Open in Google Maps
          </a>
        </div>
      </main>
    </div>
  );
}
