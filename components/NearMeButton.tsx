"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NearMeButton({ currentCity }: { currentCity?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleNearMe() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "";
          if (city) {
            router.push(`/matches?city=${encodeURIComponent(city)}`);
          } else {
            setError("Could not determine city");
          }
        } catch {
          setError("Location lookup failed");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location denied");
        setLoading(false);
      }
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleNearMe}
        disabled={loading}
        className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <span>📍</span>
        )}
        Near Me
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
