"use client";

import { motion } from "framer-motion";

const PARTICLES = ["🎉", "✨", "⭐", "🎉", "✨", "⭐", "🎉", "✨", "⭐", "🎉", "✨", "⭐"];

export default function Celebration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PARTICLES.map((emoji, i) => {
        const angle = (i / PARTICLES.length) * Math.PI * 2;
        const distance = 90 + (i % 3) * 30;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 text-xl"
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.5, rotate: 0 }}
            animate={{
              opacity: 0,
              x,
              y,
              scale: 1,
              rotate: (i % 2 ? 1 : -1) * 180,
            }}
            transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.02 }}
          >
            {emoji}
          </motion.span>
        );
      })}
    </div>
  );
}
