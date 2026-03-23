/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "@libsql/client", "libsql"],
  },
};

module.exports = nextConfig;
