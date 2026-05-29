/* Section 11 – Kontakt. Server Component. */
export default function DeckKontakt() {
  const contacts = [
    { label: "E-Mail", value: "info@tryhub42.de", href: "mailto:info@tryhub42.de" },
    { label: "Telefon", value: "+49 177 87956437", href: "tel:+4917787956437" },
    { label: "Web", value: "tryhub42.de", href: "https://tryhub42.de" },
    { label: "Instagram", value: "@hub42berlin", href: "https://instagram.com/hub42berlin" },
  ];
  return (
    <div className="max-w-3xl">
      <p className="text-cream text-2xl md:text-3xl leading-snug mb-2" style={{ fontFamily: "var(--font-bebas)" }}>
        Miguel Tisler
      </p>
      <p className="text-bronze/70 text-sm font-mono tracking-wider uppercase mb-10">
        Gründer · Hub42 UG
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-cream/10">
        {contacts.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="bg-green-dark p-6 group hover:bg-green-mid/30 transition-colors"
          >
            <p className="text-stone text-xs font-mono uppercase tracking-widest mb-2">{c.label}</p>
            <p className="text-bronze text-lg group-hover:text-bronze-light transition-colors break-words">
              {c.value}
            </p>
          </a>
        ))}
      </div>

      <p className="text-cream/70 text-base leading-relaxed mt-10">
        Lass uns reden, welche eurer Marken zuerst ins Regal kommen –{" "}
        <span className="text-bronze">Eröffnung Oktober 2026, Alexa Berlin.</span>
      </p>
    </div>
  );
}
