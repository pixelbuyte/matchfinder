"use client";
import { useState, useRef } from "react";
import { createMatch } from "../actions";
import VenueFinder from "@/components/VenueFinder";
import { SPORTS, SKILLS } from "@/lib/constants";

const VENUES: Record<string, string[]> = {
  soccer:     ["5-a-side arena", "Local football pitch", "Astroturf cage", "Community sports park", "School field"],
  basketball: ["Community basketball court", "Outdoor court", "Indoor sports hall", "School gym", "Recreation center"],
  padel:      ["Padel club", "Indoor padel center", "Sports complex padel", "Tennis & padel club"],
  tennis:     ["Public tennis courts", "Tennis club", "Leisure center courts", "Park courts"],
  running:    ["Local park", "Riverside path", "City trail", "Athletics track", "Park run route"],
  other:      ["Community sports center", "Local park", "Recreation ground", "Sports hall"],
};

export default function CreateMatchPage() {
  const [error, setError] = useState("");
  const [sport, setSport] = useState("soccer");
  const locationRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await createMatch(fd);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a Match</h1>
      {error && <p className="bg-red-50 text-red-600 border border-red-200 rounded p-3 mb-4 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input name="title" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Sunday 5-a-side" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sport *</label>
          <select
            name="sport"
            required
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SPORTS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional details..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input name="city" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Players *</label>
            <input name="maxPlayers" type="number" min={2} required defaultValue={10} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location / Venue *</label>
          <input
            ref={locationRef}
            name="location"
            required
            list="venue-suggestions"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Central Park, Field 3"
          />
          <datalist id="venue-suggestions">
            {(VENUES[sport] ?? VENUES.other).map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <VenueFinder
            sport={sport}
            onSelect={(v) => {
              if (locationRef.current) locationRef.current.value = v;
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input name="scheduledAt" type="datetime-local" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level *</label>
            <select name="skillLevel" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SKILLS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
          Create Match
        </button>
      </form>
    </div>
  );
}
