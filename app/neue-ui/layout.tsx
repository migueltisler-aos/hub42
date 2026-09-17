import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./regalwand.css";

/* Die Display-Schrift der neuen UI. DM Sans, DM Mono und Bebas liegen schon
   global als next/font-Variablen an <html>. */
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Regalwand",
  description:
    "Neue UI: der Hub42-Store als Regalwand. Jede Front hat eine Breite in Zentimetern und einen Preis.",
  robots: { index: false, follow: false },
};

export default function NeueUiLayout({ children }: { children: React.ReactNode }) {
  /* Alles hängt unter .rw – das kapselt die generischen Klassennamen des
     Mockups gegen den Rest der Site ab (siehe regalwand.css). */
  return <div className={`${schibsted.variable} rw`}>{children}</div>;
}
