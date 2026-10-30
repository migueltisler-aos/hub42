/* Adresse, Wortlaut und Knopf-Klassen des Verweises auf testkaufhaus.de.
   Bewusst außerhalb von components/TestkaufhausLink.tsx: das ist eine
   Client-Komponente, und Konstanten aus einem "use client"-Modul kommen in
   Server-Komponenten nur als Client-Referenz an, nicht als Wert. */

export const TESTKAUFHAUS_URL = "https://testkaufhaus.de";

/** Der Satz ohne Link, für Blöcke, in denen ein Knopf daneben verweist. */
export const PREISE_SATZ = "Preise und Pakete findest du auf testkaufhaus.de.";

/* ── Knöpfe auf den Tailwind-Seiten (Layout „(public)“) ─────────────────
   Umriss in Bronze auf Flaschengrün, damit er neben dem bronzenen
   Primärknopf („Jetzt bewerben“) steht, ohne mit ihm zu konkurrieren.
   min-h-11 = 44 px Tippziel. */
export const TK_KNOPF_PUBLIC =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-bronze px-6 py-3 text-sm font-semibold text-bronze-warm transition-colors duration-150 hover:bg-bronze hover:text-green-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream";

/* Auf Salbeigrün (bg-green-mid) trägt Bronze-Warm nur 3,0:1 und Cream 4,5:1
   knapp darunter; dort Weiß (4,9:1). */
export const TK_KNOPF_PUBLIC_MID =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-white px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white hover:text-green-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
