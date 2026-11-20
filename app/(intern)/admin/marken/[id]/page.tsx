import { notFound } from "next/navigation";
import { ladeMarkeIntern } from "@/lib/marken-admin";
import { ibanGueltig } from "@/lib/abrechnung-model";
import { PageShell } from "../../../_components/ui/surfaces";
import {
  artikelEntscheiden,
  einladen,
  entziehen,
  fotoHochladen,
  konditionenSpeichern,
  satzSetzen,
  sumupErledigtAktion,
  ibanGeprueft,
  stammdatenZurueck,
} from "../actions";

export const dynamic = "force-dynamic";

const feld =
  "w-full min-h-11 bg-green-dark/70 border border-stone-dark text-cream text-sm px-3 py-2 focus:outline-none focus:border-bronze";
const knopf = "px-4 py-2 min-h-11 bg-bronze text-green-dark text-sm font-semibold hover:bg-bronze-light";
const knopf2 = "px-3 py-1.5 border border-stone-dark text-cream text-xs hover:border-bronze";
const label = "block text-stone text-xs font-mono uppercase tracking-widest mb-1";

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="border border-stone-dark bg-green-mid/30 p-5 mb-6">
      <h2 className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">{titel}</h2>
      {children}
    </section>
  );
}

function Zeile({ k, v, warn }: { k: string; v: React.ReactNode; warn?: boolean }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 py-1 text-sm">
      <span className="text-stone">{k}</span>
      <span className={warn ? "text-amber-300" : "text-cream"}>{v || "–"}</span>
    </div>
  );
}

export default async function MarkeIntern({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { id } = await params;
  const { m: meldung } = await searchParams;
  let d;
  try {
    d = await ladeMarkeIntern(id);
  } catch {
    notFound();
  }
  const k = d.konditionen;
  const mieteAusZusagen = d.zusagen.reduce((a, z) => a + Number(z.monat_netto ?? 0), 0);
  const cmAusZusagen = d.zusagen.reduce((a, z) => a + Number(z.regal_cm ?? 0), 0);
  const offen = d.antraege.filter((a) => a.status === "eingereicht");
  const eingeladen = new Set(d.nutzer.map((n) => n.email.toLowerCase()));
  const hidden = <input type="hidden" name="brand_id" value={id} />;

  return (
    <PageShell
      eyebrow="Marken-Portal"
      title={d.marke.name}
      breit
      back={{ href: "/admin/marken", label: "Alle Marken" }}
      lead={d.marke.website ?? undefined}
    >
      {meldung && <p className="mb-6 border-l-4 border-bronze bg-green-mid/40 px-4 py-3 text-cream text-sm" role="status">{meldung}</p>}

      <Abschnitt titel="1 · Zugang zum Portal">
        {d.nutzer.length > 0 && (
          <ul className="mb-4 text-sm text-cream">
            {d.nutzer.map((n) => (
              <li key={n.user_id} className="flex items-center justify-between gap-3 py-1 border-b border-stone-dark/50">
                <span>
                  {n.email}{" "}
                  <span className="text-stone text-xs">
                    {n.letzter_login ? `zuletzt ${new Date(n.letzter_login).toLocaleDateString("de-DE")}` : "noch nie eingeloggt"}
                  </span>
                </span>
                <form action={entziehen}>
                  {hidden}
                  <input type="hidden" name="user_id" value={n.user_id} />
                  <button className={knopf2}>Entziehen</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2">
          {d.kontakte
            .filter((c) => c.email && !eingeladen.has(c.email.toLowerCase()))
            .map((c) => (
              <form key={c.id} action={einladen} className="flex flex-wrap items-center gap-3 text-sm text-cream">
                {hidden}
                <input type="hidden" name="email" value={c.email!} />
                <input type="hidden" name="kontakt_id" value={c.id} />
                <span>{c.name ?? c.email} · {c.email}{c.rolle ? ` · ${c.rolle}` : ""}</span>
                <button className={knopf2}>Einladen</button>
              </form>
            ))}
          <form action={einladen} className="flex flex-wrap items-end gap-3 mt-2">
            {hidden}
            <div className="flex-1 min-w-60">
              <label className={label} htmlFor="einladen-email">Andere Adresse</label>
              <input id="einladen-email" name="email" type="email" required className={feld} />
            </div>
            <button className={knopf}>Einladen</button>
          </form>
          <p className="text-stone text-xs">Die Marke bekommt einen Login-Link per Mail. Ohne Einladung kann sich niemand anmelden.</p>
        </div>
      </Abschnitt>

      <Abschnitt titel="2 · Konditionen (setzt Hub42)">
        <form action={konditionenSpeichern} className="grid sm:grid-cols-4 gap-4">
          {hidden}
          <div>
            <label className={label}>Provision %</label>
            <input name="provision_pct" defaultValue={k?.provision_pct ?? 7} className={feld} inputMode="decimal" />
          </div>
          <div>
            <label className={label}>Basis</label>
            <select name="provision_basis" defaultValue={k?.provision_basis ?? "netto"} className={feld}>
              <option value="netto">netto</option>
              <option value="brutto">brutto</option>
            </select>
          </div>
          <div>
            <label className={label}>Miete netto / Monat €</label>
            <input name="miete_netto_monat" defaultValue={k?.miete_netto_monat || mieteAusZusagen || ""} className={feld} inputMode="decimal" />
            {mieteAusZusagen > 0 && <p className="text-stone text-xs mt-1">Laut Zusagen: {mieteAusZusagen.toLocaleString("de-DE")} €</p>}
          </div>
          <div>
            <label className={label}>Vertragsbeginn</label>
            <input name="vertragsbeginn" type="date" defaultValue={k?.vertragsbeginn ?? d.zusagen[0]?.gebucht_am ?? ""} className={feld} />
          </div>
          <div>
            <label className={label}>Laufzeit Monate</label>
            <input name="laufzeit_monate" defaultValue={k?.laufzeit_monate ?? d.zusagen[0]?.laufzeit_monate ?? ""} className={feld} inputMode="numeric" />
          </div>
          <div>
            <label className={label}>Kündigungsfrist</label>
            <input name="kuendigungsfrist" defaultValue={k?.kuendigungsfrist ?? ""} placeholder="z. B. 1 Monat zum Monatsende" className={feld} />
          </div>
          <div>
            <label className={label}>Regal cm</label>
            <input name="regal_cm" defaultValue={k?.regal_cm ?? (cmAusZusagen || "")} className={feld} inputMode="numeric" />
          </div>
          <div>
            <label className={label}>Regal-Lage</label>
            <input name="regal_lage" defaultValue={k?.regal_lage ?? d.zusagen[0]?.klasse ?? ""} className={feld} />
          </div>
          <div className="sm:col-span-4"><button className={knopf}>Konditionen speichern</button></div>
        </form>
      </Abschnitt>

      <Abschnitt titel={`3 · Stammdaten der Marke · ${k?.status ?? "noch nichts eingetragen"}`}>
        {k ? (
          <>
            <Zeile k="Firma" v={k.firma} />
            <Zeile k="Anschrift" v={[k.strasse, [k.plz, k.ort].filter(Boolean).join(" "), k.land].filter(Boolean).join(", ")} />
            <Zeile k="Abrechnungs-Mail" v={k.rechnungs_email} />
            <Zeile k="Ansprechperson" v={[k.ansprechpartner, k.telefon].filter(Boolean).join(" · ")} />
            <Zeile k="Nachschub" v={[k.logistik_kontakt, k.nachschub_email].filter(Boolean).join(" · ")} />
            <Zeile k="USt-IdNr." v={k.ust_idnr} />
            <Zeile k="Steuernummer" v={k.steuernummer} />
            <Zeile k="Kleinunternehmer" v={k.kleinunternehmer ? "ja, § 19 UStG" : "nein"} />
            <Zeile k="Kontoinhaber" v={k.kontoinhaber} />
            <Zeile
              k="IBAN"
              v={k.iban ? `${k.iban}${ibanGueltig(k.iban) ? "" : " · Prüfziffer falsch"}${k.iban_geaendert_am ? ` · neu seit ${new Date(k.iban_geaendert_am).toLocaleDateString("de-DE")}` : ""}` : null}
              warn={(!!k.iban && !ibanGueltig(k.iban)) || !!k.iban_geaendert_am}
            />
            {k.iban_geaendert_am && (
              <form action={ibanGeprueft} className="my-2 flex gap-3 items-center">
                {hidden}
                <span className="text-amber-300 text-xs">Die Marke hat die IBAN geändert. Passt sie zur Firma?</span>
                <button className={knopf2}>IBAN geprüft</button>
              </form>
            )}
            <Zeile k="BIC" v={k.bic} />
            <Zeile k="Gutschrift-Zustimmung" v={k.gutschrift_zustimmung_am ? `${new Date(k.gutschrift_zustimmung_am).toLocaleString("de-DE")} · Text ${k.gutschrift_zustimmung_version}` : null} warn={!k.gutschrift_zustimmung_am} />
            <p className="text-stone text-xs mt-3">Die Stammdaten gelten, sobald die Marke sie einreicht. Fällt euch etwas auf, schickt sie mit Hinweis zurück.</p>
            {k.status === "freigegeben" && (
              <div className="mt-2">
                <form action={stammdatenZurueck} className="flex flex-wrap gap-3 items-end">
                  {hidden}
                  <div className="flex-1 min-w-60">
                    <label className={label}>Hinweis an die Marke</label>
                    <input name="pruef_notiz" className={feld} placeholder="z. B. IBAN gehört nicht zur Firma" />
                  </div>
                  <button className={knopf2}>Zurück an die Marke</button>
                </form>
              </div>
            )}
          </>
        ) : (
          <p className="text-stone text-sm">Die Marke hat noch nichts eingetragen.</p>
        )}
      </Abschnitt>

      <Abschnitt titel={`4 · Artikel${offen.length ? ` · ${offen.length} alte Anträge offen` : ""}`}>
        {offen.map((a) => (
          <form key={a.id} action={artikelEntscheiden} className="grid sm:grid-cols-[1fr_1fr_140px_auto] gap-3 items-end border-b border-stone-dark/50 pb-3 mb-3">
            {hidden}
            <input type="hidden" name="antrag_id" value={a.id} />
            <div className="text-sm text-cream flex gap-3 items-start">
              {a.bild_url && (
                // eslint-disable-next-line @next/next/no-img-element -- signierte Storage-URL
                <a href={a.bild_url} target="_blank" rel="noreferrer"><img src={a.bild_url} alt="" className="w-14 h-14 object-cover border border-stone-dark" /></a>
              )}
              <div>
              <div className="font-semibold">{a.artikel_name}{a.quelle === "aenderung" && <span className="ml-2 text-amber-300 text-xs font-normal">Änderung an Artikel im Regal</span>}</div>
              <div className="text-stone text-xs font-mono">{a.ean ?? "ohne EAN, bekommt TK-Nummer"} · {Number(a.vk_brutto).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} · {a.mwst_satz} %{a.inhalt ? ` · ${a.inhalt}` : ""}</div>
              </div>
            </div>
            <div>
              <label className={label}>Name in SumUp</label>
              <input name="kassen_name" defaultValue={a.artikel_name} className={feld} />
            </div>
            <div>
              <label className={label}>Lage</label>
              <input name="regal_lage" defaultValue={k?.regal_lage ?? "Standard"} className={feld} />
            </div>
            <div className="flex gap-2">
              <button name="entscheidung" value="freigeben" className={knopf}>Freigeben</button>
              <button name="entscheidung" value="ablehnen" className={knopf2}>Ablehnen</button>
            </div>
          </form>
        ))}
        <p className="text-stone text-xs mb-4">
          Der Name in SumUp muss genau so heißen wie der Artikel in der SumUp-App, sonst ordnet die Kasse Verkäufe nicht zu.
        </p>
        {d.artikel.length > 0 && (
          <table className="w-full text-sm text-cream">
            <thead>
              <tr className="text-left text-stone text-xs font-mono uppercase tracking-widest border-b border-stone-dark">
                <th className="py-2 pr-3">Im Kassenstamm</th><th className="py-2 pr-3">EAN</th><th className="py-2 pr-3">VK</th><th className="py-2 pr-3">MwSt</th><th className="py-2">SumUp</th>
              </tr>
            </thead>
            <tbody>
              {d.artikel.map((a) => (
                <tr key={a.id} className="border-b border-stone-dark/50">
                  <td className="py-2 pr-3">{a.artikel_name}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{a.ean}</td>
                  <td className="py-2 pr-3">{Number(a.verkaufspreis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                  <td className="py-2">
                    <form action={satzSetzen} className="flex gap-2 items-center">
                      {hidden}
                      <input type="hidden" name="artikel_id" value={a.id} />
                      <select name="mwst_satz" defaultValue={a.mwst_satz ?? ""} className={`${feld} w-24 min-h-9 py-1 ${a.mwst_satz == null ? "border-amber-300" : ""}`}>
                        <option value="" disabled>fehlt</option>
                        <option value="7">7 %</option>
                        <option value="19">19 %</option>
                        <option value="0">0 %</option>
                      </select>
                      <button className={knopf2}>OK</button>
                    </form>
                  </td>
                  <td className="py-2 pl-3">
                    {a.sumup_offen ? (
                      <form action={sumupErledigtAktion} className="flex gap-2 items-center">
                        <input type="hidden" name="artikel_id" value={a.id} />
                        <input type="hidden" name="zurueck" value={`/admin/marken/${id}`} />
                        <span className="text-amber-300 text-xs">{a.sumup_hinweis}</span>
                        <button className={knopf2}>Erledigt</button>
                      </form>
                    ) : (
                      <span className="text-stone text-xs">aktuell</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Abschnitt>

      <Abschnitt titel="5 · Regalfoto">
        {d.foto?.url && (
          // eslint-disable-next-line @next/next/no-img-element -- signierte Storage-URL
          <img src={d.foto.url} alt="Aktuelles Regalfoto" className="max-h-72 mb-3 border border-stone-dark" />
        )}
        {d.foto && <p className="text-stone text-xs mb-3">Zuletzt {new Date(d.foto.aufgenommen_am).toLocaleString("de-DE")} von {d.foto.aufgenommen_von ?? "?"}</p>}
        <form action={fotoHochladen} className="flex flex-wrap gap-3 items-end">
          {hidden}
          <input type="file" name="foto" accept="image/*" capture="environment" required className="text-cream text-sm" />
          <button className={knopf}>Hochladen</button>
        </form>
      </Abschnitt>
    </PageShell>
  );
}
