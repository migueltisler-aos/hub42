import type { Metadata } from "next";
import Link from "next/link";
import { TestkaufhausLink } from "@/components/TestkaufhausLink";

export const metadata: Metadata = {
  title: "Über uns – Warum Hub42",
  description:
    "Wir planen, bauen und betreiben stationäre Verkaufsflächen für Produktneuheiten, junge Marken und neue Handelskonzepte.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero – Persönliche Einleitung */}
      <section className="bg-green-dark pt-32 pb-20 border-b border-stone-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Warum Hub42
          </p>
          <h1
            className="text-cream text-[clamp(2.5rem,7vw,6rem)] leading-none tracking-widest mb-10"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Das Marketing-Problem
            <br />
            <span className="text-bronze">lässt sich nicht mit mehr Marketing lösen.</span>
          </h1>

          {/* Video – Miguel erklärt Hub42 */}
          <div className="mb-10">
            <p className="text-bronze/60 text-xs font-mono tracking-[0.2em] uppercase mb-3">
              Miguel erklärt Hub42
            </p>
            <div className="aspect-video w-full overflow-hidden rounded-sm border border-stone-dark">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/ghvqFMl3roE"
                title="Miguel Tisler erklärt Hub42"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>

          {/* Miguel-Zitat */}
          <blockquote className="border-l-4 border-bronze pl-6 mb-10">
            <p className="text-cream text-base md:text-lg leading-relaxed mb-4">
              Ich komme aus der Logistik. 3PL, Omnichannel, Fulfillment — ich kenne das System von innen.
            </p>
            <p className="text-stone text-base leading-relaxed mb-4">
              Was ich dort gelernt habe: Die Marketing-Kosten steigen jedes Jahr. CAC explodiert.
              Und am Ende fließt der Großteil des Budgets an drei Plattformen — Amazon, Google, Meta —
              statt dorthin wo der echte Wert entsteht: beim Hersteller.
            </p>
            <p className="text-stone text-base leading-relaxed mb-4">
              Das System ist nicht kaputt. Es ist für die Falschen optimiert. Wer das größte
              Marketing-Budget hat, kommt ins Regal. Wer Margen zugunsten von Listungsgebühren
              opfert, kommt ins Regal. Wer Lebensmittelzusätze einsetzt die Haltbarkeit und Marge
              erhöhen statt Geschmack — kommt ins Regal. Wer ein wirklich gutes Produkt macht,
              nicht unbedingt.
            </p>
            <p className="text-cream text-base leading-relaxed">
              Die Frage die mich nicht losgelassen hat: Wie löst man das cleverer — ohne das
              Marketing abzuschaffen, aber ohne es zur Eintrittskarte zu machen?
            </p>
            <footer className="mt-6 flex flex-wrap gap-x-5 gap-y-2 items-center">
              <span className="text-bronze text-xs font-mono tracking-[0.2em] uppercase">
                Miguel Tisler · Gründer
              </span>
              <a href="tel:+4917787956437" className="text-bronze/70 hover:text-bronze text-xs font-mono transition-colors">
                0177 879 56 37
              </a>
              <a href="mailto:info@tryhub42.de" className="text-bronze/70 hover:text-bronze text-xs font-mono transition-colors">
                info@tryhub42.de
              </a>
              <a
                href="https://www.linkedin.com/in/miguel-tisler-0a2976120/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-bronze/70 hover:text-bronze text-xs font-mono transition-colors"
              >
                LinkedIn →
              </a>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Wer wir sind, was wir tun: Text des Teams, abgenommen 2026-10-30
          (copy-v1, Block „/about“), wortgleich. Ersetzt den Business-Plan-Text.
          Fließtext in Weiß: auf green-mid trägt nur Weiß AA (4,9:1), Stone
          läge bei 2:1 und Cream knapp unter 4,5:1. */}
      <section className="bg-green-mid py-20 border-b border-stone-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8 text-base leading-relaxed text-white">
          <h2
            className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Hub42:
            <br />
            Betreiber und Umsetzungspartner für neue Handelskonzepte
          </h2>

          <p className="text-lg md:text-xl">
            Wir planen, bauen und betreiben stationäre Verkaufsflächen für Produktneuheiten, junge
            Marken und neue Handelskonzepte.
          </p>

          <p>
            Wir begleiten Unternehmen, Institutionen und Immobilieneigentümer von der ersten Idee bis
            zum laufenden Betrieb. Wir entwickeln das passende Store-Konzept, planen Fläche und
            Sortiment, gewinnen und betreuen Marken, richten die Verkaufsfläche ein, gestalten sie und
            steuern den täglichen Betrieb.
          </p>

          <p>
            Wir bringen klassisches Handelswissen mit neuen Methoden aus Einzelhandel,
            Markenentwicklung und Marktforschung zusammen. Denn ein Geschäft ist nicht nur ein Ort zum
            Verkaufen. Es ist auch Treffpunkt, Ort zum Ausprobieren und Raum für den direkten Kontakt
            zwischen Marken und Kundschaft.
          </p>

          <p>
            Je nach Projekt übernehmen wir als Betreiber die gesamte operative Verantwortung. Oder wir
            unterstützen Partner als Konzept- und Umsetzungspartner in einzelnen Projektphasen und
            Aufgaben.
          </p>

          {/* Das Ziel hervorgehoben, wie zuvor der „dritte Weg“ */}
          <div className="border-l-4 border-bronze bg-bronze/5 pl-6 py-4">
            <p>
              Unser Ziel: aus Handelsflächen funktionierende Geschäftsmodelle machen, mit passendem
              Sortiment, einem Einkaufserlebnis, das überzeugt, und einem Betrieb, der sich
              wirtschaftlich trägt.
            </p>
          </div>

          <p>
            Mit dem Berliner Institut für Innovationsforschung (BIFI) bringen wir stationären Handel
            und wissenschaftliche Marktforschung in einem gemeinsamen Konzept zusammen. Das BIFI
            verantwortet die wissenschaftliche Leitung, die Methodik und den Bericht. Erprobt ist die
            Methodik im Pilot 2018 des BIFI. Dazu gehören strukturierte Erhebungsebenen wie Feedback
            per QR-Code, demografische Profile der Kundschaft, Interviews im Laden und die
            datenbasierte Auswertung des Kaufverhaltens. Das erste gemeinsame Format ist das
            Testkaufhaus im Alexa Berlin, Eröffnung am 28.03.2027 (
            <TestkaufhausLink className="underline underline-offset-4 decoration-bronze hover:text-cream" />
            ).
          </p>

          <p>
            Diese Verbindung aus echtem Laden und wissenschaftlicher Begleitung bietet weder ein
            reiner Onlineshop noch ein Pop-up-Store. Mit der Auswertung des BIFI sehen junge
            Online-Marken nicht nur, <em>dass</em> sich ihr Produkt verkauft. Sie erfahren auch,{" "}
            <em>wie</em> es bei der Kundschaft ankommt, wie Geschmack und Optik im Detail bewertet
            werden und warum die Leute es kaufen.
          </p>

          <p>
            Marken können neue Produkte am Markt testen, Preisschwellen ermitteln und
            Marktforschungsdaten erheben lassen, während ihr Produkt regulär verkauft wird, zu fairen
            Konditionen statt harter Margen.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-dark py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Jetzt starten
          </p>
          <h2
            className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest mb-6"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Dein Produkt gehört ins Regal.
            <br />
            <span className="text-bronze">Nicht ins Werbebudget.</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#bewerben"
              className="inline-flex items-center justify-center px-8 py-4 bg-bronze text-green-dark font-semibold text-sm tracking-wide hover:bg-bronze-light transition-colors rounded-sm"
            >
              Jetzt bewerben →
            </Link>
            <Link
              href="/hersteller"
              className="inline-flex items-center justify-center px-8 py-4 border border-bronze/40 text-bronze font-semibold text-sm tracking-wide hover:bg-bronze/10 transition-colors rounded-sm"
            >
              Wie es funktioniert
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
