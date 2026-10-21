"use client";

/* Bewerbungs-Assistent auf der Startseite (#bewerben): eine Frage pro
   Schritt, am Ende das Ergebnis mit Regalkarte, Regel-Check, geschätztem
   Abverkauf, Kosten/Nutzen und dem, was wir liefern. Erst danach fragen wir
   nach Name und E-Mail.

   Die Website wird gleich im ersten Schritt im Hintergrund gelesen (nur mit
   Freigabe), während die Marke die nächsten Fragen beantwortet. Regalwand
   und Treppe belegen Front und Einstieg wie beim alten Formular vor. */

/* eslint-disable @next/next/no-img-element -- fremde Shop-Bilder, keine Domains-Liste */

import { useEffect, useRef, useState } from "react";
import { submitBewerbung } from "@/app/actions/bewerbung";
import { baueArtikel, baueKarte, meldeSchritt } from "@/app/actions/karte";
import { track } from "@/lib/analytics-client";
import {
  BREITEN,
  FUNNEL,
  CM_JE_PRODUKT,
  HANDELSREIFE,
  MAX_PRODUKTE,
  STARTS,
  ZIELE,
  type ReifeKey,
  type StartKey,
  type ZielKey,
  STUECK_PRO_PRODUKT,
  VERTRIEB,
  VERKAUFSTAGE,
  empfohlenerEinstieg,
  rechnung as rechnen,
  regeln,
  schaetzung,
  type AssistentAntworten,
  type Rechnung as RechnungWerte,
  type Schaetzung,
} from "@/lib/assistent-model";
import {
  HUB_MARGIN_PCT,
  MAX_REGAL_CM,
  PAKETE,
  STUFE_PREIS,
  paketFuer,
  paketMiete,
} from "@/lib/deck-economics";
import MehrAlsEineEbene from "@/components/MehrAlsEineEbene";
import { FRONT_EVENT, pruefeBewerbung, type FrontDetail } from "@/lib/bewerbung-model";
import { nurEntwurf, mieteMonat, type ArtikelTexte, type KarteEntwurf, type KarteProdukt } from "@/lib/karte-model";

const fertig = (t: ArtikelTexte | null | "laedt") => (t === "laedt" ? null : t);
import { ZONES, eur, type ZoneKey } from "@/lib/neue-ui/regal";
import { HALTUNG_TAGS, KATEGORIEN_KANONISCH, type HaltungTag } from "@/lib/pipeline-model";
import { ALLE_STUFEN, EINSTIEGE, EINSTIEG_EVENT, STUFEN, mitRegalwahl, type EinstiegKey } from "@/lib/treppe";
import { ArtikelKarte, HerstellerKarte, Rechnung, Zoombar } from "./PosKarten";

const SCHRITTE = ["website", "ziel", "start", "reife", "produkt", "regal", "ergebnis", "kontakt"] as const;
const FRAGEN = 6; // alles vor dem Ergebnis

/* Läuft durch, solange die KI noch liest. */
const WARTEN = [
  "Wir suchen deine Produkte und Preise …",
  "Wir mischen deine Markenfarben …",
  "Wir lesen deine Geschichte und dein Impressum …",
  "Gleich stehst du bei uns im Regal …",
];
type Schritt = (typeof SCHRITTE)[number];
type Ki = "aus" | "laeuft" | "fertig" | "fehler";

const START: AssistentAntworten = {
  ziele: [],
  start: "",
  handelsreife: [],
  kategorie: "",
  vertrieb: "",
  eigentum: "",
  haltung: [],
  besonders: "",
  cm: PAKETE.S.cm,
  zone: "basis",
  faktor: 1,
  faktorGrund: "",
};

const ZONEN_AUFSTEIGEND: ZoneKey[] = ["basis", "augenhoehe", "greifhoehe"];

/** Die Wege ins Regal, unten im Ergebnis sichtbar. */
const OPTIONEN: { key: EinstiegKey; name: string; preis: string; text: string }[] = [
  { key: "standardregal", name: "Standardregal", preis: "", text: "" },
  {
    key: "testen",
    name: "Stufe 1 Testen",
    preis: `${STUFE_PREIS.testen.toLocaleString("de-DE")} € für 3 Monate`,
    text: "15 cm inklusive. Verkauft sich das überhaupt?",
  },
  {
    key: "beweisen",
    name: "Stufe 2 Beweisen",
    preis: `${STUFE_PREIS.beweisen.toLocaleString("de-DE")} € für 3 Monate`,
    text: "Mit Tastings und Käuferprofil. Wer kauft, und warum?",
  },
  {
    key: "studie",
    name: "Stufe 3 bis 5 Studie",
    preis: `ab ${STUFE_PREIS.spark.toLocaleString("de-DE")} €`,
    text: "Antworten für deinen Einkauf: Preis, Zielgruppe, Listung.",
  },
];

const euro0 = (n: number) => Math.round(n).toLocaleString("de-DE") + " €";
const zahl = (n: number) => Math.round(n).toLocaleString("de-DE");

/** Welche Stufe zu welchem Einstieg gehört (Studie = Stufe 3, Discovery Spark). */
const STUFE_ZU: Partial<Record<EinstiegKey, (typeof STUFEN)[number]>> = {
  testen: STUFEN[0],
  beweisen: STUFEN[1],
  studie: STUFEN[2],
};

export default function Assistent() {
  const [schritt, setSchritt] = useState<Schritt>("website");
  const [a, setA] = useState<AssistentAntworten>(START);
  const [website, setWebsite] = useState("");
  const [bildrechte, setBildrechte] = useState(false);
  const [ki, setKi] = useState<Ki>("aus");
  const [kiGrund, setKiGrund] = useState("");
  const [karte, setKarte] = useState<KarteEntwurf | null>(null);
  const [auswahl, setAuswahl] = useState<KarteProdukt[]>([]);
  const [artikelJe, setArtikelJe] = useState<Record<string, ArtikelTexte | null | "laedt">>({});
  const [warteIdx, setWarteIdx] = useState(0);
  const [anfrageId, setAnfrageId] = useState<string | null>(null);
  const [eigenes, setEigenes] = useState({ titel: "", preis: "" });
  const [verkaeufe, setVerkaeufe] = useState(20);
  const [kontakt, setKontakt] = useState({ instagram: "", instaFreigabe: true, name: "", email: "", marke: "", einstieg: "" as EinstiegKey | "", nachricht: "", firma2: "" });
  const [einstiegVonTreppe, setEinstiegVonTreppe] = useState(false);
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [senden, setSenden] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [korrigieren, setKorrigieren] = useState(false);
  const begonnen = useRef(false);
  const kopf = useRef<HTMLDivElement>(null);

  // Für die Rechnung zählt der Durchschnittspreis der gewählten Produkte.
  const mitPreis = auswahl.filter((x) => x.preis);
  const produkt: KarteProdukt | null = auswahl.length
    ? {
        titel: auswahl.length === 1 ? auswahl[0].titel : `${auswahl.length} Produkte`,
        preis: mitPreis.length ? mitPreis.reduce((n, x) => n + (x.preis ?? 0), 0) / mitPreis.length : null,
        bild: auswahl[0].bild,
        url: auswahl[0].url,
      }
    : null;
  const setProdukt = (x: KarteProdukt) => setAuswahl((l) => (l.length ? [{ ...l[0], preis: x.preis }, ...l.slice(1)] : [x]));
  const artikelVon = (x: KarteProdukt) => artikelJe[x.titel] ?? null;
  // Preisurteil: ein unfaires Produkt zählt, sonst das erste.
  const urteile = auswahl
    .map(artikelVon)
    .flatMap((t) => (t && t !== "laedt" && t.preis ? [t.preis] : []));
  const urteil = urteile.find((u) => !u.fair) ?? urteile[0] ?? null;

  const preis = produkt?.preis ?? null;
  const r = regeln(a, preis, urteil);
  const s = preis ? schaetzung(a, preis, auswahl.length) : null;
  const rw = s && preis ? rechnen(a, preis, s) : null;
  const mitte = s?.stueck.mitte;

  const setze = <K extends keyof AssistentAntworten>(k: K, v: AssistentAntworten[K]) => setA((x) => ({ ...x, [k]: v }));
  const idx = SCHRITTE.indexOf(schritt);

  function gehe(ziel: Schritt) {
    setSchritt(ziel);
    // Fortschritt ins Protokoll der KI-Anfragen (ohne Personendaten).
    if (anfrageId) {
      meldeSchritt(anfrageId, ziel, auswahl.length ? auswahl : undefined, {
        ziele: a.ziele,
        start: a.start,
        handelsreife: a.handelsreife,
        cm: a.cm,
        zone: a.zone,
        faktor: a.faktor,
        schaetzungMonat: mitte ?? null,
      }).catch(() => {});
    }
    // Regler im Ergebnis startet bei unserer Schätzung.
    if (ziel === "ergebnis" && mitte) setVerkaeufe(Math.min(120, Math.max(5, Math.round(mitte / 5) * 5)));
    track({ event_type: "interaction", path: window.location.pathname, section: `assistent:${ziel}` });
    // Auf kleinen Bildschirmen wieder an den Anfang des Assistenten.
    requestAnimationFrame(() => {
      const r = kopf.current?.getBoundingClientRect();
      if (r && r.top < 0) kopf.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  const weiter = () => gehe(SCHRITTE[Math.min(idx + 1, SCHRITTE.length - 1)]);
  const zurueck = () => gehe(SCHRITTE[Math.max(idx - 1, 0)]);

  useEffect(() => {
    if (ki !== "laeuft") return;
    const t = setInterval(() => setWarteIdx((i) => i + 1), 2600);
    return () => clearInterval(t);
  }, [ki]);

  /* Regalwand und Treppe schicken ihre Wahl hierher. */
  useEffect(() => {
    const front = (e: Event) => {
      const { zone, cm } = (e as CustomEvent<FrontDetail>).detail;
      setA((x) => ({ ...x, zone: zone || x.zone, cm: cm ?? x.cm }));
    };
    const einstieg = (e: Event) => {
      setKontakt((k) => ({ ...k, einstieg: (e as CustomEvent<EinstiegKey>).detail }));
      setEinstiegVonTreppe(true);
    };
    window.addEventListener(FRONT_EVENT, front);
    window.addEventListener(EINSTIEG_EVENT, einstieg);
    return () => {
      window.removeEventListener(FRONT_EVENT, front);
      window.removeEventListener(EINSTIEG_EVENT, einstieg);
    };
  }, []);

  function websiteWeiter() {
    if (!begonnen.current) {
      begonnen.current = true;
      track({ event_type: "interaction", path: window.location.pathname, section: "bewerbung" });
    }
    if (website.trim() && bildrechte && ki !== "laeuft") {
      setKi("laeuft");
      baueKarte(website, kontakt.marke, true).then((res) => {
        if (!res.ok) {
          setKi("fehler");
          setKiGrund(res.grund);
          return;
        }
        const k = res.karte;
        setKarte(k);
        setAnfrageId(res.anfrageId);
        setKi("fertig");
        // Vorschläge nur übernehmen, wo die Marke selbst noch nichts gesagt hat.
        setA((x) => ({
          ...x,
          kategorie: x.kategorie || k.kategorie,
          vertrieb: x.vertrieb || k.vertrieb,
          eigentum: x.eigentum || k.eigentum,
          haltung: x.haltung.length ? x.haltung : k.haltung,
          besonders: x.besonders.trim() ? x.besonders : k.besonders,
          faktor: k.faktor,
          faktorGrund: k.faktorGrund,
        }));
        setKontakt((c) => ({ ...c, marke: c.marke || k.marke, instagram: c.instagram || k.instagram }));
      });
    }
    weiter();
  }

  function umschalten(x: KarteProdukt) {
    setAuswahl((l) =>
      l.some((y) => y.titel === x.titel) ? l.filter((y) => y.titel !== x.titel) : l.length < MAX_PRODUKTE ? [...l, x] : l,
    );
  }

  /* Weiter: Regalbreite an die Zahl der Produkte anpassen und im
     Hintergrund je Produkt die Artikelkarte samt Preisurteil schreiben. */
  function produkteWeiter() {
    const mindest = auswahl.length * CM_JE_PRODUKT;
    if (a.cm < mindest) setze("cm", BREITEN.find((b) => b >= mindest) ?? BREITEN[BREITEN.length - 1]);
    if (karte) {
      for (const x of auswahl) {
        if (artikelJe[x.titel] !== undefined) continue;
        setArtikelJe((m) => ({ ...m, [x.titel]: "laedt" }));
        baueArtikel(x, { marke: karte.marke, story: karte.story, web: karte.web }).then((t) =>
          setArtikelJe((m) => ({ ...m, [x.titel]: t })),
        );
      }
    }
    weiter();
  }

  function eigenesUebernehmen() {
    const preis = Number(eigenes.preis.replace(",", "."));
    if (!eigenes.titel.trim() || !(preis > 0)) {
      setFehler({ eigen: "Name und Ladenpreis, dann rechnen wir." });
      return;
    }
    setFehler({});
    umschalten({ titel: eigenes.titel.trim(), preis, bild: null, url: null });
    setEigenes({ titel: "", preis: "" });
  }

  /* ── Ergebnis ── */
  const empfohlen = empfohlenerEinstieg(a, (karte?.produkte.length ?? 0) > 0);
  const einstieg: EinstiegKey = (kontakt.einstieg || "standardregal") as EinstiegKey;

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    const regalwahl = mitRegalwahl(einstieg);
    const payload = {
      name: kontakt.name,
      email: kontakt.email,
      marke: kontakt.marke,
      produkt: auswahl.length
        ? auswahl.map((x) => `${x.titel}${x.preis ? `, ${eur(x.preis)}` : ""}`).join(" · ").slice(0, 600)
        : eigenes.titel,
      website,
      einstieg,
      stationaerGelistet: a.vertrieb ? a.vertrieb !== "nur_shop" : null,
      onlineHandel: karte && karte.produkte.length > 0 ? true : null,
      beratungInteresse: null,
      bundesland: "",
      zone: regalwahl ? a.zone : ("" as const),
      cm: regalwahl ? a.cm : null,
      besondererWert: false,
      begruendung: a.besonders,
      nachricht: kontakt.nachricht,
      bildrechte,
      karte:
        karte && auswahl.length
          ? {
              entwurf: nurEntwurf(karte),
              produkt: auswahl[0],
              artikel: fertig(artikelVon(auswahl[0])),
              weitere: auswahl.slice(1).map((x) => ({ produkt: x, artikel: fertig(artikelVon(x)) })),
            }
          : null,
      assistent: {
        ...a,
        schaetzungMonat: s?.stueck.mitte ?? null,
        passt: r.passt,
        instagram: kontakt.instagram.trim(),
        instagramFreigabe: kontakt.instaFreigabe,
        anfrageId,
      },
      firma2: kontakt.firma2,
    };
    const errs = pruefeBewerbung(payload);
    if (Object.keys(errs).length) {
      setFehler(errs as Record<string, string>);
      return;
    }
    setSenden("sending");
    const res = await submitBewerbung(payload);
    setSenden(res.ok ? "success" : "error");
    if (res.ok) {
      track({
        event_type: "conversion",
        path: window.location.pathname,
        meta: { form: "bewerbung", einstieg, regalkarte: payload.karte !== null, passt: r.passt, assistent: true },
      });
    }
  }

  if (senden === "success") {
    return (
      <div className="apply__done" role="status">
        <p className="apply__done-h">Bewerbung ist da.</p>
        <p>
          Wir sehen uns {produkt ? `„${produkt.titel}“` : "dein Produkt"} an und melden uns innerhalb von zwei
          Werktagen mit einem Termin fürs Onboarding. Deine Regalkarte bringen wir mit.
        </p>
      </div>
    );
  }

  return (
    <div className="apply as" ref={kopf}>
      <div className="as__top">
        <div className="as__bar" aria-hidden="true">
          <i style={{ width: `${((idx + 1) / SCHRITTE.length) * 100}%` }} />
        </div>
        <span className="as__count">
          {schritt === "ergebnis" ? "Dein Ergebnis" : schritt === "kontakt" ? "Letzter Schritt" : `Frage ${idx + 1} von ${FRAGEN}`}
        </span>
        {ki === "laeuft" && schritt !== "website" && (
          <span className="as__ki" role="status">
            <span className="rk__spinner" aria-hidden="true" /> Wir lesen deine Website …
          </span>
        )}
      </div>

      {/* 1 ── Website */}
      {schritt === "website" && (
        <div className="as__step">
          <p className="as__q">Wo finden wir deine Marke?</p>
          <p className="as__sub">
            Wir lesen Logo, Farben und Produkte und bauen dir daraus deine Regalkarte. Dauert 2 Minuten,
            am Ende siehst du, was dein Produkt bei uns verkaufen kann.
          </p>
          <label className="apply__field">
            <span>Shop oder Website</span>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="deinemarke.de" inputMode="url" autoComplete="url" />
          </label>
          <label className="apply__check">
            <input type="checkbox" checked={bildrechte} onChange={(e) => setBildrechte(e.target.checked)} />
            <span>
              <strong>Hub42 darf Logo, Produktbilder und Texte meiner Website nutzen</strong> – für meine
              Regalkarte und meinen Regalplatz. Ich sehe alles vorher und kann es ändern. Website, erkannte Angaben und
              Karte speichern wir auch ohne Bewerbung, um uns ggf. bei dir zu melden; Name und E-Mail erst beim Abschicken.
            </span>
          </label>
          <div className="as__nav">
            <button type="button" className="btn btn--lit" onClick={websiteWeiter} disabled={!!website.trim() && !bildrechte}>
              Los geht’s
            </button>
            {!website.trim() && <span className="as__hint">Keine Website? Einfach weiter.</span>}
            {website.trim() && !bildrechte && <span className="as__hint">Bitte kurz die Bildnutzung freigeben.</span>}
          </div>
        </div>
      )}

      {/* 2 ── Ziel */}
      {schritt === "ziel" && (
        <div className="as__step">
          <p className="as__q">Was willst du mit Hub42 erreichen?</p>
          <p className="as__sub">
            Alles andere lesen wir von deiner Website. Wähl, was zutrifft, gern mehreres.
          </p>
          <div className="as__tiles">
            {(Object.keys(ZIELE) as ZielKey[]).map((z) => {
              const an = a.ziele.includes(z);
              return (
                <Kachel
                  key={z}
                  titel={ZIELE[z].label}
                  hint={ZIELE[z].hint}
                  an={an}
                  onClick={() => setze("ziele", an ? a.ziele.filter((x) => x !== z) : [...a.ziele, z])}
                />
              );
            })}
          </div>
          <Nav zurueck={zurueck} weiter={weiter} weiterAktiv={a.ziele.length > 0} />
        </div>
      )}

      {/* 3 ── Start (Füllfrage, die KI liest derweil) */}
      {schritt === "start" && (
        <div className="as__step">
          <p className="as__q">Wann möchtest du ins Regal?</p>
          <p className="as__sub">Hilft uns, die Onboardings zu planen. Wir eröffnen im März 2027.</p>
          <div className="as__tiles as__tiles--1">
            {(Object.keys(STARTS) as StartKey[]).map((k) => (
              <Kachel key={k} titel={STARTS[k].label} hint={STARTS[k].hint} an={a.start === k} onClick={() => (setze("start", k), weiter())} />
            ))}
          </div>
          <Nav zurueck={zurueck} />
        </div>
      )}

      {/* 4 ── Handelsreife (Füllfrage) */}
      {schritt === "reife" && (
        <div className="as__step">
          <p className="as__q">Was hast du schon für den Handel?</p>
          <p className="as__sub">Hak ab, was es gibt. Was fehlt, ist kein Ausschluss, sondern unser erster Job im Onboarding.</p>
          <div className="as__tiles as__tiles--1">
            {(Object.keys(HANDELSREIFE) as ReifeKey[]).map((k) => {
              const an = a.handelsreife.includes(k);
              return (
                <Kachel
                  key={k}
                  titel={`${an ? "✓ " : ""}${HANDELSREIFE[k]}`}
                  an={an}
                  onClick={() => setze("handelsreife", an ? a.handelsreife.filter((x) => x !== k) : [...a.handelsreife, k])}
                />
              );
            })}
          </div>
          <Nav zurueck={zurueck} weiter={weiter} />
        </div>
      )}

      {/* 5 ── Produkte */}
      {schritt === "produkt" && (
        <div className="as__step">
          <p className="as__q">Welche Produkte sollen ins Regal?</p>
          {ki === "laeuft" && (
            <div className="as__warten" role="status" aria-live="polite">
              <span className="rk__spinner" aria-hidden="true" />
              <span>
                <strong>Einen Moment, wir lesen gerade deinen Shop.</strong>
                {WARTEN[warteIdx % WARTEN.length]}
              </span>
            </div>
          )}
          {ki === "fehler" && <p className="as__sub">{kiGrund}</p>}
          {karte && karte.produkte.length > 0 && (
            <>
              <p className="as__sub">Wähl bis zu {MAX_PRODUKTE}. Pro Produkt rechnen wir mit mindestens {CM_JE_PRODUKT} cm Front.</p>
              <div className="rk__grid">
                {karte.produkte.map((x, i) => {
                  const an = auswahl.some((y) => y.titel === x.titel);
                  return (
                    <button
                      type="button"
                      key={i}
                      className={"rk__prod" + (an ? " is-on" : "")}
                      aria-pressed={an}
                      onClick={() => (x.preis ? umschalten(x) : setEigenes({ titel: x.titel, preis: "" }))}
                    >
                      <span className="rk__prod-bild">
                        {x.bild ? <img src={x.bild} alt="" loading="lazy" /> : null}
                        {an && <b className="rk__prod-haken">✓</b>}
                      </span>
                      <span className="rk__prod-t">{x.titel}</span>
                      {x.preis ? <span className="rk__prod-p">{eur(x.preis)}</span> : null}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {auswahl.filter((x) => !karte?.produkte.some((y) => y.titel === x.titel)).length > 0 && (
            <ul className="as__eigene">
              {auswahl
                .filter((x) => !karte?.produkte.some((y) => y.titel === x.titel))
                .map((x) => (
                  <li key={x.titel}>
                    {x.titel} · {x.preis ? eur(x.preis) : "–"}
                    <button type="button" className="rk__link" onClick={() => umschalten(x)}>
                      entfernen
                    </button>
                  </li>
                ))}
            </ul>
          )}
          <div className="rk__eigen">
            <span>{karte?.produkte.length ? "Oder dazu:" : "Dein Produkt:"}</span>
            <input placeholder="z. B. Hot Sauce 150 ml" value={eigenes.titel} onChange={(e) => setEigenes((x) => ({ ...x, titel: e.target.value }))} />
            <input placeholder="Ladenpreis €" inputMode="decimal" value={eigenes.preis} onChange={(e) => setEigenes((x) => ({ ...x, preis: e.target.value }))} />
            <button type="button" className="btn" onClick={eigenesUebernehmen} disabled={auswahl.length >= MAX_PRODUKTE}>
              Hinzufügen
            </button>
          </div>
          {fehler.eigen && <p className="rk__hint rk__hint--bad">{fehler.eigen}</p>}
          <div className="as__nav">
            <button type="button" className="btn btn--lit" onClick={produkteWeiter} disabled={auswahl.length === 0}>
              {auswahl.length === 0 ? "Weiter" : `Weiter mit ${auswahl.length} ${auswahl.length === 1 ? "Produkt" : "Produkten"}`}
            </button>
            <button type="button" className="rk__link" onClick={zurueck}>
              Zurück
            </button>
          </div>
        </div>
      )}

      {/* 7 ── Regal */}
      {schritt === "regal" && (
        <div className="as__step">
          <p className="as__q">Wie viel Platz {auswahl.length > 1 ? "brauchen deine Produkte" : "braucht dein Produkt"}?</p>
          <p className="as__sub">
            Erst die Höhe, dann die Breite. Ein Glas oder eine Flasche braucht etwa {CM_JE_PRODUKT} cm Front
            {auswahl.length > 1 ? `, für ${auswahl.length} Produkte also mindestens ${auswahl.length * CM_JE_PRODUKT} cm` : ""}.
            {" "}In S passen rund zwei, in M rund fünf.
          </p>
          <div className="as__tiles as__tiles--3">
            {ZONEN_AUFSTEIGEND.map((z) => (
              <Kachel
                key={z}
                titel={ZONES[z].name}
                hint={`${ZONES[z].hoehe} · ${ZONES[z].auf ? `+${ZONES[z].auf} %` : "ohne Zuschlag"} · S ${eur(paketMiete(PAKETE.S.cm, z) ?? 0)}`}
                an={a.zone === z}
                onClick={() => setze("zone", z)}
              />
            ))}
          </div>
          <div className="as__tiles">
            {BREITEN.map((cm) => {
              const istL = cm >= PAKETE.L.abCm;
              return (
                <Kachel
                  key={cm}
                  titel={istL ? `L · ab ${cm} cm` : `${paketFuer(cm)} · ${cm} cm`}
                  hint={`${eur(mieteMonat(a.zone, istL && a.cm >= PAKETE.L.abCm ? a.cm : cm))} / Monat`}
                  an={istL ? a.cm >= PAKETE.L.abCm : a.cm === cm}
                  /* L bleibt stehen, damit die Breite darunter einstellbar ist. */
                  onClick={() => (istL ? setze("cm", Math.max(PAKETE.L.abCm, a.cm)) : (setze("cm", cm), weiter()))}
                />
              );
            })}
          </div>
          {a.cm >= PAKETE.L.abCm && (
            <>
              <label className="apply__field as__wide">
                <span>Breite Regalplatz L: {a.cm} cm</span>
                <input
                  type="range"
                  min={PAKETE.L.abCm}
                  max={MAX_REGAL_CM}
                  step={1}
                  value={a.cm}
                  onChange={(e) => setze("cm", Number(e.target.value))}
                />
              </label>
              <MehrAlsEineEbene href="/termin" className="as__hint" />
            </>
          )}
          <Nav zurueck={zurueck} weiter={weiter} />
        </div>
      )}

      {/* 8 ── Ergebnis */}
      {schritt === "ergebnis" && (
        <div className="as__step as__erg">
          <p className="as__q">
            {r.passt ? "Du passt zu Hub42." : "Ehrlich gesagt: Hub42 ist für dich nicht der erste Schritt."}
          </p>

          {/* Was die KI erkannt hat – oder, ohne Website, hier nachzutragen. */}
          <div className="as__erkannt">
            <div className="as__erkannt-kopf">
              <p className="as__h">{karte ? "Das haben wir über dich erkannt" : "Kurz noch zu dir"}</p>
              {karte && (
                <button type="button" className="rk__link" onClick={() => setKorrigieren((k) => !k)}>
                  {korrigieren ? "Fertig" : "Stimmt nicht? Ändern"}
                </button>
              )}
            </div>
            {karte?.erkanntGrund && !korrigieren && <p className="as__hint">{karte.erkanntGrund}</p>}
            {!korrigieren && karte ? (
              <ul className="as__erkannt-liste">
                <li>
                  <span>Kategorie</span>
                  {a.kategorie || "–"}
                </li>
                <li>
                  <span>Heute erhältlich</span>
                  {a.vertrieb ? VERTRIEB[a.vertrieb].label : <em className="as__unklar">nicht erkennbar</em>}
                </li>
                <li>
                  <span>Haltung</span>
                  {a.haltung.join(" · ") || "–"}
                </li>
              </ul>
            ) : (
              <div className="as__erkannt-form">
                <label className="apply__field">
                  <span>Kategorie</span>
                  <select value={a.kategorie} onChange={(e) => setze("kategorie", e.target.value as AssistentAntworten["kategorie"])}>
                    <option value="">Bitte wählen</option>
                    {KATEGORIEN_KANONISCH.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="apply__field">
                  <span>Wo kann man es heute kaufen?</span>
                  <select value={a.vertrieb} onChange={(e) => setze("vertrieb", e.target.value as AssistentAntworten["vertrieb"])}>
                    <option value="">Bitte wählen</option>
                    {(Object.keys(VERTRIEB) as (keyof typeof VERTRIEB)[]).map((k) => (
                      <option key={k} value={k}>
                        {VERTRIEB[k].label} ({VERTRIEB[k].hint})
                      </option>
                    ))}
                  </select>
                </label>
                <div className="apply__field as__wide">
                  <span>Wofür steht deine Marke?</span>
                  <div className="as__chips">
                    {HALTUNG_TAGS.map((h) => {
                      const an = a.haltung.includes(h);
                      return (
                        <button
                          type="button"
                          key={h}
                          className={"as__chip" + (an ? " is-on" : "")}
                          aria-pressed={an}
                          onClick={() => setze("haltung", an ? a.haltung.filter((x) => x !== h) : [...a.haltung, h as HaltungTag])}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="apply__field as__wide">
                  <span>Was macht dein Produkt besonders?</span>
                  <textarea rows={3} value={a.besonders} onChange={(e) => setze("besonders", e.target.value)} />
                </label>
              </div>
            )}
          </div>

          <div className="as__erg-grid">
            <div className="as__erg-col">
              <ul className="as__rules">
                {r.liste.map((x) => (
                  <li key={x.label} className={x.ok === true ? "is-ok" : x.ok === false ? "is-no" : ""}>
                    <b>{x.ok === true ? "✓" : x.ok === false ? "✕" : "○"}</b>
                    <span>
                      <strong>{x.label}</strong>
                      {x.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {s && rw && <Sichtbarkeit r={rw} />}
          </div>

          {karte && produkt && (
            <div className="as__block">
              <p className="as__h">So würden wir dich am POS bewerben</p>
              <p className="as__sub">
                Muster aus deiner Website. Du darfst deine Karten auch gern selbst gestalten. Wir prüfen alle Karten vor dem
                Druck von Hand und stimmen sie mit dir ab.
              </p>
              <div className="as__pos">
                <figure>
                  <Zoombar label="Herstellerkarte">
                    <HerstellerKarte karte={karte} produkt={auswahl[0] ?? null} />
                  </Zoombar>
                  <figcaption>Herstellerkarte A5 · deine Geschichte am Regal</figcaption>
                </figure>
                {auswahl.map((x) => (
                  <figure key={x.titel}>
                    <Zoombar label={`Artikelkarte ${x.titel}`}>
                      <ArtikelKarte karte={karte} produkt={x} artikel={artikelVon(x)} />
                    </Zoombar>
                    <figcaption>Artikelkarte A6 · direkt neben dem Produkt, mit QR-Bewertung</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
          {!karte && ki === "laeuft" && (
            <p className="as__laden">
              <span className="rk__spinner" aria-hidden="true" /> Deine POS-Karten entstehen gerade …
            </p>
          )}

          {s && rw && produkt?.preis && (
            <div className="as__block">
              <div className="as__kn-grid">
                <Abverkauf a={a} s={s} />
                <RechnungBlock a={a} s={s} r={rw} />
              </div>
              <Rechnung
                produkt={produkt}
                setProdukt={setProdukt}
                verkaeufe={verkaeufe}
                setVerkaeufe={setVerkaeufe}
                zone={a.zone}
                cm={a.cm}
                ohneVergleich
              />
              <p className="rk__fine">
                Schätzung, keine Zusage. Das Alexa-Center zählt rund {zahl(FUNNEL.centerTag)} Besucher am Tag, das
                ist die Zahl des Centers, nicht unseres Ladens. Im Laden rechnen wir mit {FUNNEL.ladenTagVon} bis{" "}
                {FUNNEL.ladenTagBis} Besuchern am Tag (Annahme, gerechnet mit {FUNNEL.ladenTag}) an {VERKAUFSTAGE}{" "}
                Verkaufstagen im Monat (Annahme),{" "}
                {FUNNEL.probieren * 100} % probieren oder scannen,{" "}
                {FUNNEL.kaufen * 100} % davon kaufen, Ø {FUNNEL.warenkorb} € und {FUNNEL.artikelJeEinkauf} Artikel je Einkauf,
                verteilt auf rund {FUNNEL.produkteImLaden} Produkte im Laden. Das sind rund {Math.round(STUECK_PRO_PRODUKT)} Verkäufe
                je Produkt im Monat. Den Faktor für
                dein Produkt ({a.faktor.toLocaleString("de-DE")}) schätzt eine KI aus deiner Website.
              </p>
            </div>
          )}

          <div className="as__block">
            <p className="as__h">Deine Optionen</p>
            {/* Standardregal ist immer dabei, die Stufen sind optional dazu
                (höchstens eine; nochmal klicken nimmt sie wieder raus). */}
            <div className="as__opts">
              <div className="as__opt is-on is-fest">
                <em className="as__opt-fest">Immer dabei</em>
                <strong>Standardregal</strong>
                <b>{eur(mieteMonat(a.zone, a.cm))} / Monat</b>
                <span>
                  Regalplatz {paketFuer(a.cm) ?? "L"}, {a.cm} cm, {ZONES[a.zone].name}, ab 3 Monaten
                </span>
              </div>
              {OPTIONEN.filter((o) => o.key !== "standardregal").map((o) => {
                const an = einstieg === o.key;
                return (
                  <button
                    type="button"
                    key={o.key}
                    className={"as__opt as__opt--plus" + (an ? " is-on" : "")}
                    aria-pressed={an}
                    onClick={() => setKontakt((k) => ({ ...k, einstieg: an ? "standardregal" : o.key }))}
                  >
                    {o.key === empfohlen && <em>Empfohlen</em>}
                    <span className="as__opt-wahl">{an ? "✓ Dazugebucht" : "+ Optional dazu"}</span>
                    <strong>{o.name}</strong>
                    <b>{o.preis}</b>
                    <span>{o.text}</span>
                  </button>
                );
              })}
            </div>
            <p className="as__h as__h--klein">
              Das bekommst du{STUFE_ZU[einstieg] ? ` mit Standardregal und ${STUFE_ZU[einstieg]!.name}` : " im Standardregal"}
            </p>
            <ul className="rk-calc__plus">
              {[...ALLE_STUFEN, ...(STUFE_ZU[einstieg]?.neu ?? [])].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>

          <div className="as__nav">
            <button type="button" className="btn btn--lit" onClick={weiter}>
              {einstieg === "standardregal" ? "Fürs Standardregal bewerben" : `Mit ${EINSTIEGE[einstieg]} bewerben`}
            </button>
            <button type="button" className="rk__link" onClick={zurueck}>
              Antworten ändern
            </button>
          </div>
        </div>
      )}

      {/* 9 ── Kontakt */}
      {schritt === "kontakt" && (
        <form className="as__step" onSubmit={absenden} noValidate>
          <p className="as__q">Wohin schicken wir deinen Onboarding-Termin?</p>
          <div className="apply__grid">
            <label className={"apply__field" + (fehler.marke ? " is-bad" : "")}>
              <span>Marke *</span>
              <input value={kontakt.marke} onChange={(e) => setKontakt((k) => ({ ...k, marke: e.target.value }))} autoComplete="organization" />
              {fehler.marke && <em>{fehler.marke}</em>}
            </label>
            <label className={"apply__field" + (fehler.name ? " is-bad" : "")}>
              <span>Dein Name *</span>
              <input value={kontakt.name} onChange={(e) => setKontakt((k) => ({ ...k, name: e.target.value }))} autoComplete="name" />
              {fehler.name && <em>{fehler.name}</em>}
            </label>
            <label className={"apply__field apply__wide" + (fehler.email ? " is-bad" : "")}>
              <span>E-Mail *</span>
              <input type="email" value={kontakt.email} onChange={(e) => setKontakt((k) => ({ ...k, email: e.target.value }))} autoComplete="email" />
              {fehler.email && <em>{fehler.email}</em>}
            </label>
            <label className="apply__field apply__wide">
              <span>Einstieg {einstiegVonTreppe ? "" : "(unsere Empfehlung)"}</span>
              <select value={einstieg} onChange={(e) => setKontakt((k) => ({ ...k, einstieg: e.target.value as EinstiegKey }))}>
                {(Object.keys(EINSTIEGE) as EinstiegKey[]).map((k) => (
                  <option key={k} value={k}>
                    {EINSTIEGE[k]}
                    {k === empfohlen ? " – empfohlen" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="apply__field apply__wide">
              <span>Instagram {karte?.instagram ? "(von deiner Website)" : "(für unser Marketing)"}</span>
              <input
                value={kontakt.instagram}
                onChange={(e) => setKontakt((k) => ({ ...k, instagram: e.target.value }))}
                placeholder="@deinemarke"
                autoComplete="off"
              />
            </label>
            <label className="apply__check apply__wide">
              <input
                type="checkbox"
                checked={kontakt.instaFreigabe}
                onChange={(e) => setKontakt((k) => ({ ...k, instaFreigabe: e.target.checked }))}
              />
              <span>Hub42 darf uns auf Instagram markieren und unsere Beiträge teilen, wenn wir im Regal stehen.</span>
            </label>
            {!produkt && (
              <label className={"apply__field apply__wide" + (fehler.produkt ? " is-bad" : "")}>
                <span>Produkt *</span>
                <input value={eigenes.titel} onChange={(e) => setEigenes((x) => ({ ...x, titel: e.target.value }))} />
                {fehler.produkt && <em>{fehler.produkt}</em>}
              </label>
            )}
          </div>
          <label className="apply__field">
            <span>Noch etwas?</span>
            <textarea rows={3} value={kontakt.nachricht} onChange={(e) => setKontakt((k) => ({ ...k, nachricht: e.target.value }))} />
          </label>
          <input
            className="apply__hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={kontakt.firma2}
            onChange={(e) => setKontakt((k) => ({ ...k, firma2: e.target.value }))}
          />
          <div className="apply__foot">
            <div className="as__nav">
              <button className="btn btn--lit" type="submit" disabled={senden === "sending"}>
                {senden === "sending" ? "Wird gesendet …" : "Bewerbung abschicken"}
              </button>
              <button type="button" className="rk__link" onClick={zurueck}>
                Zurück zum Ergebnis
              </button>
            </div>
            <p>
              Wir nutzen deine Angaben nur, um deine Bewerbung zu prüfen und dich zu kontaktieren. Mehr dazu im{" "}
              <a href="/datenschutz">Datenschutz</a>.
            </p>
          </div>
          {senden === "error" && (
            <p className="apply__err" role="alert">
              Das hat nicht geklappt. Schreib uns direkt an <a href="mailto:info@tryhub42.de">info@tryhub42.de</a>.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function Kachel({ an, onClick, titel, hint }: { an: boolean; onClick: () => void; titel: string; hint?: string }) {
  return (
    <button type="button" className={"as__tile" + (an ? " is-on" : "")} onClick={onClick} aria-pressed={an}>
      <strong>{titel}</strong>
      {hint && <span>{hint}</span>}
    </button>
  );
}

function Nav({ zurueck, weiter, weiterAktiv = true }: { zurueck: () => void; weiter?: () => void; weiterAktiv?: boolean }) {
  return (
    <div className="as__nav">
      {weiter && (
        <button type="button" className="btn btn--lit" onClick={weiter} disabled={!weiterAktiv}>
          Weiter
        </button>
      )}
      <button type="button" className="rk__link" onClick={zurueck}>
        Zurück
      </button>
    </div>
  );
}

/* ── Ergebnis in drei Blöcken: Sichtbarkeit, Abverkauf, Rechnung ──
   Texte aus copy/assistent-ergebnis.md, Zahlen aus lib/assistent-model.ts. */

const tag1 = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Sichtbarkeit({ r }: { r: RechnungWerte }) {
  return (
    <div className="as__erg-col">
      <p className="as__h">Sichtbarkeit</p>
      <p className="as__zahl">
        {zahl(r.besucherMonat)}
        <small> Menschen im Laden je Monat (Annahme)</small>
      </p>
      <ul className="as__facts">
        <li>
          <b>{eur(r.kostenJe1000)}</b> kostet dich dein Regalplatz je 1.000 Ladenbesucher.
        </li>
        <li>
          Online zahlst du für Einblendungen auf einem Bildschirm. Hier zahlst du für Menschen, die im Laden stehen.
        </li>
      </ul>
      <p className="as__hint">
        Annahme: {FUNNEL.ladenTagVon} bis {FUNNEL.ladenTagBis} Besucher am Tag im Laden, gerechnet mit {FUNNEL.ladenTag} an{" "}
        {VERKAUFSTAGE} Verkaufstagen. Wie viele davon an deinem Regal stehen bleiben, wissen wir erst, wenn der Laden offen
        ist.
      </p>
    </div>
  );
}

function Abverkauf({ a, s }: { a: AssistentAntworten; s: Schaetzung }) {
  return (
    <div className="as__erg-col">
      <p className="as__h">Abverkauf</p>
      <p className="as__zahl">
        {s.stueck.tief} bis {s.stueck.hoch}
        <small> Verkäufe im Monat (Schätzung)</small>
      </p>
      {a.faktorGrund && <p className="as__sub">{a.faktorGrund}</p>}
      <ul className="as__facts">
        <li>
          <b>≈ {zahl(s.probiererMonat)}</b>{" "}
          {a.kategorie === "Food" || a.kategorie === "Drinks" ? "probieren oder scannen" : "scannen oder nehmen"} dein
          Produkt in die Hand
        </li>
        <li>
          <b>Rund {euro0(s.umsatzMonat)}</b> Umsatz im Monat zu deinem Ladenpreis, wenn die mittlere Schätzung eintrifft.
        </li>
      </ul>
      <p className="as__hint">Schätzung, keine Zusage. Echte Zahlen gibt es ab April 2027 im Monatsbericht.</p>
    </div>
  );
}

function RechnungBlock({ a, s, r }: { a: AssistentAntworten; s: Schaetzung; r: RechnungWerte }) {
  const platz = paketFuer(a.cm) ?? "L";
  const Z = ZONES[a.zone];
  const { tief, hoch } = s.stueck;
  return (
    <div className="as__kn">
      <p className="as__h">Rechnung</p>
      <p className="as__sub">
        Regalplatz {platz} · {Z.name}: <b>{eur(r.miete)}</b> im Monat, netto
      </p>
      <p className="as__kern">
        {r.schwelleTag < 1
          ? "Weniger als ein Verkauf am Tag, und dein Regalplatz bezahlt sich selbst."
          : `Dein Regalplatz bezahlt sich ab ${tag1(r.schwelleTag)} Verkäufen am Tag selbst.`}
      </p>
      <p className="as__sub">
        Ab {r.schwelle} Verkäufen im Monat deckt dein Umsatz nach {HUB_MARGIN_PCT} % Provision die Miete. Das sind{" "}
        {tag1(r.schwelleTag)} am Tag.
      </p>
      <p className="as__sub">
        {r.fall === "darunter"
          ? `Deine geschätzten ${tief} bis ${hoch} Verkäufe holen ${r.anteilMin} bis ${r.anteilMax} % der Miete zurück. Den Rest zahlst du für die Sichtbarkeit.`
          : r.fall === "dazwischen"
            ? `Trifft die obere Schätzung ein, deckt dein Umsatz die Miete. Trifft die untere ein, holst du ${r.anteilMin} % der Miete zurück.`
            : `Schon die vorsichtige Schätzung deckt die Miete: ${r.anteilMin} bis ${r.anteilMax} %. Was darüber liegt, bleibt dir.`}
      </p>
      <p className="as__hint">
        Gerechnet mit deinem Ladenpreis ohne Umsatzsteuer, vor Wareneinsatz. {VERKAUFSTAGE} Verkaufstage im Monat
        (Annahme). Mindestlaufzeit 3 Monate, danach monatlich kündbar.
      </p>
    </div>
  );
}
