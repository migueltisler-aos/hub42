import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Kontakt – Hub42",
  description:
    "Schreib uns. Für Hersteller, Scouts, Presse und alle die Hub42 kennenlernen wollen.",
};

export default function KontaktPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-green-dark pt-32 pb-16 border-b border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Kontakt
          </p>
          <h1
            className="text-cream text-[clamp(2.5rem,8vw,6rem)] leading-none tracking-widest mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Reden wir.
          </h1>
          <p className="text-stone text-base max-w-lg leading-relaxed">
            Du hast eine Brand die hier reingehört?<br />
            Oder du willst einfach mehr wissen?<br />
            Schreib uns. Wir antworten innerhalb von 24 Stunden.
          </p>
        </div>
      </section>

      {/* Formular + Info */}
      <section className="bg-green-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Formular */}
            <div>
              <h2
                className="text-cream text-3xl tracking-widest mb-8"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Nachricht senden
              </h2>
              <ContactForm />
            </div>

            {/* Info */}
            <div className="space-y-10">
              {/* Direktkontakt */}
              <div>
                <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
                  Direktkontakt
                </p>
                <div className="bg-green-mid border border-stone-dark rounded-sm p-6">
                  <p
                    className="text-cream text-2xl tracking-widest mb-1"
                    style={{ fontFamily: "var(--font-bebas)" }}
                  >
                    Miguel Tisler
                  </p>
                  <p className="text-stone text-sm mb-4">Gründer, Hub42</p>
                  <a
                    href="mailto:info@tryhub42.de"
                    className="text-bronze hover:underline text-sm font-mono"
                  >
                    info@tryhub42.de
                  </a>
                </div>
              </div>

              {/* Store-Adresse */}
              <div>
                <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
                  Store
                </p>
                <div className="bg-green-mid border border-stone-dark rounded-sm p-6">
                  <p
                    className="text-cream text-2xl tracking-widest mb-3"
                    style={{ fontFamily: "var(--font-bebas)" }}
                  >
                    Alexa Berlin
                  </p>
                  <address className="not-italic text-stone text-sm font-mono leading-relaxed">
                    Grunerstraße 20<br />
                    10179 Berlin
                  </address>
                  <p className="text-stone text-sm font-mono mt-2">Mo–Sa: 10:00–20:00 Uhr</p>
                </div>
              </div>

              {/* Was erwartet dich */}
              <div>
                <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
                  Wer schreibt uns?
                </p>
                <ul className="space-y-3">
                  {[
                    {
                      typ: "Hersteller",
                      text: "Du willst eine Regalfläche anfragen oder mehr über das Konsignationsmodell wissen.",
                    },
                    {
                      typ: "Scout",
                      text: "Du kennst eine Brand die wir kennen sollten.",
                    },
                    {
                      typ: "Presse",
                      text: "Du willst über Hub42 berichten.",
                    },
                    {
                      typ: "Sonstiges",
                      text: "Du willst einfach Hallo sagen.",
                    },
                  ].map((item) => (
                    <li key={item.typ} className="flex gap-3">
                      <span className="text-bronze shrink-0 mt-0.5">→</span>
                      <p className="text-stone text-sm">
                        <span className="text-cream font-medium">{item.typ}: </span>
                        {item.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
