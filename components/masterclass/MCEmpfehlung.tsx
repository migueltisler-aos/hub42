"use client";

import { useState } from "react";

export default function MCEmpfehlung() {
  const [name, setName] = useState("");
  const [empfehlung, setEmpfehlung] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!empfehlung.trim()) return;
    const subject = encodeURIComponent(
      `Marken-Empfehlung${name.trim() ? ` von ${name.trim()}` : ""} · Masterclass`
    );
    const body = encodeURIComponent(
      `${name.trim() ? `Von: ${name.trim()}\n\n` : ""}Empfehlung:\n${empfehlung.trim()}`
    );
    window.location.href = `mailto:info@tryhub42.de?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div className="max-w-2xl">
      {/* Persönlicher Einstieg */}
      <p className="text-cream/80 text-base md:text-lg leading-relaxed mb-8">
        Das Konzept überzeugt mich. Das Kritische ist,{" "}
        <span className="text-cream">die ersten Marken zu gewinnen</span> – Marken,
        die das Modell mit Leben füllen und von denen wir gemeinsam lernen können.
      </p>

      <p className="text-stone text-sm leading-relaxed mb-10 max-w-xl">
        Ich suche unabhängige Hersteller mit gutem Produkt und echter Geschichte –
        Food, Getränke, Feinkost, Kosmetik, Spezialitäten. Jemanden, der einen
        fairen Marktzugang verdient und bereit ist, ihn zu testen.
        <br /><br />
        Wenn du jemanden kennst: eine kurze Nachricht reicht.
      </p>

      {/* Formular */}
      {sent ? (
        <div className="border border-bronze/40 bg-green-mid/30 p-6 md:p-8">
          <p className="text-bronze font-mono text-sm tracking-widest uppercase mb-2">
            Danke.
          </p>
          <p className="text-cream/70 text-sm">
            Deine Empfehlung ist unterwegs. Ich melde mich direkt.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Dein Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Anna Müller"
              className="w-full bg-green-dark border border-stone-dark text-cream px-4 py-3 text-sm font-mono focus:outline-none focus:border-bronze placeholder:text-stone/30"
            />
          </div>

          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Deine Empfehlung *
            </label>
            <textarea
              value={empfehlung}
              onChange={(e) => setEmpfehlung(e.target.value)}
              rows={5}
              required
              placeholder={"Markenname, kurze Beschreibung, warum die passen würden – oder einfach ein Name und eine Kontaktmöglichkeit."}
              className="w-full bg-green-dark border border-stone-dark text-cream px-4 py-3 text-sm font-mono focus:outline-none focus:border-bronze resize-none placeholder:text-stone/30"
            />
          </div>

          <button
            type="submit"
            disabled={!empfehlung.trim()}
            className="px-8 py-4 bg-bronze text-green-dark text-sm font-mono font-semibold tracking-widest uppercase hover:bg-bronze-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Empfehlung senden →
          </button>

          <p className="text-stone/40 text-xs font-mono mt-2">
            Öffnet dein E-Mail-Programm. Keine Daten werden gespeichert.
          </p>
        </form>
      )}

      {/* Direktkontakt */}
      <div className="mt-10 pt-8 border-t border-stone-dark/50">
        <p className="text-stone text-xs font-mono uppercase tracking-widest mb-4">
          Oder direkt
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-cream/10">
          {[
            { label: "E-Mail", value: "info@tryhub42.de", href: "mailto:info@tryhub42.de" },
            { label: "WhatsApp", value: "+49 177 879 564 37", href: "https://wa.me/4917787956437?text=Hallo%20Miguel%2C%20ich%20habe%20eine%20Marken-Empfehlung%20f%C3%BCr%20Hub42." },
          ].map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="bg-green-dark p-5 group hover:bg-green-mid/30 transition-colors"
            >
              <p className="text-stone text-xs font-mono uppercase tracking-widest mb-1">{c.label}</p>
              <p className="text-bronze text-base group-hover:text-bronze-light transition-colors">
                {c.value}
              </p>
            </a>
          ))}
        </div>
        <p className="text-stone/50 text-xs font-mono mt-4">
          Miguel Tisler · Gründer Hub42 UG
        </p>
      </div>
    </div>
  );
}
