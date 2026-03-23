import Link from "next/link";

const SPORT_COLORS: Record<string, string> = {
  soccer: "bg-green-100 text-green-800",
  basketball: "bg-orange-100 text-orange-800",
  padel: "bg-blue-100 text-blue-800",
  tennis: "bg-yellow-100 text-yellow-800",
  running: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

interface MatchCardProps {
  match: {
    id: number;
    title: string;
    sport: string;
    city: string;
    location: string;
    scheduledAt: string;
    maxPlayers: number;
    skillLevel: string;
    createdBy: { user: { email: string }; profile: { displayName: string } | null };
    participants: { id: number }[];
  };
}

export default function MatchCard({ match }: MatchCardProps) {
  const spotsLeft = match.maxPlayers - match.participants.length;
  const colorClass = SPORT_COLORS[match.sport] ?? "bg-gray-100 text-gray-800";
  const creatorName = match.createdBy.profile?.displayName ?? match.createdBy.user.email;

  return (
    <Link href={`/matches/${match.id}`} className="block bg-white rounded-xl shadow hover:shadow-md transition-shadow p-4 border border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
          {match.sport.charAt(0).toUpperCase() + match.sport.slice(1)}
        </span>
        <span className="text-xs text-gray-500">{match.participants.length}/{match.maxPlayers}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{match.title}</h3>
      <p className="text-xs text-gray-500 mb-2">
        {new Date(match.scheduledAt).toLocaleDateString()} · {new Date(match.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-xs text-gray-600">📍 {match.location}, {match.city}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500">by {creatorName}</span>
        <span className={`text-xs font-medium ${spotsLeft > 0 ? "text-green-600" : "text-red-500"}`}>
          {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left` : "Full"}
        </span>
      </div>
    </Link>
  );
}
