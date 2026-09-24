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

export const metadata: Metadata = {
  title: { absolute: "Hub42 – Regalfront im Alexa Berlin, ab 5 cm" },
  description:
    "Hub42 im Alexa Berlin: Regalfront nach Zentimetern, Provision erst beim Verkauf. 41.000 Besucher täglich. Eröffnung März 2027 – jetzt bewerben.",
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  /* Alles hängt unter .rw – das kapselt die generischen Klassennamen des
     Mockups gegen den Rest der Site ab (siehe regalwand.css). */
  return <div className={`${schibsted.variable} rw`}>{children}</div>;
}
