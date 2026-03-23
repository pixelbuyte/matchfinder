import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">MatchFinder</Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/matches" className="text-gray-600 hover:text-blue-600">Matches</Link>
          <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
          <Link href="/auth/login" className="text-gray-600 hover:text-blue-600">Login</Link>
        </div>
      </div>
    </nav>
  );
}
