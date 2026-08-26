import Link from "next/link";
import { getUebersicht, dauerLabel, ZEITRAEUME, type Zeitraum } from "@/lib/analytics-stats";
import { getAlleBrandEngagements, buildDeckLink } from "@/lib/analytics-links";
import { getBrands } from "@/lib/pipeline";
import { PageShell, Panel, StatTile, SectionHead, EmptyState } from "@/app/(intern)/_components/ui/surfaces";
import { BalkenZeile, TagesBalken, Trichter } from "./_components/Balken";
import LinkGenerator from "./_components/LinkGenerator";

export const dynamic = "force-dynamic";

export const metadata = { title: "Analytics" };

async function erzeugeLinkAction(brandId: string, label: string): Promise<string> {
  "use server";
  return buildDeckLink(brandId, label, { createdBy: "dashboard" });
}

function istZeitraum(v: string | undefined): v is `${Zeitraum}` {
  return !!v && ZEITRAEUME.some((z) => String(z) === v);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tage?: string }>;
}) {
  const params = await searchParams;
  const zeitraum: Zeitraum = istZeitraum(params.tage) ? (Number(params.tage) as Zeitraum) : 30;

  const [u, brandAktivitaet, brands] = await Promise.all([
    getUebersicht(zeitraum),
    getAlleBrandEngagements(),
    getBrands(),
  ]);

  const maxSeitenAufrufe = Math.max(1, ...u.seiten.map((s) => s.aufrufe));
  const maxQuelle = Math.max(1, ...u.quellen.map((q) => q.sessions));
  const maxGeraet = Math.max(1, ...u.geraete.map((g) => g.sessions));
  const maxLand = Math.max(1, ...u.laender.map((l) => l.sessions));

  return (
    <PageShell
      breit
      eyebrow="Hub42 Intern"
      title="Analytics"
      lead={
        <>
          Eigene Messung, cookiefrei und ohne Drittanbieter. Keine IP-Speicherung, kein
          Consent-Banner nötig. &bdquo;Besucher/Tag&ldquo; ist bewusst ein Tageswert – die
          Besucher-Kennung rotiert täglich, damit kein Langzeitprofil entsteht.
        </>
      }
      actions={
        <div className="flex gap-1.5">
          {ZEITRAEUME.map((z) => (
            <Link
              key={z}
              href={`/pipeline/analytics?tage=${z}`}
              className={`px-3 py-1.5 text-xs font-mono border rounded-sm transition-colors ${
                z === zeitraum
                  ? "border-bronze text-bronze"
                  : "border-stone-dark text-stone hover:text-cream hover:border-stone"
              }`}
            >
              {z} Tage
            </Link>
          ))}
        </div>
      }
    >
      {!u.hatDaten ? (
        <EmptyState
          titel="Noch keine Messdaten"
          text="Die Erfassung läuft, sobald die Seite deployt ist und jemand sie besucht. Lokal: eine öffentliche Seite aufrufen und diese Ansicht neu laden."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <StatTile label="Besuche" value={u.kennzahlen.sessions} note="Sessions im Zeitraum" />
          <StatTile label="Aufrufe" value={u.kennzahlen.aufrufe} note="Seitenaufrufe" />
          <StatTile
            label="Besucher / Tag"
            value={u.kennzahlen.besucherProTag}
            note="Tagesdurchschnitt"
          />
          <StatTile
            label="Ø Verweildauer"
            value={dauerLabel(u.kennzahlen.avgDauerSek)}
            note="pro Seitenaufruf"
          />
          <StatTile
            label="Anfragen"
            value={u.kennzahlen.conversions}
            note="Kontaktformular"
            tone={u.kennzahlen.conversions === 0 ? "schwach" : "normal"}
          />
        </div>
      )}

      {u.hatDaten && (
        <>
          <Panel title="Verlauf" nummer="01" className="mb-6">
            <TagesBalken tage={u.tage} />
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Panel title="Seiten" nummer="02">
              {u.seiten.slice(0, 10).map((s) => (
                <BalkenZeile
                  key={s.path}
                  mono
                  label={s.path}
                  wert={s.aufrufe}
                  zusatz={s.avgDauerSek > 0 ? dauerLabel(s.avgDauerSek) : undefined}
                  anteilPct={(s.aufrufe / maxSeitenAufrufe) * 100}
                />
              ))}
            </Panel>

            <Panel title="Herkunft" nummer="03">
              {u.quellen.length === 0 ? (
                <p className="text-stone text-xs">Noch keine Quellen erfasst.</p>
              ) : (
                u.quellen.map((q) => (
                  <BalkenZeile
                    key={q.quelle}
                    mono
                    label={q.quelle}
                    wert={q.sessions}
                    anteilPct={(q.sessions / maxQuelle) * 100}
                  />
                ))
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Panel title="Geräte" nummer="04">
              {u.geraete.map((g) => (
                <BalkenZeile
                  key={g.wert}
                  label={g.wert}
                  wert={g.sessions}
                  anteilPct={(g.sessions / maxGeraet) * 100}
                />
              ))}
            </Panel>

            <Panel title="Länder" nummer="05">
              {u.laender.map((l) => (
                <BalkenZeile
                  key={l.wert}
                  mono
                  label={l.wert}
                  wert={l.sessions}
                  anteilPct={(l.sessions / maxLand) * 100}
                />
              ))}
            </Panel>
          </div>

          <Panel
            title="Trichter"
            nummer="06"
            hinweis="Prozentwert = Anteil an der jeweils vorherigen Stufe. Rot unter 25 % markiert die Stelle, an der am meisten verloren geht."
            className="mb-6"
          >
            <Trichter stufen={u.trichter} />
          </Panel>

          <Panel
            title="Lesetiefe im Deck"
            nummer="07"
            hinweis="Wie viele Sessions haben die jeweilige Sektion erreicht. Die Stelle, an der die Balken abbrechen, ist die Stelle, an der Brands aufhören zu lesen."
            className="mb-6"
          >
            {u.deckTiefe.every((d) => d.sessions === 0) ? (
              <p className="text-stone text-xs">
                Noch keine Deck-Sektion erreicht. Wird gefüllt, sobald jemand /deck scrollt.
              </p>
            ) : (
              u.deckTiefe.map((d) => (
                <BalkenZeile
                  key={d.key}
                  label={d.label}
                  wert={d.sessions}
                  anteilPct={d.anteilPct}
                />
              ))
            )}
          </Panel>
        </>
      )}

      <Panel
        title="Deck-Aktivität pro Brand"
        nummer="08"
        hinweis="Wer das Deck über einen Outreach-Link geöffnet hat. Der Ort, an den man vor einem Follow-up schaut."
        className="mb-6"
      >
        {brandAktivitaet.length === 0 ? (
          <p className="text-stone text-xs">
            Noch keine Brand hat einen getaggten Deck-Link geöffnet. Links unten erzeugen und in
            Mails verwenden.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-stone-dark">
                  {["Brand", "Zuerst", "Zuletzt", "Sessions", "Lesezeit", "Bis Sektion"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 text-stone text-[10px] font-mono uppercase tracking-[0.16em] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brandAktivitaet.map((b) => (
                  <tr key={b.brand_id} className="border-b border-stone-dark/40">
                    <td className="px-3 py-2">
                      <Link
                        href={`/pipeline/${b.brand_id}`}
                        className="text-cream hover:text-bronze transition-colors"
                      >
                        {b.brand_name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-stone text-xs font-mono whitespace-nowrap">
                      {b.erste_oeffnung.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2 text-stone text-xs font-mono whitespace-nowrap">
                      {b.letzte_oeffnung.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2 text-cream text-xs font-mono tabular-nums">
                      {b.sessions}
                    </td>
                    <td className="px-3 py-2 text-cream text-xs font-mono tabular-nums">
                      {dauerLabel(Math.round(b.lesezeit_ms / 1000))}
                    </td>
                    <td className="px-3 py-2 text-stone text-xs">
                      {b.tiefste_sektion ?? "—"}
                      {b.tiefste_pct !== null && (
                        <span className="text-stone/40 ml-1.5 font-mono">{b.tiefste_pct}%</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Deck-Link erzeugen"
        nummer="09"
        hinweis="Für Mails, die von Hand rausgehen. Die Outreach-Sequenz baut ihre Links selbst."
      >
        <LinkGenerator
          brands={brands.map((b) => ({ id: b.id, name: b.name }))}
          erzeugeLinkAction={erzeugeLinkAction}
        />
      </Panel>

      <SectionHead className="mt-8">Grenzen dieser Messung</SectionHead>
      <ul className="text-stone text-xs space-y-1.5 leading-relaxed list-disc pl-5">
        <li>
          Eigene Aufrufe des Teams zählen mit. Ohne Zugriff auf den Endgerätespeicher gibt es
          kein dauerhaftes Opt-out – bei Brand-Zahlen mitdenken.
        </li>
        <li>
          Wiederkehrende Besucher über mehrere Tage sind nicht erkennbar. Die Besucher-Kennung
          rotiert täglich, damit kein Langzeitprofil entsteht.
        </li>
        <li>
          Linkvorschauen von WhatsApp, LinkedIn und Slack werden gefiltert, damit ein geteilter
          Link nicht als &bdquo;Deck geöffnet&ldquo; gemeldet wird. Ein unbekannter Bot kann durchkommen.
        </li>
        <li>Rohdaten werden nach 12 Monaten automatisch gelöscht.</li>
      </ul>
    </PageShell>
  );
}
