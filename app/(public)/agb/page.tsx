import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AGB",
  description: "Allgemeine Geschäftsbedingungen der Hub42 UG (haftungsbeschränkt) – in Arbeit.",
};

export default function AGBPage() {
  return (
    <section className="bg-green-dark pt-32 pb-20 min-h-[70vh]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">Rechtliches</p>
        <h1
          className="text-cream text-5xl tracking-widest mb-8"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          AGB
        </h1>

        <div className="space-y-6 text-sm text-stone leading-relaxed">
          <p className="text-cream text-lg font-semibold">
            Sorry – so schnell sind wir noch nicht.
          </p>
          <p>
            Unsere Allgemeinen Geschäftsbedingungen sind noch in Arbeit. Wir sind ein
            junges Team und stellen sie hier online, sobald sie fertig sind.
          </p>
          <p>
            Du hast Fragen zu Konditionen, Konsignation oder deinem Slot? Schreib uns
            einfach direkt – wir antworten persönlich:{" "}
            <a href="mailto:info@tryhub42.de" className="text-bronze hover:underline">
              info@tryhub42.de
            </a>
          </p>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-block border border-bronze/40 text-bronze px-6 py-3 text-xs font-mono uppercase tracking-widest hover:bg-bronze/10 transition-colors"
            >
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
