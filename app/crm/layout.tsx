import type { Metadata } from "next";
import Link from "next/link";
import { Archivo_Narrow, IBM_Plex_Mono } from "next/font/google";
import Etikettmarke from "./_components/Etikettmarke";
import CrmNav from "./_components/CrmNav";
import "./crm.css";

// Schriften der Testkaufhaus-Tokens: Archivo Narrow Bold als --charakter,
// IBM Plex Mono als Webfassung von --mono (design-tokens.md).
const archivo = Archivo_Narrow({ subsets: ["latin"], weight: "700", variable: "--font-archivo-narrow" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: { default: "CRM", template: "%s · CRM Testkaufhaus" },
  robots: { index: false, follow: false },
};

/* Eigenes Layout ohne InternNav. Alles hängt unter .crm, denn Route-CSS
   bleibt nach einer Client-Navigation im Dokument (wie .rw auf der Startseite). */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`crm ${archivo.variable} ${plexMono.variable}`}>
      <header className="crm-kopf">
        <div className="crm-spiegel crm-kopf__in">
          <Link href="/crm/aufgaben" className="crm-kopf__marke">
            <Etikettmarke className="crm-kopf__logo" />
          </Link>
          <span className="crm-kopf__bereich">CRM</span>
          <CrmNav />
        </div>
      </header>
      <main className="crm-spiegel crm-inhalt">{children}</main>
    </div>
  );
}
