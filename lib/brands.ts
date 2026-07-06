export type BrandCategory =
  | "Feinkost"
  | "Supplements"
  | "Kaffee"
  | "Granola"
  | "Hot Sauce"
  | "Lifestyle";

export type BrandTier = "Juwel" | "Platform Brand" | "Anker" | "Ikone";

export interface Brand {
  id: string;
  name: string;
  kategorie: BrandCategory;
  kategorieSlug: string;
  /** Flagship-Produkt – Headline der Produkt-First-Karte */
  produktName: string;
  /** Konkrete Produkte / Sorten als Pills */
  produkte: string[];
  /** Pfad zum echten Produktbild in /public/brands */
  bild?: string;
  /** "contain" = freigestelltes Produkt schwebt (Default), "cover" = randfüllendes Foto */
  bildFit?: "contain" | "cover";
  tagline: string;
  beschreibung: string;
  herkunft: string;
  tier: BrandTier;
  url?: string;
  featured?: boolean;
  /** Akzentfarbe – Verlauf hinter dem Produktbild + Fallback-Platzhalter */
  accentColor: string;
  initials: string;
  slug: string;
}

export const BRANDS: Brand[] = [
  {
    id: "berlin-oats",
    name: "Berlin Oats",
    kategorie: "Granola",
    kategorieSlug: "granola",
    produktName: "Crunchy Granola",
    produkte: ["Matcha", "Six Spice"],
    bild: "/brands/berlin-oats-matcha.png",
    tagline: "Crunchy. Fein. Anders.",
    beschreibung:
      "Granola neu gedacht – maximaler Crunch, ungewöhnliche Zutaten, keine künstlichen Zusätze. Bewusster Genuss aus Berlin.",
    herkunft: "Berlin",
    tier: "Juwel",
    url: "https://www.berlinoats.com",
    featured: true,
    accentColor: "#8BAE6A",
    initials: "BO",
    slug: "berlin-oats",
  },
  {
    id: "crazy-bastard",
    name: "Crazy Bastard Sauce",
    kategorie: "Hot Sauce",
    kategorieSlug: "hot-sauce",
    produktName: "7 Pot Tropical",
    produkte: ["7 Pot Tropical", "Ghost Pepper & Mango", "Jalapeño & Date"],
    bild: "/brands/crazy-bastard-7pot.png",
    tagline: "Hot Sauce Done Right",
    beschreibung:
      "Seit 2013 in Neukölln handgemacht: rund 1.200 Flaschen täglich aus gerösteten Chilis, ohne Zuckerzusatz. Schärfe mit Charakter.",
    herkunft: "Berlin Neukölln",
    tier: "Juwel",
    url: "https://www.crazybsauce.com",
    featured: true,
    accentColor: "#C0392B",
    initials: "CB",
    slug: "crazy-bastard",
  },
  {
    id: "lchtnbrg",
    name: "Lchtnbrg",
    kategorie: "Lifestyle",
    kategorieSlug: "lifestyle",
    produktName: "Postkarten & Magnete",
    produkte: ["Postkarten", "Magnete", "Sticker"],
    bild: "/brands/lchtnbrg-postkarten.jpg",
    bildFit: "cover",
    tagline: "Trashig-schöne Meme-Kultur aus Berlin.",
    beschreibung:
      "Streetwear, Postkarten, Magnete & mehr mit Lichtenberg-Attitude. Schräg, bunt, unverkennbar Berlin – Merch das man verschenkt und behält.",
    herkunft: "Berlin Lichtenberg",
    tier: "Juwel",
    url: "https://lchtnbrg.com",
    featured: true,
    accentColor: "#D98CA8",
    initials: "LB",
    slug: "lchtnbrg",
  },
  {
    id: "ikani",
    name: "Ikani",
    kategorie: "Feinkost",
    kategorieSlug: "feinkost",
    produktName: "Bourbon-Vanille",
    produkte: ["Vanilleschoten", "Vanille-Extrakt"],
    bild: "/brands/ikani-vanille.jpg",
    tagline: "Echte Vanille aus Bali",
    beschreibung:
      "Direkthandel mit balinesischen Vanillebauern. Keine Zwischenhändler, maximale Qualität – für alle die wissen was echte Vanille ist.",
    herkunft: "Bali / Berlin",
    tier: "Juwel",
    url: "https://ikani.de",
    featured: true,
    accentColor: "#8B6914",
    initials: "IK",
    slug: "ikani",
  },
  {
    id: "auteniq",
    name: "auteniQ",
    kategorie: "Feinkost",
    kategorieSlug: "feinkost",
    produktName: "Bio-Olivenöl",
    produkte: ["Olivenöl", "Balsamico", "Ibérico"],
    bild: "/brands/auteniq-olivenoel.png",
    tagline: "Feinkost direkt vom Erzeuger",
    beschreibung:
      "Feinkost & Delikatessen direkt vom Erzeuger. Geprüfte Manufakturen, transparente Herkunft – von Olivenöl bis Ibérico.",
    herkunft: "Deutschland",
    tier: "Platform Brand",
    url: "https://auteniq.de",
    featured: false,
    accentColor: "#1F3A5F",
    initials: "AQ",
    slug: "auteniq",
  },
  {
    id: "green-naturals",
    name: "Green Naturals",
    kategorie: "Supplements",
    kategorieSlug: "supplements",
    produktName: "Ashwagandha 2.500 mg",
    produkte: ["Ashwagandha", "Shilajit", "Spermidin"],
    bild: "/brands/green-naturals-ashwagandha.png",
    tagline: "Nahrungsergänzung ohne Kompromisse",
    beschreibung:
      "Vegane, hochdosierte Supplements aus natürlichen Rohstoffen. Abgefüllt und laborgeprüft in Deutschland, transparent deklariert.",
    herkunft: "Deutschland",
    tier: "Juwel",
    url: "https://www.green-naturals.de",
    featured: true,
    accentColor: "#2d6a4f",
    initials: "GN",
    slug: "green-naturals",
  },
  {
    id: "tekoha",
    name: "Tekoha",
    kategorie: "Kaffee",
    kategorieSlug: "kaffee",
    produktName: "Matekaffee",
    produkte: ["Löslicher Mate", "Zuckerfrei"],
    bild: "/brands/tekoha-matekaffee.jpg",
    tagline: "Matekaffee mit Berliner Seele",
    beschreibung:
      "Die lösliche Kaffeealternative aus 100 % geröstetem Mate. Natürliches Koffein, in Sekunden zubereitet, ohne Zucker und Zusätze.",
    herkunft: "Berlin / Paraguay",
    tier: "Juwel",
    url: "https://tekoha.de",
    featured: false,
    accentColor: "#3d5a1e",
    initials: "TC",
    slug: "tekoha",
  },
];

export const KATEGORIEN = [
  { label: "Alle", slug: "alle" },
  { label: "Granola", slug: "granola" },
  { label: "Hot Sauce", slug: "hot-sauce" },
  { label: "Lifestyle", slug: "lifestyle" },
  { label: "Feinkost", slug: "feinkost" },
  { label: "Supplements", slug: "supplements" },
  { label: "Kaffee", slug: "kaffee" },
];
