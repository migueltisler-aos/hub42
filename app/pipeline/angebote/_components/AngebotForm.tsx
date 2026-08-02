"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ADDONS,
  ANGEBOT_STATUSES,
  MWST_PCT,
  PREIS_PRO_QM,
  MINDESTMIETE_MONAT,
  REGAL_TIEFE_CM,
  computeAngebot,
  formatEUR,
  addonPosition,
  defaultDeliverables,
  ebeneM2,
  flaecheM2,
  flaechenMieteMonat,
  type Angebot,
  type AngebotStatus,
  type Position,
  type Deliverable,
  type Ebene,
} from "@/lib/angebote";

export interface BrandOption {
  id: string;
  name: string;
  ansprechpartner: string | null;
}

interface Props {
  angebot?: Angebot;
  brands: BrandOption[];
  presetBrandId?: string;
  saveAction: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
}

const inputClass =
  "w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze";
const labelClass = "block text-stone text-xs font-mono uppercase tracking-widest mb-1";

const fmtM2 = (m2: number) => `${m2.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;

export default function AngebotForm({
  angebot,
  brands,
  presetBrandId,
  saveAction,
  deleteAction,
}: Props) {
  const router = useRouter();

  const initialBrandId = angebot?.brand_id ?? presetBrandId ?? "";
  const initialBrand = brands.find((b) => b.id === initialBrandId);

  const [brandId, setBrandId] = useState(initialBrandId);
  const [empfaenger, setEmpfaenger] = useState(
    angebot?.empfaenger_name ?? initialBrand?.name ?? ""
  );
  const [ansprechpartner, setAnsprechpartner] = useState(
    angebot?.ansprechpartner ?? initialBrand?.ansprechpartner ?? ""
  );
  const [laufzeit, setLaufzeit] = useState(angebot?.laufzeit_monate ?? 3);
  const [ebenen, setEbenen] = useState<Ebene[]>(
    angebot?.ebenen?.length ? angebot.ebenen : [{ name: "", cm: 0 }]
  );
  const [positionen, setPositionen] = useState<Position[]>(angebot?.positionen ?? []);
  const [deliverables, setDeliverables] = useState<Deliverable[]>(
    angebot?.deliverables ?? defaultDeliverables()
  );

  // interne Logistik
  const [tasting, setTasting] = useState(angebot?.tasting ?? false);
  const [tastingPct, setTastingPct] = useState(angebot?.tasting_pct ?? 10);

  const [addonChoice, setAddonChoice] = useState(ADDONS[0]?.id ?? "");

  const summary = computeAngebot(positionen, laufzeit, ebenen);
  const totalM2 = flaecheM2(ebenen);
  const flaecheMiete = flaechenMieteMonat(ebenen);
  const mindestAktiv = totalM2 > 0 && totalM2 * PREIS_PRO_QM < MINDESTMIETE_MONAT;

  function onBrandChange(id: string) {
    setBrandId(id);
    const b = brands.find((x) => x.id === id);
    if (b) {
      setEmpfaenger(b.name);
      if (b.ansprechpartner) setAnsprechpartner(b.ansprechpartner);
    }
  }

  // Ebenen
  function addEbene() {
    setEbenen((prev) => [...prev, { name: "", cm: 0 }]);
  }
  function updateEbene(i: number, patch: Partial<Ebene>) {
    setEbenen((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function removeEbene(i: number) {
    setEbenen((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Zusatzleistungen
  function addAddon() {
    const p = addonPosition(addonChoice);
    if (p) setPositionen((prev) => [...prev, p]);
  }
  function addFrei() {
    setPositionen((prev) => [
      ...prev,
      { typ: "frei", label: "", menge: 1, einheit: "pauschal", einzelpreisMonat: 0, einmalig: true },
    ]);
  }
  function updatePos(i: number, patch: Partial<Position>) {
    setPositionen((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function removePos(i: number) {
    setPositionen((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Deliverables
  function toggleDeliverable(i: number) {
    setDeliverables((prev) =>
      prev.map((d, idx) =>
        idx === i ? { ...d, status: d.status === "offen" ? "erhalten" : "offen" } : d
      )
    );
  }
  function updateDeliverable(i: number, patch: Partial<Deliverable>) {
    setDeliverables((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function removeDeliverable(i: number) {
    setDeliverables((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addDeliverable() {
    setDeliverables((prev) => [...prev, { label: "", status: "offen" }]);
  }

  return (
    <form action={saveAction} className="space-y-8">
      <input type="hidden" name="ebenen" value={JSON.stringify(ebenen)} />
      <input type="hidden" name="positionen" value={JSON.stringify(positionen)} />
      <input type="hidden" name="deliverables" value={JSON.stringify(deliverables)} />
      <input type="hidden" name="brand_id" value={brandId} />

      {/* ── Empfänger & Eckdaten ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Brand (aus Pipeline)</label>
          <select value={brandId} onChange={(e) => onBrandChange(e.target.value)} className={inputClass}>
            <option value="">— frei / kein Lead —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Empfänger / Firma</label>
          <input name="empfaenger_name" value={empfaenger} onChange={(e) => setEmpfaenger(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Ansprechpartner</label>
          <input name="ansprechpartner" value={ansprechpartner} onChange={(e) => setAnsprechpartner(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Titel des Angebots</label>
          <input name="titel" defaultValue={angebot?.titel ?? ""} placeholder="z. B. Hub42 Regalplatz – Q3 Launch" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={angebot?.status ?? "Entwurf"} className={inputClass}>
            {ANGEBOT_STATUSES.map((s: AngebotStatus) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Mindestlaufzeit (Monate)</label>
          <input
            name="laufzeit_monate"
            type="number"
            min={1}
            value={laufzeit}
            onChange={(e) => setLaufzeit(Math.max(1, Number(e.target.value) || 1))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Start-Datum</label>
          <input name="start_datum" type="date" defaultValue={angebot?.start_datum ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Gültig bis</label>
          <input name="gueltig_bis" type="date" defaultValue={angebot?.gueltig_bis ?? ""} className={inputClass} />
        </div>
      </section>

      {/* ── Fläche & Ebenen ── */}
      <section className="border border-stone-dark bg-green-mid/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">Fläche &amp; Ebenen</p>
          <span className="text-stone/40 text-[11px] font-mono">
            {PREIS_PRO_QM.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €/m² · Tiefe {REGAL_TIEFE_CM} cm · min. {MINDESTMIETE_MONAT} €
          </span>
        </div>

        {/* Header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 text-stone/40 text-[10px] font-mono uppercase tracking-widest px-1">
          <div className="col-span-6">Ebene / Höhe</div>
          <div className="col-span-2 text-right">Breite cm</div>
          <div className="col-span-3 text-right">Fläche</div>
          <div className="col-span-1" />
        </div>

        <div className="space-y-2">
          {ebenen.map((e, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                value={e.name}
                onChange={(ev) => updateEbene(i, { name: ev.target.value })}
                placeholder="z. B. Augenhöhe / Ebene 3"
                className={`${inputClass} col-span-7 sm:col-span-6`}
              />
              <input
                type="number"
                min={0}
                value={e.cm || ""}
                onChange={(ev) => updateEbene(i, { cm: Math.max(0, Number(ev.target.value) || 0) })}
                className={`${inputClass} col-span-3 sm:col-span-2 text-right`}
                placeholder="cm"
              />
              <div className="col-span-1 sm:col-span-3 text-right text-stone/60 text-xs font-mono">
                {fmtM2(ebeneM2(e))}
              </div>
              <button
                type="button"
                onClick={() => removeEbene(i)}
                className="col-span-1 text-red-400/60 hover:text-red-400 text-sm transition-colors"
                title="Ebene entfernen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addEbene} className="text-stone text-xs font-mono hover:text-cream transition-colors">
          + Ebene
        </button>

        <div className="border-t border-stone-dark/60 pt-3 flex items-center justify-between font-mono">
          <span className="text-stone text-xs">
            Gesamtfläche: <span className="text-cream">{fmtM2(totalM2)}</span>
          </span>
          <span className="text-sm">
            <span className="text-stone text-xs">Flächenmiete: </span>
            <span className="text-bronze font-semibold">{formatEUR(flaecheMiete)} / Monat</span>
          </span>
        </div>
        {mindestAktiv && (
          <p className="text-stone/40 text-[11px] font-mono">
            Mindestmiete {MINDESTMIETE_MONAT} € greift (Fläche × {PREIS_PRO_QM} € = {formatEUR(totalM2 * PREIS_PRO_QM)}).
          </p>
        )}
      </section>

      {/* ── Zusatzleistungen ── */}
      <section className="border border-stone-dark bg-green-mid/10 p-4 space-y-4">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">Zusatzleistungen</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end border-b border-stone-dark/60 pb-4">
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-stone/50 text-[10px] font-mono uppercase tracking-widest mb-1">Add-on</label>
              <select value={addonChoice} onChange={(e) => setAddonChoice(e.target.value)} className={`${inputClass} sm:w-44`}>
                {ADDONS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label} ({a.preisMonat} €)</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={addAddon} className="px-3 py-2 bg-bronze/20 border border-bronze/40 text-bronze text-xs font-mono hover:bg-bronze/30 transition-colors">
              + Add-on
            </button>
          </div>
          <button type="button" onClick={addFrei} className="px-3 py-2 border border-stone-dark text-stone text-xs font-mono hover:border-bronze/40 hover:text-cream transition-colors sm:ml-auto">
            + Freie Position
          </button>
        </div>

        {positionen.length === 0 ? (
          <p className="text-stone/40 text-xs font-mono py-1">Keine Zusatzleistungen.</p>
        ) : (
          <div className="space-y-2">
            {positionen.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input value={p.label} onChange={(e) => updatePos(i, { label: e.target.value })} placeholder="Bezeichnung" className={`${inputClass} col-span-12 sm:col-span-5`} />
                <input type="number" value={p.menge} onChange={(e) => updatePos(i, { menge: Number(e.target.value) || 0 })} className={`${inputClass} col-span-3 sm:col-span-1 text-right`} title="Menge" />
                <input value={p.einheit} onChange={(e) => updatePos(i, { einheit: e.target.value })} className={`${inputClass} col-span-4 sm:col-span-2`} title="Einheit" />
                <input type="number" step="0.01" value={p.einzelpreisMonat} onChange={(e) => updatePos(i, { einzelpreisMonat: Number(e.target.value) || 0 })} className={`${inputClass} col-span-5 sm:col-span-2 text-right`} title="Einzelpreis (Netto)" />
                <label className="col-span-5 sm:col-span-1 flex items-center gap-1 text-stone/60 text-[10px] font-mono cursor-pointer">
                  <input type="checkbox" checked={!!p.einmalig} onChange={(e) => updatePos(i, { einmalig: e.target.checked })} className="accent-bronze" />
                  1×
                </label>
                <button type="button" onClick={() => removePos(i)} className="col-span-2 sm:col-span-1 text-red-400/60 hover:text-red-400 text-sm transition-colors" title="Entfernen">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Summe ── */}
      <section className="border border-bronze/30 bg-green-mid/10 p-4">
        <div className="space-y-1 text-right font-mono text-sm">
          <p className="text-stone text-xs">
            Flächenmiete: <span className="text-cream">{formatEUR(summary.flaechenMonat)}</span>
            {summary.positionenMonat > 0 && (
              <> · Zusatz: <span className="text-cream">{formatEUR(summary.positionenMonat)}</span></>
            )}
            {" "}/ Monat
          </p>
          <p className="text-stone text-xs">
            Netto über {laufzeit} Mon.: <span className="text-cream">{formatEUR(summary.gesamtNetto)}</span>
            {summary.einmaligNetto > 0 && <> (inkl. einmalig {formatEUR(summary.einmaligNetto)})</>}
          </p>
          <p className="text-stone text-xs">zzgl. {MWST_PCT}% MwSt.: <span className="text-cream">{formatEUR(summary.mwst)}</span></p>
          <p className="text-bronze text-lg font-semibold">Gesamt brutto: {formatEUR(summary.gesamtBrutto)}</p>
        </div>
      </section>

      {/* ── Deliverables ── */}
      <section className="border border-stone-dark bg-green-mid/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">Was ich von dir brauche</p>
          <button type="button" onClick={addDeliverable} className="text-stone text-xs font-mono hover:text-cream transition-colors">+ Punkt</button>
        </div>
        <div className="space-y-2">
          {deliverables.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleDeliverable(i)}
                className={`shrink-0 w-5 h-5 border flex items-center justify-center text-xs font-mono transition-colors ${
                  d.status === "erhalten" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "border-stone-dark text-stone/40 hover:border-bronze/50"
                }`}
                title={d.status === "erhalten" ? "erhalten" : "offen"}
              >
                {d.status === "erhalten" ? "✓" : ""}
              </button>
              <input value={d.label} onChange={(e) => updateDeliverable(i, { label: e.target.value })} placeholder="Anforderung" className={`${inputClass} flex-1 ${d.status === "erhalten" ? "line-through text-stone/50" : ""}`} />
              <button type="button" onClick={() => removeDeliverable(i)} className="shrink-0 text-red-400/60 hover:text-red-400 text-sm transition-colors" title="Entfernen">✕</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Intern: Bestückung, Tasting & Nachschub (nicht auf dem Angebot) ── */}
      <details className="border border-stone-dark/60 p-4 group">
        <summary className="text-stone/60 text-xs font-mono uppercase tracking-widest cursor-pointer hover:text-cream transition-colors list-none flex items-center gap-2">
          <span className="group-open:hidden">▸</span>
          <span className="hidden group-open:inline">▾</span>
          Intern: Bestückung, Tasting &amp; Nachschub
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <label className={labelClass}>Max. Bestückung (Stück)</label>
            <input name="max_artikel" type="number" min={0} defaultValue={angebot?.max_artikel ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nachschub-Bestellung an (E-Mail)</label>
            <input name="nachschub_email" type="email" defaultValue={angebot?.nachschub_email ?? ""} placeholder="nachschub@deinemarke.de" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tasting anbieten?</label>
            <label className="flex items-center gap-2 text-cream text-sm font-mono cursor-pointer h-10.5">
              <input type="checkbox" name="tasting" checked={tasting} onChange={(e) => setTasting(e.target.checked)} className="accent-bronze w-4 h-4" />
              Tasting Bar inklusive
            </label>
          </div>
          {tasting && (
            <div>
              <label className={labelClass}>Tasting-Muster (% der Bestückung)</label>
              <input name="tasting_pct" type="number" min={0} value={tastingPct} onChange={(e) => setTastingPct(Math.max(0, Number(e.target.value) || 0))} className={inputClass} />
            </div>
          )}
        </div>
      </details>

      {/* ── Notiz ── */}
      <div>
        <label className={labelClass}>Interne Notiz</label>
        <textarea name="notiz" defaultValue={angebot?.notiz ?? ""} rows={3} className={`${inputClass} resize-none`} />
      </div>

      {/* ── Aktionen ── */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" className="px-6 py-3 bg-bronze text-green-dark text-sm font-semibold hover:bg-bronze-light transition-colors">Speichern →</button>
        {angebot && (
          <Link href={`/pipeline/angebote/${angebot.id}/print`} className="px-6 py-3 border border-bronze/40 text-bronze text-sm font-mono hover:border-bronze transition-colors">Druckansicht ↗</Link>
        )}
        <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-stone-dark text-stone text-sm hover:border-bronze/40 hover:text-cream transition-colors">Abbrechen</button>
        {deleteAction && (
          <button type="submit" formAction={deleteAction} formNoValidate className="px-4 py-3 border border-red-500/30 text-red-400/70 text-xs font-mono hover:border-red-400 hover:text-red-400 transition-colors sm:ml-auto">Löschen</button>
        )}
      </div>
    </form>
  );
}
