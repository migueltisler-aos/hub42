"use client";

/**
 * Upload → Auswahl → PDF. Das PDF entsteht im Browser (pdf-lib), damit kein
 * Binaer-Download durch eine Server Action muss; die Action liefert nur die
 * Etiketten-Daten samt Produkt-IDs.
 */

import { useMemo, useState, useTransition } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/app/(intern)/_components/ui/form";
import { NoteBox, Panel } from "@/app/(intern)/_components/ui/surfaces";
import { etikettenPdf, euro, kurzcode, type Etikett } from "@/lib/etiketten";
import { etikettenAusExport, type EtikettenErgebnis } from "./actions";

export default function EtikettenClient() {
  const [ergebnis, setErgebnis] = useState<EtikettenErgebnis | null>(null);
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());
  const [laedt, startTransition] = useTransition();
  const [baut, setBaut] = useState(false);

  const etiketten = useMemo(() => (ergebnis?.ok ? ergebnis.etiketten : []), [ergebnis]);
  const neu = etiketten.filter((e) => e.neu).length;
  const verkaeufer = useMemo(() => [...new Set(etiketten.map((e) => e.seller))], [etiketten]);

  function hochladen(formData: FormData) {
    startTransition(async () => {
      const r = await etikettenAusExport(formData);
      setErgebnis(r);
      setAuswahl(new Set(r.ok ? r.etiketten.map((e) => e.sumupId) : []));
    });
  }

  function umschalten(ids: string[], an: boolean) {
    setAuswahl((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (an) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  async function herunterladen() {
    setBaut(true);
    try {
      const gewaehlt = etiketten.filter((e) => auswahl.has(e.sumupId));
      const bytes = await etikettenPdf(gewaehlt);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Hub42_Etiketten_${new Date().toISOString().slice(0, 10)}_${gewaehlt.length}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBaut(false);
    }
  }

  return (
    <div className="space-y-6">
      <Panel nummer="01" title="SumUp-Export" hinweis="SumUp → Artikel → Exportieren (CSV). Artikel der Kategorie „Ausgelistet“ werden übersprungen.">
        <form action={hochladen} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="export"
            accept=".csv,text/csv"
            required
            className="text-stone text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-green-mid file:px-3 file:py-2 file:text-cream file:text-sm hover:file:bg-green-muted"
          />
          <Button type="submit" icon={laedt ? undefined : Upload} disabled={laedt}>
            {laedt && <Loader2 size={15} className="animate-spin" />}
            Einlesen
          </Button>
        </form>
        {ergebnis && !ergebnis.ok && <p className="text-amber-300 text-sm mt-3">{ergebnis.message}</p>}
        {ergebnis?.ok && (
          <p className="text-stone text-xs mt-3 font-mono">
            {etiketten.length} Artikel · {neu} neu als Feedback-Produkt angelegt · {ergebnis.ausgelassen} übersprungen
          </p>
        )}
      </Panel>

      {etiketten.length > 0 && (
        <Panel
          nummer="02"
          title="Auswahl"
          actions={
            <Button icon={baut ? undefined : Download} onClick={herunterladen} disabled={baut || auswahl.size === 0}>
              {baut && <Loader2 size={15} className="animate-spin" />}
              PDF ({auswahl.size})
            </Button>
          }
        >
          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            <Button variante="quiet" klein onClick={() => umschalten(etiketten.map((e) => e.sumupId), true)}>
              Alle
            </Button>
            <Button variante="quiet" klein onClick={() => setAuswahl(new Set())}>
              Keine
            </Button>
            {verkaeufer.map((v) => {
              const ids = etiketten.filter((e) => e.seller === v).map((e) => e.sumupId);
              const alle = ids.every((id) => auswahl.has(id));
              return (
                <Button key={v} variante="quiet" klein onClick={() => umschalten(ids, !alle)}>
                  {alle ? "−" : "+"} {v}
                </Button>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-stone text-[10px] font-mono uppercase tracking-[0.16em] text-left border-b hairline">
                  <th className="py-2 pr-2 w-8" />
                  <th className="py-2 pr-3">Artikel</th>
                  <th className="py-2 pr-3">Verkäufer</th>
                  <th className="py-2 pr-3 text-right">Preis</th>
                  <th className="py-2 pr-3 text-right">Grundpreis</th>
                  <th className="py-2">QR</th>
                </tr>
              </thead>
              <tbody>
                {etiketten.map((e: Etikett) => (
                  <tr key={e.sumupId} className="border-b hairline last:border-0">
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        aria-label={`${e.name} drucken`}
                        checked={auswahl.has(e.sumupId)}
                        onChange={(ev) => umschalten([e.sumupId], ev.target.checked)}
                        className="accent-bronze size-4"
                      />
                    </td>
                    <td className="py-2 pr-3 text-cream">
                      {e.name}
                      {e.neu && (
                        <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-bronze">neu</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-stone">{e.seller}</td>
                    <td className="py-2 pr-3 text-right text-cream tabular-nums whitespace-nowrap">{euro(e.price)}</td>
                    <td className="py-2 pr-3 text-right text-stone tabular-nums whitespace-nowrap">{e.grundpreis ?? "–"}</td>
                    <td className="py-2 font-mono text-xs">
                      <a
                        href={`/q/${kurzcode(e.productId)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stone hover:text-bronze"
                      >
                        /q/{kurzcode(e.productId)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <NoteBox tone="info">
        <strong className="text-cream">Drucken am M110S:</strong> PDF in Acrobat öffnen, Drucker „M110S Printer“,{" "}
        <strong className="text-cream">Tatsächliche Größe</strong> und Ausrichtung{" "}
        <strong className="text-cream">Querformat</strong>. Nicht „Anpassen“ — sonst wird das Etikett vergrößert und
        abgeschnitten. Erst ein Etikett testen und scannen, dann den Rest.
      </NoteBox>
    </div>
  );
}
