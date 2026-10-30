"use client";

/* Verweis auf testkaufhaus.de. Preise und Pakete stehen seit 2026-10-30 nur
   noch dort (Entscheidung der Gründer: tryhub42.de bleibt, nur ohne Preise).
   Eine Quelle für Adresse und Wortlaut, damit jede Seite gleich verweist.

   Client-Komponente, damit die Knöpfe einen Klick melden können: mit `ort`
   geht beim Klick ein Ereignis „interaction“ mit section „testkaufhaus-klick“
   und meta.ort an /api/track, nach dem Muster von TerminKalender und
   Regalwand. Ohne `ort` bleibt der Link stumm wie bisher. */

import { track } from "@/lib/analytics-client";
import { PREISE_SATZ, TESTKAUFHAUS_URL, TK_KNOPF_PUBLIC, TK_KNOPF_PUBLIC_MID } from "@/lib/testkaufhaus";

export function TestkaufhausLink({
  className,
  children = "testkaufhaus.de",
  ort,
}: {
  className?: string;
  children?: React.ReactNode;
  /** Wo der Knopf steht, z. B. „leiste“ oder „start-was-wie“. Schaltet die Messung ein. */
  ort?: string;
}) {
  return (
    <a
      href={TESTKAUFHAUS_URL}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={
        ort
          ? () =>
              track({
                event_type: "interaction",
                path: window.location.pathname,
                section: "testkaufhaus-klick",
                meta: { ort },
              })
          : undefined
      }
    >
      {children}
      <span className="sr-only"> (öffnet in neuem Tab)</span>
    </a>
  );
}

/** Der Satz „Preise und Pakete findest du auf testkaufhaus.de.“ mit Link. */
export default function PreiseAufTestkaufhaus({ linkClassName }: { linkClassName?: string }) {
  return (
    <>
      Preise und Pakete findest du auf <TestkaufhausLink className={linkClassName} />.
    </>
  );
}

/** Verweisblock für die früheren Preisstellen: Satz plus Knopf.
    grund: „dunkel“ auf bg-green-dark, „mittel“ auf bg-green-mid. */
export function PreisVerweisPublic({
  ort,
  className = "",
  grund = "dunkel",
}: {
  ort: string;
  className?: string;
  grund?: "dunkel" | "mittel";
}) {
  const mittel = grund === "mittel";
  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-3 border-l-4 border-bronze px-5 py-4 ${
        mittel ? "bg-green-dark/25" : "bg-bronze/5"
      } ${className}`}
    >
      <p className={`${mittel ? "text-white" : "text-cream"} text-sm font-semibold`}>{PREISE_SATZ}</p>
      <TestkaufhausLink className={mittel ? TK_KNOPF_PUBLIC_MID : TK_KNOPF_PUBLIC} ort={ort}>
        Preise auf testkaufhaus.de <span aria-hidden="true">→</span>
      </TestkaufhausLink>
    </div>
  );
}
