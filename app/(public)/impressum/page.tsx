import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum der Hub42 UG (haftungsbeschränkt)",
};

export default function ImpressumPage() {
  return (
    <section className="bg-green-dark pt-32 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">Rechtliches</p>
        <h1
          className="text-cream text-5xl tracking-widest mb-12"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Impressum
        </h1>

        <div className="space-y-8 text-sm text-stone leading-relaxed">
          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">Angaben gemäß § 5 TMG</h2>
            <p>Hub42 UG (haftungsbeschränkt)<br />
            c/o Valuedfriends Innovation GmbH<br />
            Spreeinsel 6<br />
            15848 Beeskow<br />
            Deutschland</p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">Vertreten durch</h2>
            <p>Miguel Tisler (Geschäftsführer)</p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">Kontakt</h2>
            <p>
              E-Mail:{" "}
              <a href="mailto:info@tryhub42.de" className="text-bronze hover:underline">
                info@tryhub42.de
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">Handelsregister</h2>
            <p>
              Registergericht: Amtsgericht Frankfurt (Oder)<br />
              Registernummer: HRB 22313 FF
            </p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">Umsatzsteuer-ID</h2>
            <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE462857401</p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)</h2>
            <p>Miguel Tisler<br />
            c/o Valuedfriends Innovation GmbH<br />
            Spreeinsel 6<br />
            15848 Beeskow</p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">Haftungsausschluss</h2>
            <p>
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir
              jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.
              1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
              verantwortlich.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
