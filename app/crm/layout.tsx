import type { Metadata } from "next";
import Link from "next/link";
import Etikettmarke from "./_components/Etikettmarke";
import "./crm.css";

export const metadata: Metadata = {
  title: { default: "CRM", template: "%s · CRM Testkaufhaus" },
  robots: { index: false, follow: false },
};

/* Eigenes Layout ohne InternNav. Alles hängt unter .crm, denn Route-CSS
   bleibt nach einer Client-Navigation im Dokument (wie .rw auf der Startseite). */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="crm">
      <header className="crm-kopf">
        <div className="crm-spiegel crm-kopf__in">
          <Link href="/crm/heute" className="crm-kopf__marke">
            <Etikettmarke className="crm-kopf__logo" />
          </Link>
          <span className="crm-kopf__bereich">CRM</span>
        </div>
      </header>
      <main className="crm-spiegel crm-inhalt">{children}</main>
    </div>
  );
}
