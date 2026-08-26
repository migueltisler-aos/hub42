/**
 * Flächen und Struktur für die internen Werkbank-Seiten.
 *
 * Bewusst ohne "use client": diese Bausteine rendern nur Markup und sollen
 * nicht im Client-Bundle landen. Interaktives (Formulare, Buttons mit
 * Pending-State) liegt in ./form.tsx.
 *
 * Leitbild "Feldregister": Seite = dunkler Grund mit Bronze-Raster,
 * Panel = halbtransparente Arbeitsfläche mit Haarlinie, Card = helle
 * Karteikarte mit Eckwinkeln (.field-card aus globals.css).
 */

import Link from "next/link";

/* ── Typo-Bausteine ─────────────────────────────────────────────────────── */

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-bronze text-[10px] font-mono tracking-[0.3em] uppercase">{children}</p>
  );
}

/**
 * Bebas ist der Seitentitel-Font — absichtlich nur hier und in SectionHead,
 * damit Überschriften wieder Gewicht haben.
 */
export function Title({
  children,
  size = "lg",
}: {
  children: React.ReactNode;
  size?: "lg" | "md";
}) {
  return (
    <h1
      className={`text-cream tracking-widest ${size === "lg" ? "text-4xl sm:text-5xl" : "text-3xl"}`}
      style={{ fontFamily: "var(--font-bebas)" }}
    >
      {children}
    </h1>
  );
}

/** Maschinendaten: Codes, n =, IDs, Zahlen. Nie für Formular-Labels. */
export function Mono({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`font-mono text-xs ${className}`}>{children}</span>;
}

export function Stamp({
  children,
  tone = "bronze",
  tilt = false,
  className = "",
}: {
  children: React.ReactNode;
  tone?: "bronze" | "stone" | "gut" | "warn" | "aus";
  tilt?: boolean;
  className?: string;
}) {
  const TONE = {
    bronze: "text-bronze",
    stone: "text-stone",
    gut: "text-emerald-400",
    warn: "text-amber-300",
    aus: "text-stone/40",
  } as const;
  return (
    <span className={`${tilt ? "stamp" : "stamp-flat"} ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}

/* ── Seitenrahmen ───────────────────────────────────────────────────────── */

export function PageShell({
  eyebrow,
  title,
  lead,
  back,
  actions,
  breit = false,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  /** breit = Listen/Tabellen (max-w-6xl), sonst Formularspalte (max-w-3xl) */
  breit?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-green-dark">
      <div className="markthalle-pattern">
        <div className={`${breit ? "max-w-6xl" : "max-w-3xl"} mx-auto px-4 sm:px-6 py-8 sm:py-10`}>
          <header className="mb-8">
            {back && (
              <Link
                href={back.href}
                className="inline-flex items-center gap-1.5 text-stone text-xs hover:text-bronze transition-colors mb-3"
              >
                <span aria-hidden>←</span> {back.label}
              </Link>
            )}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {eyebrow && <div className="mb-1.5">{<Eyebrow>{eyebrow}</Eyebrow>}</div>}
                <Title>{title}</Title>
                {lead && (
                  <p className="text-stone text-sm mt-2 max-w-2xl leading-relaxed">{lead}</p>
                )}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Arbeitsfläche auf dunklem Grund — für Formulare und Werkzeuge. */
export function Panel({
  title,
  nummer,
  hinweis,
  actions,
  children,
  className = "",
}: {
  title?: string;
  /** Laufende Nummer im Register ("01"), rein typografisches Ordnungssignal. */
  nummer?: string;
  hinweis?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-green-mid/25 border hairline rounded-sm ${className}`}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b hairline">
          <div>
            <div className="flex items-baseline gap-2.5">
              {nummer && (
                <span className="text-bronze/45 text-xs font-mono tabular-nums">{nummer}</span>
              )}
              {title && (
                <h2
                  className="text-cream text-xl tracking-wide"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {title}
                </h2>
              )}
            </div>
            {hinweis && <p className="text-stone text-xs mt-1.5 leading-relaxed">{hinweis}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </section>
  );
}

/** Helle Karteikarte — für Datensätze, die man „in die Hand nimmt“. */
export function Card({
  children,
  className = "",
  linien = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  /** Lineatur wie auf einer Karteikarte */
  linien?: boolean;
  /** Sprungziel für Deep-Links wie /results#<produkt-id> */
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`field-card bg-sage-warm rounded-sm ${linien ? "index-lines" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHead({
  children,
  actions,
  className = "",
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 mb-3 ${className}`}>
      <h2 className="text-cream text-lg tracking-wide" style={{ fontFamily: "var(--font-bebas)" }}>
        {children}
      </h2>
      {actions}
    </div>
  );
}

export function StatTile({
  label,
  value,
  note,
  tone = "normal",
}: {
  label: string;
  value: string | number;
  note?: string;
  tone?: "normal" | "schwach";
}) {
  return (
    <Card className="px-4 py-3">
      <p className="text-stone-dark text-[10px] font-mono uppercase tracking-[0.16em]">{label}</p>
      <p
        className={`text-3xl tabular-nums leading-tight mt-0.5 ${
          tone === "schwach" ? "text-stone-dark/60" : "text-green-dark"
        }`}
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        {value}
      </p>
      {note && <p className="text-stone-dark text-[11px] mt-0.5 leading-snug">{note}</p>}
    </Card>
  );
}

export function EmptyState({
  titel,
  text,
  action,
}: {
  titel: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed hairline rounded-sm px-6 py-10 text-center">
      <p className="text-cream text-sm">{titel}</p>
      {text && <p className="text-stone text-xs mt-1.5 max-w-md mx-auto leading-relaxed">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Warnblock — z.B. für den PII-Hinweis auf der Leads-Seite. */
export function NoteBox({
  tone = "warn",
  children,
}: {
  tone?: "warn" | "info";
  children: React.ReactNode;
}) {
  const stil =
    tone === "warn"
      ? "border-amber-500/35 bg-amber-500/[0.07] text-amber-200/90"
      : "border-bronze/25 bg-bronze/[0.06] text-stone";
  return (
    <div className={`border rounded-sm px-4 py-3 text-xs leading-relaxed ${stil}`}>{children}</div>
  );
}
