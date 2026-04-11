import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
    default: "Hub42 – The Store You Have To Solve.",
    template: "%s | Hub42",
  },
  description:
    "Hub42 im Alexa Berlin – der kuratierte Geschenke-Store wo Einkaufen ein Spiel ist. Where consumer brands are born.",
  keywords: ["Hub42", "Alexa Berlin", "Geschenke", "Consumer Brands", "Popup Store", "Berlin"],
  authors: [{ name: "Hub42 GmbH" }],
  creator: "Hub42 GmbH",
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://tryhub42.de",
    siteName: "Hub42",
    title: "Hub42 – The Store You Have To Solve.",
    description:
      "Wo Einkaufen ein Spiel ist. 41.000 Berliner täglich. 0% Handelsmarge für Hersteller.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hub42 – The Store You Have To Solve.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hub42 – The Store You Have To Solve.",
    description: "Wo Einkaufen ein Spiel ist. Alexa Berlin.",
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
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
