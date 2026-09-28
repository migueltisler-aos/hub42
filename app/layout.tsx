import type { Metadata } from "next";
import { Suspense } from "react";
import { Bebas_Neue, DM_Sans, DM_Mono } from "next/font/google";
import Analytics from "@/components/Analytics";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tryhub42.de"),
  title: {
    default: "Hub42 · Der Laden für Neuheiten",
    template: "%s | Hub42",
  },
  description:
    "Hub42 im Alexa Berlin: der Laden nur für Neuheiten. Eine Treppe vom ersten Test bis zur Listung, Miete pro Zentimeter plus 7 % auf den Verkauf.",
  keywords: ["Hub42", "Alexa Berlin", "Neuheiten", "Marken", "Regalmiete", "Markttest", "Listung", "Berlin"],
  authors: [{ name: "Hub42 UG (haftungsbeschränkt)" }],
  creator: "Hub42 UG (haftungsbeschränkt)",
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://tryhub42.de",
    siteName: "Hub42",
    title: "Hub42 · Der Laden für Neuheiten",
    description:
      "Vom ersten Regal bis zur Listung. Echte Kasse statt Umfrage, 41.000 Besucher täglich. Miete pro Zentimeter plus 7 % auf den Verkauf.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hub42 · Der Laden für Neuheiten",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hub42 · Der Laden für Neuheiten",
    description: "Vom ersten Regal bis zur Listung. Miete pro Zentimeter plus 7 % auf den Verkauf.",
    creator: "@hub42berlin",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://tryhub42.de",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${bebasNeue.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-green-dark text-cream">
        {/* Suspense ist Pflicht, nicht Vorsicht: Analytics nutzt
            useSearchParams(), was ohne Boundary die statisch vorgerenderten
            Public-Seiten in dynamisches Rendering kippen würde. */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
