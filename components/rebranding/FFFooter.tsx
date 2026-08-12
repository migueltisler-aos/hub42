import Link from "next/link";

export default function FFFooter() {
  return (
    <footer className="bg-white border-t border-black mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <span
              className="text-2xl uppercase tracking-tight font-bold block mb-2"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Feedback Factory
            </span>
            <p className="text-sm mb-1">Neue Marken. Deine Meinung.</p>
            <address className="not-italic text-sm text-black/60 leading-relaxed mt-3">
              Alexa Berlin, Grunerstraße 20, 10179 Berlin<br />
              Mo bis Sa, 10 bis 20 Uhr
            </address>
          </div>

          <div>
            <h3 className="ff-eyebrow mb-4">Entdecken</h3>
            <ul className="space-y-2">
              {[
                { href: "/rebranding#marken", label: "Die Marken" },
                { href: "/rebranding#erlebnis", label: "Das Erlebnis" },
                { href: "/rebranding#store", label: "Der Store" },
                { href: "/rebranding/marken", label: "Für Marken" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-black/70 hover:text-black transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="ff-eyebrow mb-4">Betrieb &amp; Recht</h3>
            <p className="text-xs text-black/60 leading-relaxed mb-3">
              Die Feedback Factory ist die Ladenmarke am Alexanderplatz. Betrieben wird der
              Store von der Hub42 UG (haftungsbeschränkt).
            </p>
            <p className="text-xs text-black/60 leading-relaxed mb-4">
              Marktforschung in Kooperation mit dem Berliner Institut für Innovationsforschung
              GmbH (BIFI).
            </p>
            <ul className="space-y-2">
              {[
                { href: "/impressum", label: "Impressum" },
                { href: "/datenschutz", label: "Datenschutz" },
                { href: "/agb", label: "AGB" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-black/70 hover:text-black transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-black/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-xs text-black/60">
            © 2026 Hub42 UG (haftungsbeschränkt). Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-black/40">Interne Vorschau, noch nicht live.</p>
        </div>
      </div>
    </footer>
  );
}
