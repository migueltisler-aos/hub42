"use client";

import { useState } from "react";
import { STUFEN, VERLUST_GRUENDE, type Stufe } from "@/lib/crm-heute-model";

interface Props {
  stufe: Stufe;
  stufeSeit: string | null;
  verlustGrund: string | null;
  wiedervorlage: string | null;
  setzeAction: (formData: FormData) => Promise<void>;
}

const heute = () => new Date().toISOString().slice(0, 10);

const tageSeit = (iso: string | null) => {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
};

export default function StufeForm({
  stufe,
  stufeSeit,
  verlustGrund,
  wiedervorlage,
  setzeAction,
}: Props) {
  const [neu, setNeu] = useState<Stufe>(stufe);
  const [laeuft, setLaeuft] = useState(false);

  const tage = tageSeit(stufeSeit);
  const unveraendert = neu === stufe;

  const feld =
    "w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze";
  const beschriftung = "block text-stone text-xs font-mono uppercase tracking-widest mb-1";

  return (
    <div className="border border-bronze/30 bg-green-mid/10 p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">Stufe</p>
        <p className="text-stone/50 text-[10px] font-mono">
          steht auf {stufe}
          {tage !== null && ` seit ${tage} ${tage === 1 ? "Tag" : "Tagen"}`}
          {verlustGrund && ` · ${verlustGrund}`}
          {wiedervorlage && ` · Wiedervorlage ${new Date(wiedervorlage).toLocaleDateString("de-DE")}`}
        </p>
      </div>

      <form
        action={async (formData) => {
          setLaeuft(true);
          try {
            await setzeAction(formData);
          } finally {
            setLaeuft(false);
          }
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={beschriftung} htmlFor="stufe">
              Neue Stufe
            </label>
            <select
              id="stufe"
              name="stufe"
              value={neu}
              onChange={(e) => setNeu(e.target.value as Stufe)}
              className={feld}
            >
              {STUFEN.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Pflichtfelder der beiden Constraints. Sie stehen nur da, wenn sie
              greifen — ein Grundfeld an einer Marke im Gespräch wäre eine
              Einladung, ihn vorsorglich auszufüllen. */}
          {neu === "Verloren" && (
            <div>
              <label className={beschriftung} htmlFor="verlust_grund">
                Grund (Pflicht)
              </label>
              <select
                id="verlust_grund"
                name="verlust_grund"
                defaultValue={verlustGrund ?? ""}
                required
                className={feld}
              >
                <option value="" disabled>
                  bitte wählen
                </option>
                {VERLUST_GRUENDE.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}

          {neu === "Später" && (
            <div>
              <label className={beschriftung} htmlFor="wiedervorlage">
                Wiedervorlage (Pflicht)
              </label>
              <input
                id="wiedervorlage"
                name="wiedervorlage"
                type="date"
                min={heute()}
                defaultValue={wiedervorlage ?? ""}
                required
                className={feld}
              />
            </div>
          )}
        </div>

        <div>
          <label className={beschriftung} htmlFor="notiz">
            Notiz (optional)
          </label>
          <input
            id="notiz"
            name="notiz"
            placeholder="Was ist passiert? Landet mit Namen in der Historie."
            className={feld}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          {unveraendert && (
            <p className="text-stone/40 text-[10px] font-mono">
              Stufe unverändert
            </p>
          )}
          <button
            type="submit"
            disabled={laeuft || unveraendert}
            className="px-6 py-2 border border-bronze text-bronze text-sm font-mono hover:bg-bronze hover:text-green-dark transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-bronze"
          >
            {laeuft ? "Wird gesetzt…" : "Stufe setzen →"}
          </button>
        </div>
      </form>
    </div>
  );
}
