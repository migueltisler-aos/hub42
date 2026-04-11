import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // tsc --noEmit läuft separat; ignoreBuildErrors für Vercel-Kompatibilität
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
