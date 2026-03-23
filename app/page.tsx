import Link from "next/link";

export default function HomePage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Next Match</h1>
      <p className="text-lg text-gray-600 mb-8">
        Join local recreational sports games in your city — soccer, basketball, padel and more.
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/matches"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Browse Matches
        </Link>
        <Link
          href="/auth/register"
          className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
        >
          Sign Up Free
        </Link>
      </div>
    </div>
  );
}
