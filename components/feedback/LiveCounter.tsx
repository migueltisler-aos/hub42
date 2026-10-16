"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { LiveStats } from "@/lib/feedback";
import Celebration from "./Celebration";

const NEU_LADEN_MS = 5000;

export default function LiveCounter({ stats }: { stats: LiveStats }) {
  const router = useRouter();
  const vorher = useRef(stats.menschen);
  const [feier, setFeier] = useState(0);

  // Server-Daten alle paar Sekunden neu holen (Seite läuft unbeaufsichtigt auf einem Bildschirm)
  useEffect(() => {
    const t = setInterval(() => router.refresh(), NEU_LADEN_MS);
    return () => clearInterval(t);
  }, [router]);

  // neuer Mensch dazugekommen -> Konfetti
  useEffect(() => {
    if (stats.menschen > vorher.current) setFeier((n) => n + 1);
    vorher.current = stats.menschen;
  }, [stats.menschen]);

  const max = Math.max(1, ...stats.marken.map((m) => m.stimmen));

  return (
    <div className="relative max-w-5xl mx-auto min-h-[85vh] flex flex-col items-center justify-center text-center">
      {feier > 0 && <Celebration key={feier} />}

      <span className="stamp text-bronze mb-6 inline-block">Live vom Hub42-Stand</span>

      <AnimatePresence mode="popLayout">
        <motion.p
          key={stats.menschen}
          initial={{ y: 40, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="text-bronze leading-none tabular-nums text-[clamp(7rem,28vw,18rem)]"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {stats.menschen}
        </motion.p>
      </AnimatePresence>

      <h1
        className="text-cream tracking-widest text-[clamp(1.6rem,4.5vw,3.2rem)] leading-tight mt-2"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        {stats.menschen === 1 ? "Mensch hat" : "Menschen haben"} Startups mit ihrer Meinung geholfen
      </h1>

      <p className="text-stone text-sm sm:text-base font-mono mt-4">
        {stats.bewertungen} Stimmen · {stats.probiert} probiert · {stats.angeschaut} angeschaut
      </p>

      {stats.marken.length > 0 && (
        <div className="w-full max-w-2xl mt-12 space-y-2 text-left">
          {stats.marken.slice(0, 8).map((m) => (
            <div key={m.brand} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-cream text-sm">{m.brand}</span>
              <div className="flex-1 h-3 bg-green-mid rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-bronze"
                  initial={false}
                  animate={{ width: `${(m.stimmen / max) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <span className="w-10 text-right text-bronze font-mono text-sm tabular-nums">{m.stimmen}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-stone-dark text-xs font-mono uppercase tracking-widest mt-12">
        QR-Code scannen, probieren, Regler schieben
      </p>
    </div>
  );
}
