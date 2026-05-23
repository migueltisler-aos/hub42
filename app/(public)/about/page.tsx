import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Über uns – Warum Hub42",
  description:
    "Hub42 sorgt dafür, dass nicht der lauteste, sondern das beste Angebot sich durchsetzt. Die Geschichte dahinter.",
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
            <footer className="mt-6 text-bronze text-xs font-mono tracking-[0.2em] uppercase">
              Miguel Tisler · Gründer · ehem. 3PL / Omnichannel Logistik
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Einleitung – Business Plan Text */}
      <section className="bg-green-mid py-20 border-b border-stone-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8 text-base leading-relaxed">

          <p className="text-stone">
            Hub42 sorgt dafür, dass{" "}
            <strong className="text-cream">
              nicht der lauteste, sondern das beste Angebot sich durchsetzt.
            </strong>{" "}
            Denn unabhängige Hersteller stehen heute zwischen zwei Systemen, die beide gegen sie
            arbeiten: Im klassischen Handel entscheiden Listungsgebühren, Handelsmargen,
            Volumenanforderungen und Verhandlungsmacht darüber, was sichtbar wird. Nicht zwingend
            das bessere Produkt gewinnt, sondern das Produkt mit Zugang zu Regalfläche und
            Werbebudget.
          </p>

          <p className="text-stone">
            Online war lange der Ausweg aus dieser Abhängigkeit. Doch auch dieser Kanal ist für
            viele D2C-Marken inzwischen teuer und schwer planbar geworden: Meta, Google und Amazon
            bestimmen, wer Reichweite bekommt; steigende Akquisekosten, Versandkosten und Retouren
            fressen den Vorteil des Direktvertriebs auf.{" "}
            <strong className="text-cream">
              Aus dem Margendruck des Handels wurde ein Werbedruck im Onlinekanal.
            </strong>
          </p>

          {/* Dritter Weg – hervorgehoben */}
          <div className="border-l-4 border-bronze bg-bronze/5 pl-6 py-4">
            <p className="text-stone">
              <strong className="text-bronze">Hub42 schafft den dritten Weg:</strong>{" "}
              provisionsfreie stationäre Retail-Infrastruktur für unabhängige Hersteller. Marken
              mieten Regalbreite in einer hochfrequentierten Mall, behalten Preis- und Datenhoheit,
              verkaufen zu ihrer eigenen UVP und zahlen keine Handelsmarge. Die Ware bleibt bis zum
              Verkauf Eigentum des Herstellers; Hub42 betreibt Store, Kasse, Tasting und Analytics —
              und verdient ausschließlich über Infrastruktur.
            </p>
          </div>

          <p className="text-stone">
            Hub42 setzt diese Idee als Kommissionsmodell nach § 383 HGB um. Hersteller buchen
            Regalbreite in Zentimetern, liefern Ware auf Kommission und bleiben bis zum Verkauf
            Eigentümer der Produkte. Zusätzlich zur Produktfläche erhält jede Marke{" "}
            <strong className="text-cream">
              physische Kommunikationsfläche am Regal
            </strong>
            : Produktstory, Herkunft, Gründerhintergrund, QR-Code und Tasting-Hinweise. Hub42
            übernimmt Standort, Store-Betrieb, Kasse, Warenpflege, Tasting, Abrechnung und
            Datenreporting. Der Umsatz entsteht nicht aus Handelsmargen, sondern aus monatlicher
            Regalmiete, einer Handling-Fee pro verkaufter Einheit und optionalem Pro Analytics. So
            wird stationärer Vertrieb für Hersteller planbar, günstig und datenbasiert — ohne
            Listungsgebühr, ohne Zwischenhändler und ohne Abhängigkeit von Performance-Marketing.
          </p>

          <p className="text-stone">
            Hub42 ist nicht als Bühne für wenige große Marken gedacht, sondern als{" "}
            <strong className="text-cream">
              Infrastruktur für viele unabhängige Hersteller gleichzeitig.
            </strong>{" "}
            Zielgruppe sind starke Online-Marken mit erklärungsbedürftigen Produkten, eigener
            Community und stationärem Vertriebsbedarf. Die Flächenlogik begrenzt
            Konzentrationsrisiken:{" "}
            <strong className="text-cream">
              Keine einzelne Marke soll mehr als 10 % der Gesamtfläche belegen.
            </strong>{" "}
            So bleibt Hub42 kuratiert, vielfältig und unabhängig von einzelnen Ankermarken.
          </p>

          <p className="text-stone">
            <strong className="text-cream">
              Shopping-Center sind für Hub42 kein zusätzlicher Kundentyp, sondern der strategische
              Infrastrukturpartner.
            </strong>{" "}
            Für Betreiber entsteht ein Retail-Format, das Flächen produktiv nutzt, das Sortiment
            verjüngt und Online-Reichweite in stationäre Frequenz übersetzt. Viele unabhängige
            Online-Marken haben eigene Communitys, aber keinen stationären Ort. Hub42 bündelt diese
            Communitys in einer Mall und schafft zusätzliche Besuchsanlässe durch Launch-Events,
            Tastings, Creator-Content und Social-Media-Aktivierung. Das Center liefert die
            Grundfrequenz — Hub42 macht daraus kuratierte Interaktion.
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
              href="/hersteller#regalfront-anfragen"
              className="inline-flex items-center justify-center px-8 py-4 bg-bronze text-green-dark font-semibold text-sm tracking-wide hover:bg-bronze-light transition-colors rounded-sm"
            >
              Regalfläche anfragen →
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
