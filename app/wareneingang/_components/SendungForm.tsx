"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand } from "@/lib/pipeline";

interface Props {
  brands: Brand[];
  saveAction: (formData: FormData) => Promise<void>;
}

const baseClass =
  "w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze";

function ScanButton({ onScan }: { onScan: (wert: string) => void }) {
  const [aktiv, setAktiv] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const unterstuetzt = typeof window !== "undefined" && "BarcodeDetector" in window;

  function stoppen() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    setAktiv(false);
  }

  async function starten() {
    setAktiv(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();

    // @ts-expect-error - BarcodeDetector ist noch nicht in den TS-DOM-Typen enthalten
    const detector = new window.BarcodeDetector({ formats: ["ean_13", "code_128", "qr_code"] });

    const schleife = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        if (videoRef.current) requestAnimationFrame(schleife);
        return;
      }
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0) {
          onScan(codes[0].rawValue);
          stoppen();
          return;
        }
      } catch {
        // einzelner Frame nicht lesbar, naechster Versuch
      }
      requestAnimationFrame(schleife);
    };
    requestAnimationFrame(schleife);
  }

  if (!unterstuetzt) {
    return (
      <p className="text-stone/40 text-[11px] font-mono">
        Kamera-Scan hier nicht unterstützt — bitte manuell eingeben.
      </p>
    );
  }

  if (!aktiv) {
    return (
      <button
        type="button"
        onClick={starten}
        className="px-2 py-1 border border-bronze/40 text-bronze text-[11px] font-mono hover:border-bronze transition-colors"
      >
        Kamera-Scan
      </button>
    );
  }

  return (
    <div>
      <video ref={videoRef} className="w-full max-w-xs border border-bronze/40" muted playsInline />
      <button
        type="button"
        onClick={stoppen}
        className="mt-2 px-2 py-1 border border-stone-dark text-stone text-[11px] font-mono hover:border-bronze/40 transition-colors"
      >
        Abbrechen
      </button>
    </div>
  );
}

let naechsteZeilenId = 1;

function ArtikelZeile({
  zeilenId,
  entfernbar,
  onEntfernen,
}: {
  zeilenId: number;
  entfernbar: boolean;
  onEntfernen: () => void;
}) {
  const eanRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border border-stone-dark p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-stone/40 text-[10px] font-mono uppercase tracking-widest">Artikel {zeilenId}</p>
        {entfernbar && (
          <button
            type="button"
            onClick={onEntfernen}
            className="text-red-400/70 text-[11px] font-mono hover:text-red-400 transition-colors"
          >
            Entfernen
          </button>
        )}
      </div>

      <div>
        <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">EAN / GTIN *</label>
        <input ref={eanRef} name="ean" required className={baseClass} />
        <div className="mt-2">
          <ScanButton onScan={(wert) => { if (eanRef.current) eanRef.current.value = wert; }} />
        </div>
      </div>

      <div>
        <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">Artikel-Name</label>
        <input name="artikel_name" className={baseClass} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">Menge *</label>
          <input name="menge" type="number" min={1} required className={baseClass} />
        </div>
        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">MHD</label>
          <input name="mhd" type="date" className={baseClass} />
        </div>
      </div>
    </div>
  );
}

export default function SendungForm({ brands, saveAction }: Props) {
  const router = useRouter();
  const trackingRef = useRef<HTMLInputElement>(null);
  const [zeilenIds, setZeilenIds] = useState<number[]>(() => [naechsteZeilenId++]);

  return (
    <form action={saveAction} className="space-y-6">
      <div>
        <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">DHL-Tracking-Nr.</label>
        <input ref={trackingRef} name="dhl_tracking_nr" className={baseClass} />
        <div className="mt-2">
          <ScanButton onScan={(wert) => { if (trackingRef.current) trackingRef.current.value = wert; }} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">Marke</label>
          <select name="brand_id" defaultValue="" className={baseClass}>
            <option value="">—</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">Standort</label>
          <input name="standort_id" defaultValue="alexa-berlin" className={baseClass} />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">
          Artikel in diesem Paket
        </p>
        {zeilenIds.map((id) => (
          <ArtikelZeile
            key={id}
            zeilenId={id}
            entfernbar={zeilenIds.length > 1}
            onEntfernen={() => setZeilenIds((prev) => prev.filter((z) => z !== id))}
          />
        ))}
        <button
          type="button"
          onClick={() => setZeilenIds((prev) => [...prev, naechsteZeilenId++])}
          className="px-4 py-2 border border-bronze/40 text-bronze text-xs font-mono hover:border-bronze transition-colors"
        >
          + Weiterer Artikel im selben Paket
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="px-6 py-3 bg-bronze text-green-dark text-sm font-semibold hover:bg-bronze-light transition-colors"
        >
          Erfassen →
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-stone-dark text-stone text-sm hover:border-bronze/40 hover:text-cream transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
