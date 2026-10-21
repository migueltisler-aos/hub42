import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // tsc --noEmit läuft separat; ignoreBuildErrors für Vercel-Kompatibilität
    ignoreBuildErrors: true,
  },
  async redirects() {
    // Die Regalwand war bis zum Umzug auf / unter /neue-ui geteilt worden.
    // /old war die alte Startseite mit dem alten Preismodell (bis 2026-10-20);
    // vorübergehend (307), damit die Route bei Bedarf wieder frei ist.
    return [
      { source: "/neue-ui", destination: "/", permanent: true },
      { source: "/old", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
