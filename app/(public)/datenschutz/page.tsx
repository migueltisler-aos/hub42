import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung der Hub42 UG (haftungsbeschränkt)",
};

export default function DatenschutzPage() {
  return (
    <section className="bg-green-dark pt-32 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">Rechtliches</p>
        <h1
          className="text-cream text-5xl tracking-widest mb-12"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Datenschutz
        </h1>

        <div className="space-y-8 text-sm text-stone leading-relaxed">
          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">1. Verantwortlicher</h2>
            <p>
              Hub42 UG (haftungsbeschränkt)<br />
              c/o Valuedfriends Innovation GmbH<br />
              Spreeinsel 6<br />
              15848 Beeskow<br />
              E-Mail:{" "}
              <a href="mailto:info@tryhub42.de" className="text-bronze hover:underline">
                info@tryhub42.de
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
            <p>
              Wir erheben personenbezogene Daten nur, wenn Sie uns diese im Rahmen einer
              Kontaktaufnahme (z.B. über das Kontaktformular) freiwillig mitteilen. Diese
              Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet und nicht
              an Dritte weitergegeben.
            </p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">3. Kontaktformular</h2>
            <p>
              Wenn Sie uns über das Kontaktformular eine Nachricht senden, werden Ihre
              Angaben (Name, E-Mail, Nachricht) zum Zweck der Bearbeitung der Anfrage
              und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben
              wir nicht ohne Ihre Einwilligung weiter. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
            </p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">4. Hosting</h2>
            <p>
              Diese Website wird auf Servern von Vercel Inc., 340 Pine Street Suite 701,
              San Francisco, CA 94104, USA gehostet. Details zur Datenverarbeitung durch
              Vercel finden Sie in der Datenschutzerklärung von Vercel.
            </p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">5. Google Fonts</h2>
            <p>
              Diese Website verwendet Google Fonts, die beim Build-Prozess lokal
              eingebunden werden. Es werden dabei keine Anfragen an Google-Server gesendet.
            </p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">6. Ihre Rechte</h2>
            <p>
              Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
              Verarbeitung sowie Datenübertragbarkeit. Wenden Sie sich dazu an:{" "}
              <a href="mailto:info@tryhub42.de" className="text-bronze hover:underline">
                info@tryhub42.de
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">7. Cookies</h2>
            <p>
              Diese Website verwendet keine Tracking-Cookies. Es werden ausschließlich
              technisch notwendige Cookies eingesetzt, die für den Betrieb der Website
              erforderlich sind. Auch zu Analysezwecken greifen wir nicht auf Ihren
              Endgerätespeicher zu – es werden dafür weder Cookies noch Local Storage
              oder Session Storage verwendet.
            </p>
          </div>

          <div>
            <h2 className="text-cream text-lg font-semibold mb-2">8. Reichweitenmessung</h2>
            <p>
              Um zu verstehen, wie unsere Website genutzt wird, führen wir eine eigene,
              datensparsame Reichweitenmessung durch. Es sind keine Dritten beteiligt:
              die Daten verlassen unsere eigene Infrastruktur nicht, es findet kein
              Profiling und keine geräteübergreifende Wiedererkennung statt und die Daten
              werden nicht weitergegeben oder verkauft.
            </p>
            <p className="mt-3">
              Erfasst werden pro Aufruf: die aufgerufene Seite, die verweisende Domain
              (nur die Domain, nicht die vollständige Adresse), etwaige
              Kampagnen-Parameter der aufgerufenen Adresse, die Verweildauer, der
              Gerätetyp (Mobil/Tablet/Desktop) und das Land.
            </p>
            <p className="mt-3">
              <strong className="text-cream">Ihre IP-Adresse wird nicht gespeichert.</strong>{" "}
              Um Aufrufe eines Tages grob zusammenfassen zu können, bilden wir aus
              IP-Adresse, Browserkennung und einem Geheimwert einen nicht
              umkehrbaren Prüfwert, der täglich wechselt. Nach diesem Wechsel lassen sich
              Aufrufe verschiedener Tage nicht mehr einander zuordnen.
            </p>
            <p className="mt-3">
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse
              liegt in der bedarfsgerechten Gestaltung und der statistischen Auswertung
              unseres Angebots. Da wir für diese Messung nicht auf Ihr Endgerät zugreifen,
              ist keine Einwilligung nach § 25 TDDDG erforderlich.
            </p>
            <p className="mt-3">
              Die erhobenen Einzeldaten werden nach{" "}
              <strong className="text-cream">12 Monaten</strong> automatisch gelöscht. Sie
              können der Reichweitenmessung jederzeit widersprechen – eine Nachricht an{" "}
              <a href="mailto:info@tryhub42.de" className="text-bronze hover:underline">
                info@tryhub42.de
              </a>{" "}
              genügt.
            </p>
            <p className="mt-3">
              Zusätzlich enthalten Links, die wir Marken und Partnern individuell zusenden,
              eine Kennung, über die wir erkennen, ob und wie lange die verlinkte
              Präsentation geöffnet wurde. Diese Verarbeitung erfolgt im Rahmen der
              Geschäftsanbahnung, ebenfalls auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </div>

          <p className="text-stone/60 text-xs font-mono border-t border-stone-dark/30 pt-6">
            Stand: August 2026
          </p>
        </div>
      </div>
    </section>
  );
}
