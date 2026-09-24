import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { KOHORTE, LAUFZEIT_TAGE } from "@/lib/regalbeweis";

/* Bewusst dieselbe CSS-Datei wie /neue-ui statt einer Kopie: das
   Material-Design (Beton, Stahl, Sperrholz, Glühlicht) soll eine Quelle
   behalten. Ergänzungen, die nur dieses Angebot braucht, liegen daneben
   in angebot.css – ebenfalls unter .rw gekapselt. */
import "../(start)/regalwand.css";
import "./angebot.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `Regalbeweis ${LAUFZEIT_TAGE}`,
  description: `${LAUFZEIT_TAGE} Tage Regalfront auf Augenhöhe in Berlin, Betrieb komplett übernommen, Feedback-Panel am Regal – und am Ende das Dossier mit echten Abverkaufszahlen für dein Handelsgespräch. ${KOHORTE.name}: ${KOHORTE.plaetze} Plätze.`,
};

export default function RegalbeweisLayout({ children }: { children: React.ReactNode }) {
  /* Diese Route hängt absichtlich NICHT in der (public)-Gruppe: Navbar und
     Footer der grünen Site würden gegen die Betonfläche laufen. Kopfzeile
     und Fuß bringt die Seite selbst mit, wie /neue-ui auch. */
  return <div className={`${schibsted.variable} rw`}>{children}</div>;
}
