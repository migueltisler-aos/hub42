import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // tsc --noEmit läuft separat; ignoreBuildErrors für Vercel-Kompatibilität
    ignoreBuildErrors: true,
  },
  async redirects() {
    // Die Regalwand war bis zum Umzug auf / unter /neue-ui geteilt worden.
    // /termin steht auf dem gedruckten Marken-Handout; Ziel hier änderbar, ohne neu zu drucken.
    return [
      { source: "/neue-ui", destination: "/", permanent: true },
      { source: "/termin", destination: "https://calendly.com/miguel-tryhub42/30min", permanent: false },
    ];
  },
};

export default nextConfig;
