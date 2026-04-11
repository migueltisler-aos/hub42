import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // tsc --noEmit läuft separat; .next/types wird von VS Code gehalten
    ignoreBuildErrors: true,
  },
  distDir: ".next-build",
};

export default nextConfig;
