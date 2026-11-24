/**
 * Statusleiste über der Pipeline-Liste.
 *
 * Sie beantwortet in einer Zeile, was man einem Partner am Telefon sagt:
 * so viele angeschrieben, so viele geantwortet, so viele onboarded, bei so
 * vielen liegt die Ware. Jede Kachel nennt darunter ihre Quelle, weil eine
 * nackte Zahl ohne Definition genau die Rückfrage auslöst, die sie ersparen
 * soll. Eine Quelle, in die noch niemand schreibt, sagt das offen.
 */

import { Card, Eyebrow, NoteBox } from "../../_components/ui/surfaces";
import type { StatusDaten, StatusZahl } from "@/lib/pipeline-status";

const ZAHL = new Intl.NumberFormat("de-DE");

function Kachel({ z, erste }: { z: StatusZahl; erste: boolean }) {
  return (
    <Card className="px-4 py-3 flex-1 min-w-[150px]">
      <p className="text-stone-dark text-[10px] font-mono uppercase tracking-[0.16em]">{z.label}</p>
      <p className="flex items-baseline gap-2 mt-0.5">
        <span
          className={`text-3xl tabular-nums leading-tight ${z.luecke ? "text-stone-dark/50" : "text-green-dark"}`}
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {ZAHL.format(z.wert)}
          {z.einheit ? <span className="text-xl ml-1">{z.einheit}</span> : null}
        </span>
        {!erste && z.quote !== undefined && !z.luecke && (
          <span className="text-stone-dark/70 text-[11px] font-mono tabular-nums">
            {z.quote} % davor
          </span>
        )}
      </p>
      {z.aufteilung && (
        <p className="text-green-dark/70 text-[11px] font-mono mt-0.5 leading-snug">
          {z.aufteilung}
        </p>
      )}
      <p className="text-stone-dark/80 text-[11px] mt-0.5 leading-snug">{z.quelle}</p>
    </Card>
  );
}

export default function StatusBand({ daten }: { daten: StatusDaten }) {
  // Lücken aus beiden Blöcken: der leere Artikelstamm steht unten, wäre aber
  // der teuerste Befund der ganzen Leiste.
  const luecken = [...daten.kette, ...daten.abschluss].filter((z) => z.luecke);
  const stand = new Date(daten.stand).toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <section className="mb-8 space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow>Von der Ansprache bis ins Regal</Eyebrow>
        <p className="text-stone text-[11px] font-mono">Stand {stand} Uhr</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {daten.kette.map((z, i) => (
          <Kachel key={z.label} z={z} erste={i === 0} />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {daten.abschluss.map((z) => (
          <Kachel key={z.label} z={z} erste />
        ))}
      </div>

      {luecken.map((z) => (
        <NoteBox key={z.label}>
          <strong className="font-semibold">{z.label}:</strong> {z.luecke}
        </NoteBox>
      ))}
    </section>
  );
}
