import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./regalwand.css";

/* Die Display-Schrift der Regalwand. DM Sans, DM Mono und Bebas liegen schon
   global als next/font-Variablen an <html>. */
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  display: "swap",
});

const TITEL = "Hub42 · Der Laden für Neuheiten im Alexa Berlin";
const TEXT =
  "Der Laden nur für Neuheiten: eine Treppe vom ersten Test bis zur Listung, echte Kasse statt Umfrage. Miete pro Zentimeter plus 7 % auf den Verkauf. Alexa Berlin, Eröffnung März 2027.";

export const metadata: Metadata = {
  title: { absolute: TITEL },
  description: TEXT,
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://tryhub42.de",
    siteName: "Hub42",
    title: TITEL,
    description: TEXT,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: TITEL }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITEL,
    description: "Vom ersten Regal bis zur Listung. Miete pro Zentimeter plus 7 % auf den Verkauf.",
    creator: "@hub42berlin",
  },
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  /* Alles hängt unter .rw – das kapselt die generischen Klassennamen des
     Mockups gegen den Rest der Site ab (siehe regalwand.css). */
  return <div className={`${schibsted.variable} rw`}>{children}</div>;
}
