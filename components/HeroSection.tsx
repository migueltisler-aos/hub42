"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";

function fadeUp(delay: number): Variants {
  return {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay, ease: "easeOut" },
    },
  };
}

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen bg-green-dark flex flex-col items-center justify-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Warehouse grid */}
      <div className="absolute inset-0 markthalle-pattern opacity-60" />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200,150,74,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Industrial corner decorations */}
      <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-bronze/30" />
      <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-bronze/30" />
      <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-bronze/30" />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-bronze/30" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-20">
        {/* Eyebrow */}
        <motion.p
          className="text-bronze/60 text-xs font-mono tracking-[0.3em] uppercase mb-8"
          variants={fadeUp(0)}
          initial="hidden"
          animate="visible"
        >
          Alexa Berlin · Alexanderplatz
        </motion.p>

        {/* Wordmark */}
        <motion.h1
          className="text-bronze text-[clamp(5rem,18vw,14rem)] leading-none tracking-wider mb-6"
          style={{ fontFamily: "var(--font-bebas)" }}
          variants={fadeUp(0.15)}
          initial="hidden"
          animate="visible"
          aria-label="Hub42"
        >
          HUB42
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-cream text-xl md:text-3xl leading-tight tracking-wide mb-4 max-w-2xl mx-auto"
          style={{ fontFamily: "var(--font-bebas)" }}
          variants={fadeUp(0.3)}
          initial="hidden"
          animate="visible"
        >
          Brands die du noch nicht kennst –
          <br />
          <span className="text-bronze">aber nicht mehr missen wirst.</span>
        </motion.p>

        {/* Sub-tagline */}
        <motion.p
          className="text-cream/50 text-sm md:text-base max-w-md mx-auto leading-relaxed mb-12"
          variants={fadeUp(0.45)}
          initial="hidden"
          animate="visible"
        >
          Direkt vom Hersteller. Zum ersten Mal probieren.
          <br />
          Im Alexa Berlin – Alexanderplatz.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          variants={fadeUp(0.6)}
          initial="hidden"
          animate="visible"
        >
          <Link
            href="/brands"
            className="inline-flex items-center justify-center px-8 py-4 bg-bronze text-green-dark font-semibold text-sm tracking-wide hover:bg-bronze-light transition-colors rounded-sm"
          >
            Brands entdecken →
          </Link>
          <Link
            href="/hersteller"
            className="inline-flex items-center justify-center px-8 py-4 border border-bronze/40 text-bronze font-semibold text-sm tracking-wide hover:bg-bronze/10 transition-colors rounded-sm"
          >
            Ich bin Hersteller →
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="mt-20 flex flex-col items-center gap-2"
          variants={fadeUp(0.9)}
          initial="hidden"
          animate="visible"
        >
          <span className="text-cream/30 text-xs font-mono tracking-widest uppercase">
            Scroll
          </span>
          <motion.div
            className="w-px h-8 bg-bronze/30"
            animate={{ scaleY: [1, 0.3, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </section>
  );
}
