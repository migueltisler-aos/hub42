import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // tsc --noEmit läuft separat; ignoreBuildErrors für Vercel-Kompatibilität
    ignoreBuildErrors: true,
  },
  async redirects() {
    // Die Regalwand war bis zum Umzug auf / unter /neue-ui geteilt worden.
    return [{ source: "/neue-ui", destination: "/", permanent: true }];
  },
};

export default nextConfig;
