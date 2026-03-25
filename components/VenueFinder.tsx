"use client";
import { useState } from "react";

const SPORT_TAGS: Record<string, string> = {
  soccer:     '["sport"~"soccer|football"]["leisure"="pitch"]',
  basketball: '["sport"="basketball"]',
  padel:      '["sport"="padel"]',
  tennis:     '["sport"="tennis"]',
  running:    '["leisure"~"track|path"]["highway"!~"."]',
  other:      '["leisure"~"sports_centre|pitch|fitness_centre"]',
};

interface Venue { name: string; address: string }

export default function VenueFinder({ sport, onSelect }: { sport: string; onSelect: (v: string) => void }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function find() {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setLoading(true);
    setError("");
    setVenues([]);
    setSearched(false);

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const tag = SPORT_TAGS[sport] ?? SPORT_TAGS.other;
          const query = `[out:json][timeout:15];(node${tag}(around:5000,${lat},${lon});way${tag}(around:${5000},${lat},${lon}););out body 15;`;
          const res = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
          });
          const data = await res.json();
          const seen = new Set<string>();
          const results: Venue[] = [];
          for (const el of data.elements ?? []) {
            const name = el.tags?.name;
            if (!name || seen.has(name)) continue;
            seen.add(name);
            const addr = [el.tags?.["addr:street"], el.tags?.["addr:city"]].filter(Boolean).join(", ");
            results.push({ name, address: addr });
          }
          setVenues(results);
          setSearched(true);
          if (results.length === 0) setError("No venues found nearby — type your own location");
        } catch {
          setError("Venue search failed — type your own location");
        } finally {
          setLoading(false);
        }
      },
      () => { setError("Location denied"); setLoading(false); }
    );
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={find}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline disabled:opacity-50"
      >
        {loading ? "Searching..." : "🗺️ Find real venues near me"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {searched && venues.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {venues.map((v) => (
            <button
              key={v.name}
              type="button"
              onClick={() => { onSelect(v.name); setVenues([]); setSearched(false); }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
            >
              <span className="font-medium text-gray-800">{v.name}</span>
              {v.address && <span className="text-gray-400 text-xs ml-2">{v.address}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
