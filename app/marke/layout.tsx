import type { Metadata } from "next";
import Link from "next/link";
import { Archivo_Narrow, IBM_Plex_Mono } from "next/font/google";
import Etikettmarke from "@/app/crm/_components/Etikettmarke";
import { aktuelleMarke } from "@/lib/marke";
import MarkeNav from "./_components/MarkeNav";
import MarkeWechsel from "./_components/MarkeWechsel";
import "./marke.css";

const archivo = Archivo_Narrow({ subsets: ["latin"], weight: "700", variable: "--font-archivo-narrow" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: { default: "Marken-Portal", template: "%s · Marken-Portal Testkaufhaus" },
  robots: { index: false, follow: false },
};

export default async function MarkeLayout({ children }: { children: React.ReactNode }) {
  const marke = await aktuelleMarke();
  return (
    <div className={`mp ${archivo.variable} ${plexMono.variable}`}>
      <header className="mp-kopf">
        <div className="mp-spiegel mp-kopf__in">
          <Link href="/marke" aria-label="Zur Übersicht">
            <Etikettmarke className="mp-kopf__logo" />
          </Link>
          <span className="mp-kopf__marke">Marken-Portal</span>
          {marke && (
            <div className="mp-kopf__rechts">
              {marke.alle.length > 1 ? (
                <MarkeWechsel aktiv={marke.brandId} alle={marke.alle} />
              ) : (
                <strong>{marke.brandName}</strong>
              )}
              <form action="/marke/auth/abmelden" method="post">
                <button type="submit">Abmelden</button>
              </form>
            </div>
          )}
        </div>
      </header>
      {marke && <MarkeNav />}
      <main className="mp-spiegel mp-inhalt">{children}</main>
    </div>
  );
}
