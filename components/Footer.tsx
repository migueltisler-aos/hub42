import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-green-muted border-t border-stone-dark mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <span
              className="text-bronze text-4xl tracking-widest block mb-2"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              HUB42
            </span>
            <p className="text-cream text-sm mb-1">The Store You Have To Solve.</p>
            <p className="text-stone text-sm mb-1">Where consumer brands are born.</p>
            <p className="text-stone text-sm mb-4">42 ist die Antwort auf alles.</p>
            <address className="not-italic text-stone text-xs leading-relaxed">
              Alexa Berlin · Grunerstraße 20 · 10179 Berlin<br />
              Mo–Sa 10–20 Uhr
            </address>
            <a
              href="mailto:info@tryhub42.de"
              className="text-bronze text-xs mt-1 block hover:underline"
            >
              info@tryhub42.de
            </a>
          </div>

          {/* Entdecken */}
          <div>
            <h3
              className="text-bronze text-lg tracking-widest mb-4"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Entdecken
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/hersteller", label: "Für Hersteller" },
                { href: "/erlebnis", label: "Das Erlebnis" },
                { href: "/brands", label: "Unsere Brands" },
                { href: "/store", label: "Der Store" },
                { href: "/kontakt", label: "Kontakt" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone text-sm hover:text-bronze transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h3
              className="text-bronze text-lg tracking-widest mb-4"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Rechtliches
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/impressum", label: "Impressum" },
                { href: "/datenschutz", label: "Datenschutz" },
                { href: "/agb", label: "AGB" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone text-sm hover:text-bronze transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <h3
                className="text-bronze text-lg tracking-widest mb-3"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Social
              </h3>
              <a
                href="https://instagram.com/hub42berlin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone text-sm hover:text-bronze transition-colors"
              >
                @hub42berlin
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-stone text-xs">© 2026 Hub42 GmbH · Alle Rechte vorbehalten</p>
          <p className="text-stone text-xs font-mono">Eröffnung Oktober 2026 · Alexa Berlin</p>
        </div>
      </div>
    </footer>
  );
}
