"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QrScanner from "qr-scanner";

interface ScannerProduct {
  id: string;
  name: string;
  brand: string | null;
}

export default function ScannerClient({ products }: { products: ScannerProduct[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "active" | "error">("idle");
  const router = useRouter();

  useEffect(() => {
    if (!videoRef.current) return;

    let scanner: QrScanner | null = null;
    let cancelled = false;

    function handleDecoded(text: string) {
      try {
        const url = new URL(text, window.location.origin);
        router.push(url.pathname + url.search);
      } catch {
        if (text.startsWith("/")) router.push(text);
      }
    }

    QrScanner.hasCamera()
      .then((hasCamera) => {
        if (cancelled) return;
        if (!hasCamera) {
          setStatus("error");
          return;
        }
        scanner = new QrScanner(
          videoRef.current!,
          (result) => handleDecoded(typeof result === "string" ? result : result.data),
          { highlightScanRegion: true, highlightCodeOutline: true }
        );
        scanner
          .start()
          .then(() => !cancelled && setStatus("active"))
          .catch(() => !cancelled && setStatus("error"));
      })
      .catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto">
      <div className="relative bg-black aspect-square mb-4 overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {status !== "active" && (
          <div className="absolute inset-0 flex items-center justify-center text-cream text-sm px-6 text-center">
            {status === "error"
              ? "Kamera nicht verfügbar — nutze die Liste unten."
              : "Kamera wird gestartet …"}
          </div>
        )}
      </div>

      <p className="text-stone text-xs font-mono uppercase tracking-widest mb-3">
        Oder Produkt direkt wählen
      </p>
      <div className="space-y-2">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => router.push(`/feedback/r/${p.id}`)}
            className="w-full text-left bg-sage-warm text-green-dark px-4 py-3 text-sm hover:bg-cream-warm transition-colors"
          >
            {p.name}
            {p.brand && <span className="text-stone-dark"> · {p.brand}</span>}
          </button>
        ))}
        {products.length === 0 && (
          <p className="text-stone text-sm">Noch keine Produkte angelegt.</p>
        )}
      </div>
    </div>
  );
}
