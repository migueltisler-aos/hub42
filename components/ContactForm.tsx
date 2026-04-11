"use client";

import { useState } from "react";

type FormState = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [form, setForm] = useState({
    name: "",
    email: "",
    brand: "",
    typ: "Hersteller",
    nachricht: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Pflichtfeld";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Gültige E-Mail erforderlich";
    if (!form.nachricht.trim()) e.nachricht = "Pflichtfeld";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setState("sending");
    await new Promise((r) => setTimeout(r, 1200));
    setState("success");
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  if (state === "success") {
    return (
      <div className="bg-green-mid border border-green-light/40 rounded-sm p-10 text-center">
        <p className="text-green-light text-4xl mb-4" style={{ fontFamily: "var(--font-bebas)" }}>
          Nachricht gesendet!
        </p>
        <p className="text-cream text-sm">
          Wir melden uns innerhalb von 1–2 Werktagen bei dir.
        </p>
      </div>
    );
  }

  const inputClass = (field: keyof typeof errors) =>
    `w-full bg-green-dark border rounded-sm px-4 py-3 text-cream text-sm outline-none focus:border-bronze transition-colors ${
      errors[field] ? "border-red-400" : "border-stone-dark"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5" id="slot-anfragen">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Name */}
        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-2">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Max Mustermann"
            className={inputClass("name")}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-2">
            E-Mail *
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="max@example.de"
            className={inputClass("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-2">
          Brand / Unternehmen
        </label>
        <input
          type="text"
          name="brand"
          value={form.brand}
          onChange={handleChange}
          placeholder="Deine Brand GmbH"
          className={inputClass("brand")}
        />
      </div>

      {/* Typ */}
      <div>
        <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-2">
          Ich bin
        </label>
        <select
          name="typ"
          value={form.typ}
          onChange={handleChange}
          className="w-full bg-green-dark border border-stone-dark rounded-sm px-4 py-3 text-cream text-sm outline-none focus:border-bronze transition-colors"
        >
          <option>Hersteller</option>
          <option>Scout</option>
          <option>Presse</option>
          <option>Sonstiges</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-2">
          Nachricht *
        </label>
        <textarea
          name="nachricht"
          value={form.nachricht}
          onChange={handleChange}
          rows={5}
          placeholder="Erzähl uns von deiner Brand und was du dir vorstellst..."
          className={`${inputClass("nachricht")} resize-none`}
          aria-invalid={!!errors.nachricht}
        />
        {errors.nachricht && (
          <p className="text-red-400 text-xs mt-1">{errors.nachricht}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full py-4 bg-bronze text-green-dark font-semibold rounded-sm hover:bg-bronze-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
      >
        {state === "sending" ? "Wird gesendet…" : "Nachricht senden →"}
      </button>

      <p className="text-stone text-xs text-center">
        Oder direkt per E-Mail:{" "}
        <a href="mailto:info@tryhub42.de" className="text-bronze hover:underline">
          info@tryhub42.de
        </a>
      </p>
    </form>
  );
}
