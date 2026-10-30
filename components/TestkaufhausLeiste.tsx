/* Leiste über der Navigation auf allen öffentlichen Seiten: der Weg zu
   testkaufhaus.de, seit 2026-10-30 (Preise stehen nur noch dort).

   Eine Zeile, feste Höhe h-11 (44 px) auf jeder Breite, damit Layouts sie
   einplanen können: im Layout „(public)“ sitzt sie im festen Header und
   PublicLayout schiebt den Inhalt um genau diese Höhe nach unten; im Layout
   „(start)“ steht sie im Fluss vor der sticky Kopfzeile. Nicht wegklickbar.

   Liegt nie unter .rw: die Regalwand-Regeln (a { color: inherit } usw.) sind
   ungelayert und würden die Tailwind-Klassen überstimmen. */

import { TestkaufhausLink } from "@/components/TestkaufhausLink";

export const LEISTE_HOEHE = "h-11";

/* Satzspiegel je Layout: „public“ wie die Navbar (max-w-7xl), „start“ wie
   die Kopfzeile der Regalwand (.top__in: 1180 px, 28 px Rand). */
const SPIEGEL = {
  public: "max-w-7xl pl-4 sm:px-6 lg:px-8",
  start: "max-w-[1180px] pl-7 sm:pr-7",
} as const;

export default function TestkaufhausLeiste({ spiegel = "public" }: { spiegel?: keyof typeof SPIEGEL }) {
  return (
    <aside
      aria-label="Testkaufhaus"
      /* Trennlinie als Schatten statt border: die Leiste bleibt exakt 44 px */
      className="bg-green-muted text-cream shadow-[inset_0_-1px_0_rgb(200_150_74/0.3)]"
    >
      <div className={`mx-auto ${SPIEGEL[spiegel]}`}>
        <div className={`flex ${LEISTE_HOEHE} items-center justify-between gap-3`}>
          <p className="min-w-0 truncate text-[13px] leading-none tracking-wide">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-bronze-warm">Neu:</span>{" "}
            das Testkaufhaus
            <span className="hidden md:inline"> mit dem BIFI im Alexa, ab 28.03.2027</span>
          </p>
          <TestkaufhausLink
            ort="leiste"
            className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap bg-bronze px-4 text-[13px] font-semibold text-green-muted transition-colors duration-150 hover:bg-bronze-light focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-green-muted sm:px-5"
          >
            Zu testkaufhaus.de <span aria-hidden="true">→</span>
          </TestkaufhausLink>
        </div>
      </div>
    </aside>
  );
}
