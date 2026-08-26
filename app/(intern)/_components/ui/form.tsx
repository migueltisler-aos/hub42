"use client";

/**
 * Eingabe-Bausteine für die internen Werkbank-Seiten.
 *
 * Ersetzt die rund vierzig handkopierten Label-Input-Paare im Feedback-Studio.
 * Drei Dinge, die die alten Formulare nicht hatten und die hier zentral
 * festgelegt sind: Mindesthöhe 44px (das Admin wird im Store am Handy/Tablet
 * bedient), ein sichtbarer Fokusring, und ein Fehlerzustand, der am Feld hängt.
 *
 * Labels sind bewusst DM Sans und nicht Mono-Uppercase — Mono bleibt den
 * Maschinendaten vorbehalten, sonst schreit die ganze Seite gleich laut.
 */

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import type { ActionState } from "@/lib/action-state";

/* ── Feldrahmen ─────────────────────────────────────────────────────────── */

export function Field({
  label,
  htmlFor,
  hinweis,
  fehler,
  pflicht,
  className = "",
  children,
}: {
  label: string;
  htmlFor?: string;
  /** Kurze Erklärung UNTER dem Label — nicht im Label selbst. */
  hinweis?: React.ReactNode;
  fehler?: string;
  pflicht?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-cream text-sm font-medium">
        {label}
        {pflicht && <span className="text-bronze ml-1" aria-hidden>*</span>}
      </label>
      {hinweis && <p className="text-stone text-xs mt-0.5 leading-relaxed">{hinweis}</p>}
      <div className="mt-1.5">{children}</div>
      {fehler && (
        <p className="text-amber-300 text-xs mt-1 flex items-center gap-1" role="alert">
          <TriangleAlert size={12} aria-hidden /> {fehler}
        </p>
      )}
    </div>
  );
}

const BASIS =
  "w-full min-h-11 bg-green-dark/70 border rounded-sm text-cream text-sm px-3 py-2.5 " +
  "placeholder:text-stone/45 transition-colors outline-none " +
  "focus-visible:border-bronze focus-visible:ring-2 focus-visible:ring-bronze/35";

function rahmen(fehlerhaft?: boolean) {
  return fehlerhaft ? "border-amber-400/70" : "border-stone-dark/70 hover:border-stone-dark";
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { fehlerhaft?: boolean };

export function TextInput({ fehlerhaft, className = "", ...props }: InputProps) {
  return <input {...props} className={`${BASIS} ${rahmen(fehlerhaft)} ${className}`} />;
}

export function NumberInput({ fehlerhaft, className = "", ...props }: InputProps) {
  return (
    <input
      type="number"
      inputMode="numeric"
      {...props}
      className={`${BASIS} ${rahmen(fehlerhaft)} font-mono tabular-nums ${className}`}
    />
  );
}

export function Textarea({
  fehlerhaft,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { fehlerhaft?: boolean }) {
  return (
    <textarea
      {...props}
      className={`${BASIS} ${rahmen(fehlerhaft)} resize-y leading-relaxed ${className}`}
    />
  );
}

export function Select({
  fehlerhaft,
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { fehlerhaft?: boolean }) {
  return (
    <select {...props} className={`${BASIS} ${rahmen(fehlerhaft)} pr-8 ${className}`}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  hinweis,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hinweis?: string }) {
  return (
    <label
      className={`flex items-start gap-2.5 bg-green-dark/50 border border-stone-dark/60 rounded-sm px-3 py-2.5 cursor-pointer hover:border-bronze/50 transition-colors has-checked:border-bronze/70 has-checked:bg-bronze/[0.07] ${className}`}
    >
      <input type="checkbox" {...props} className="accent-bronze mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">
        <span className="text-cream text-sm block leading-snug">{label}</span>
        {hinweis && <span className="text-stone text-xs block mt-0.5 leading-snug">{hinweis}</span>}
      </span>
    </label>
  );
}

/**
 * Große Auswahlkacheln statt <select> — für kurze, sich ausschließende
 * Optionen (Fragetyp, Spielergebnis). Am Handy deutlich treffsicherer.
 */
export function TapChoice<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name?: string;
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string; hinweis?: string }[];
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length > 2 ? 1 : options.length}, minmax(0, 1fr))` }}>
      {name && <input type="hidden" name={name} value={value} />}
      {options.map((o) => {
        const aktiv = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={aktiv}
            className={`text-left rounded-sm border px-3 py-2.5 min-h-11 transition-colors ${
              aktiv
                ? "border-bronze bg-bronze/15 text-cream"
                : "border-stone-dark/60 text-stone hover:border-bronze/50 hover:text-cream"
            }`}
          >
            <span className="text-sm block leading-snug">{o.label}</span>
            {o.hinweis && (
              <span className="text-xs block mt-0.5 leading-snug text-stone/80">{o.hinweis}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Buttons ────────────────────────────────────────────────────────────── */

type Variante = "primary" | "ghost" | "danger" | "quiet";

const VARIANTE: Record<Variante, string> = {
  primary: "bg-bronze text-green-dark font-semibold hover:bg-bronze-light",
  ghost: "border border-bronze/40 text-bronze hover:border-bronze hover:bg-bronze/10",
  danger: "border border-red-400/35 text-red-300/90 hover:border-red-400/70 hover:bg-red-500/10",
  quiet: "text-stone hover:text-cream",
};

export function Button({
  variante = "primary",
  klein = false,
  icon: Icon,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  klein?: boolean;
  icon?: React.ComponentType<{ size?: number }>;
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
        klein ? "text-xs px-2.5 py-1.5 min-h-8" : "text-sm px-5 py-2.5 min-h-11"
      } ${VARIANTE[variante]} ${className}`}
    >
      {Icon && <Icon size={klein ? 13 : 15} />}
      {children}
    </button>
  );
}

/** Absende-Button mit Pending-State aus dem umgebenden <form>. */
export function SubmitButton({
  children = "Speichern",
  variante = "primary",
  klein = false,
  icon,
  className = "",
}: {
  children?: React.ReactNode;
  variante?: Variante;
  klein?: boolean;
  icon?: React.ComponentType<{ size?: number }>;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variante={variante}
      klein={klein}
      icon={pending ? undefined : icon}
      disabled={pending}
      className={className}
    >
      {pending && <Loader2 size={klein ? 13 : 15} className="animate-spin" />}
      {children}
    </Button>
  );
}

/**
 * Aktion, die etwas unwiederbringlich verändert (löschen, archivieren).
 * Fragt einmal nach, statt es kommentarlos zu tun.
 */
export function ConfirmSubmit({
  frage,
  children,
  variante = "danger",
  icon,
}: {
  frage: string;
  children: React.ReactNode;
  variante?: Variante;
  icon?: React.ComponentType<{ size?: number }>;
}) {
  const { pending } = useFormStatus();
  const [gefragt, setGefragt] = useState(false);

  useEffect(() => {
    if (!gefragt) return;
    const t = setTimeout(() => setGefragt(false), 4000);
    return () => clearTimeout(t);
  }, [gefragt]);

  if (!gefragt) {
    return (
      <Button
        type="button"
        variante={variante}
        klein
        icon={icon}
        onClick={() => setGefragt(true)}
      >
        {children}
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-amber-300 text-xs">{frage}</span>
      <Button type="submit" variante="danger" klein disabled={pending}>
        {pending && <Loader2 size={13} className="animate-spin" />}
        Ja
      </Button>
      <Button type="button" variante="quiet" klein onClick={() => setGefragt(false)}>
        Abbrechen
      </Button>
    </span>
  );
}

/* ── Rückmeldung ────────────────────────────────────────────────────────── */

/**
 * Erfolgs-/Fehlermeldung zu einem `useActionState`-Ergebnis. Erfolg blendet
 * sich nach vier Sekunden aus, Fehler bleibt stehen, bis erneut abgeschickt wird.
 */
export function Flash({ state }: { state: ActionState | null }) {
  // Sichtbarkeit wird aus dem State abgeleitet, nicht gespiegelt: gemerkt wird
  // nur, welcher Stempel schon weggeblendet wurde. Ein neues Ergebnis hat einen
  // neuen Stempel und ist damit automatisch wieder sichtbar.
  const [ausgeblendet, setAusgeblendet] = useState<number | null>(null);
  const sichtbar = Boolean(state?.message) && ausgeblendet !== (state?.stamp ?? null);

  useEffect(() => {
    // Nur Erfolg blendet von allein weg; ein Fehler bleibt stehen, bis der
    // Nutzer erneut abschickt.
    if (!state?.ok || !state.message) return;
    const stamp = state.stamp ?? null;
    const t = setTimeout(() => setAusgeblendet(stamp), 4000);
    return () => clearTimeout(t);
  }, [state?.ok, state?.message, state?.stamp]);

  return (
    <div aria-live="polite" className="min-h-0">
      <AnimatePresence>
        {sichtbar && state?.message && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className={`flex items-center gap-1.5 text-xs mb-3 ${
              state.ok ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {state.ok ? <Check size={13} aria-hidden /> : <TriangleAlert size={13} aria-hidden />}
            {state.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
