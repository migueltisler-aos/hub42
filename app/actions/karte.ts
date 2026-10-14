"use server";

import { headers } from "next/headers";
import { artikelAusWebsite, karteAusWebsite } from "@/lib/karte";
import { anfrageAnlegen, anfrageFortschreiben } from "@/lib/ki-anfragen";
import type { ArtikelTexte, KarteEntwurf, KarteProdukt } from "@/lib/karte-model";

/* Bremse gegen Dauerfeuer: je IP höchstens LIMIT Karten pro Stunde. Hält nur
   pro Serverinstanz, reicht aber gegen Spielerei und Schleifen – jeder Aufruf
   (eine Karte plus bis zu fünf Artikel je Anfrage)
   kostet einen Claude-Call. */
const LIMIT = 30;
const FENSTER_MS = 60 * 60 * 1000;
const aufrufe = new Map<string, number[]>();

async function bremse(): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || "unbekannt";
  const jetzt = Date.now();
  const frisch = (aufrufe.get(ip) ?? []).filter((t) => jetzt - t < FENSTER_MS);
  if (frisch.length >= LIMIT) return false;
  aufrufe.set(ip, [...frisch, jetzt]);
  return true;
}

/** Texte der A6-Artikelkarte, sobald die Marke ihr Produkt gewählt hat. */
export async function baueArtikel(
  produkt: KarteProdukt,
  marke: { marke: string; story: string; web: string },
): Promise<ArtikelTexte | null> {
  if (!produkt?.titel || !(await bremse())) return null;
  try {
    return await artikelAusWebsite(
      { ...produkt, titel: produkt.titel.slice(0, 120) },
      { marke: marke.marke.slice(0, 80), story: marke.story.slice(0, 600), web: marke.web.slice(0, 120) },
    );
  } catch (e) {
    console.error("baueArtikel:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function baueKarte(
  website: string,
  marke: string,
  bildrechte: boolean,
): Promise<{ ok: true; karte: KarteEntwurf; anfrageId: string | null } | { ok: false; grund: string }> {
  // Ohne Freigabe lesen wir die Seite gar nicht erst.
  if (!bildrechte) return { ok: false, grund: "Bitte erst die Nutzung deiner Bilder freigeben." };
  if (!website.trim()) return { ok: false, grund: "Trag deine Website ein." };

  if (!(await bremse())) {
    return { ok: false, grund: "Für heute genug Karten gebaut. Schick die Bewerbung einfach ab." };
  }

  try {
    const karte = await karteAusWebsite(website.slice(0, 300), marke.slice(0, 80));
    if (!karte) {
      return {
        ok: false,
        grund: "Deine Seite konnten wir nicht lesen. Kein Problem: Die Karte bauen wir im Onboarding mit dir.",
      };
    }
    const anfrageId = await anfrageAnlegen(website, karte);
    return { ok: true, karte, anfrageId };
  } catch (e) {
    console.error("baueKarte:", e instanceof Error ? e.message : e);
    return { ok: false, grund: "Das hat gerade nicht geklappt. Die Bewerbung kannst du trotzdem abschicken." };
  }
}

/** Fortschritt einer KI-Anfrage (Schritt, Produkte, Antworten), ohne Personendaten. */
export async function meldeSchritt(
  anfrageId: string,
  schritt: string,
  produkte?: KarteProdukt[],
  antworten?: Record<string, unknown>,
): Promise<void> {
  await anfrageFortschreiben(anfrageId, { schritt, produkte, antworten });
}
