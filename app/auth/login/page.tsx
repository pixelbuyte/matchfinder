"use client";
import { useState } from "react";
import { login } from "../actions";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await login(fd);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Log in</h1>
      {error && <p className="bg-red-50 text-red-600 border border-red-200 rounded p-3 mb-4 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input name="email" type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input name="password" type="password" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
          Log In
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        No account?{" "}
        <Link href="/auth/register" className="text-blue-600 hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
