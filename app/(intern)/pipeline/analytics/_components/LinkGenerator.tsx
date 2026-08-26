"use client";

import { useState } from "react";
import { Button, Select, Field } from "@/app/(intern)/_components/ui/form";

interface Props {
  brands: Array<{ id: string; name: string }>;
  erzeugeLinkAction: (brandId: string, label: string) => Promise<string>;
}

/**
 * Erzeugt einen Deck-Link mit Brand-Token für Mails, die von Hand rausgehen.
 *
 * Ohne diesen Weg bliebe die halbe Attribution blind: der automatische Einbau
 * greift nur in der Outreach-Sequenz (lib/outreach/send-step.ts), und die
 * wichtigsten Mails schreibt man ohnehin selbst.
 */
export default function LinkGenerator({ brands, erzeugeLinkAction }: Props) {
  const [brandId, setBrandId] = useState("");
  const [label, setLabel] = useState("manuell");
  const [link, setLink] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function erzeugen() {
    if (!brandId) return;
    setLaeuft(true);
    setFehler(null);
    setKopiert(false);
    try {
      setLink(await erzeugeLinkAction(brandId, label.trim() || "manuell"));
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Link konnte nicht erzeugt werden.");
      setLink(null);
    } finally {
      setLaeuft(false);
    }
  }

  async function kopieren() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setKopiert(true);
    } catch {
      // Clipboard kann vom Browser blockiert sein – der Link steht sichtbar
      // im Feld, von Hand markieren funktioniert immer.
      setFehler("Kopieren wurde blockiert. Link von Hand markieren.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Brand">
          <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            <option value="">– auswählen –</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Anlass"
          hinweis="Gleiche Brand + gleicher Anlass ergibt immer denselben Link."
        >
          <Select value={label} onChange={(e) => setLabel(e.target.value)}>
            <option value="manuell">Manuelle Mail</option>
            <option value="linkedin">LinkedIn / DM</option>
            <option value="messe">Messe / Termin</option>
            <option value="empfehlung">Empfehlung</option>
          </Select>
        </Field>
      </div>

      <Button onClick={erzeugen} disabled={!brandId || laeuft}>
        {laeuft ? "erzeuge …" : "Deck-Link erzeugen"}
      </Button>

      {fehler && <p className="text-red-400/80 text-xs font-mono">{fehler}</p>}

      {link && (
        <div className="border hairline rounded-sm bg-green-dark/40 p-3">
          <p className="text-stone/50 text-[10px] font-mono uppercase tracking-[0.16em] mb-1.5">
            Fertiger Link
          </p>
          <p className="text-bronze text-xs font-mono break-all select-all">{link}</p>
          <button
            onClick={kopieren}
            className="mt-2 text-stone text-xs font-mono hover:text-cream transition-colors"
          >
            {kopiert ? "✓ kopiert" : "kopieren"}
          </button>
        </div>
      )}
    </div>
  );
}
