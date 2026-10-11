/* /termin – steht auf dem gedruckten Marken-Handout. Bucht ein 30-Minuten-
   Gespräch über Calendly, eingebettet, damit niemand die Site verlässt. */

import type { Metadata } from "next";
import Link from "next/link";
import TerminKalender from "@/components/neue-ui/TerminKalender";

export const metadata: Metadata = {
  title: { absolute: "Termin buchen · Hub42" },
  description:
    "30 Minuten mit Miguel Tisler: Fragen zu Regal, Treppe und Ablauf klären, bevor du dich bewirbst.",
};

export default function TerminPage() {
  return (
    <>
      <header className="top">
        <div className="top__in">
          <Link className="mark" href="/">
            HUB42
          </Link>
          <nav className="top__nav" aria-label="Seitenbereiche">
            <Link href="/#treppe">Treppe</Link>
            <Link href="/#preise">Preise</Link>
          </nav>
          <Link className="btn btn--solid" href="/#bewerben">
            Jetzt bewerben
          </Link>
        </div>
      </header>

      <main>
        <section className="sect">
          <div className="wrap" style={{ display: "grid", gap: 28 }}>
            <div style={{ display: "grid", gap: 16, maxWidth: "52ch" }}>
              <p className="eyebrow">Direkt sprechen · 30 Minuten</p>
              <h1>Erst reden, dann bewerben.</h1>
              <p className="lede">
                Du hast Fragen zu Regal, Treppe oder Ablauf? Such dir einen Termin aus. Miguel
                Tisler, Gründer von Hub42, nimmt sich 30 Minuten für dich und dein Produkt.
              </p>
            </div>
            <TerminKalender
              mode="inline"
              label="Freie Termine anzeigen"
              className="btn btn--solid"
            />
          </div>
        </section>
      </main>
    </>
  );
}
