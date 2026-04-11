export type BrandCategory =
  | "Spirits"
  | "Feinkost"
  | "Kosmetik"
  | "Supplements"
  | "Schokolade"
  | "Tee"
  | "Kaffee"
  | "Craft Bier";

export type BrandTier = "Juwel" | "Platform Brand" | "Anker" | "Ikone";

export interface Brand {
  id: string;
  name: string;
  kategorie: BrandCategory;
  kategorieSlug: string;
  tagline: string;
  beschreibung: string;
  herkunft: string;
  tier: BrandTier;
  url?: string;
  featured?: boolean;
  accentColor: string;
  initials: string;
  slug: string;
}

export const BRANDS: Brand[] = [
  {
    id: "ikani",
    name: "Ikani",
    kategorie: "Feinkost",
    kategorieSlug: "feinkost",
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
    id: "green-naturals",
    name: "Green Naturals",
    kategorie: "Supplements",
    kategorieSlug: "supplements",
    tagline: "Nahrungsergänzung ohne Kompromisse",
    beschreibung:
      "Hochwertige Supplements aus natürlichen Rohstoffen. Transparent deklariert, wissenschaftlich formuliert, konsequent nachhaltig.",
    herkunft: "Berlin",
    tier: "Juwel",
    url: "https://greennaturals.de",
    featured: true,
    accentColor: "#2d6a4f",
    initials: "GN",
    slug: "green-naturals",
  },
  {
    id: "havel-wasser",
    name: "Havel Wasser",
    kategorie: "Spirits",
    kategorieSlug: "spirits",
    tagline: "Gin & Feinkost aus Brandenburg",
    beschreibung:
      "Handwerklich destilliert an der Havel. Botanicals aus Brandenburger Wäldern. Ein Gin der seinen Ursprung trägt.",
    herkunft: "Brandenburg an der Havel",
    tier: "Platform Brand",
    url: "https://havelwasser.de",
    featured: true,
    accentColor: "#1e3a5f",
    initials: "HW",
    slug: "havel-wasser",
  },
  {
    id: "berliner-berg",
    name: "Berliner Berg",
    kategorie: "Craft Bier",
    kategorieSlug: "spirits",
    tagline: "Craft Bier aus dem Herzen Berlins",
    beschreibung:
      "Seit 2014 brauen wir Bier das Charakter hat. Von der Berliner Weiße bis zum Imperial Stout – immer handwerklich, immer authentisch.",
    herkunft: "Berlin Neukölln",
    tier: "Anker",
    url: "https://berlinerberg.de",
    featured: false,
    accentColor: "#7a1e1e",
    initials: "BB",
    slug: "berliner-berg",
  },
  {
    id: "teekampagne",
    name: "Teekampagne",
    kategorie: "Tee",
    kategorieSlug: "tee",
    tagline: "Darjeeling direkt vom Berg",
    beschreibung:
      "Weltgrößter Darjeeling-Importeur in Einzelportionen. Direkthandel mit Bergbauern seit 1985. Günstiger als der Supermarkt, besser als alles andere.",
    herkunft: "Darjeeling / Berlin",
    tier: "Ikone",
    url: "https://teekampagne.de",
    featured: true,
    accentColor: "#C8D86A",
    initials: "TK",
    slug: "teekampagne",
  },
  {
    id: "theyo",
    name: "Theyo",
    kategorie: "Schokolade",
    kategorieSlug: "schokolade",
    tagline: "Craft Schokolade aus Berlin",
    beschreibung:
      "Bean-to-bar Schokolade handgefertigt in Berlin. Kakaobohnen aus fairem Direkthandel, verarbeitet mit höchster Handwerkskunst.",
    herkunft: "Berlin Prenzlauer Berg",
    tier: "Juwel",
    url: "https://theyo.de",
    featured: false,
    accentColor: "#5c2d0e",
    initials: "TH",
    slug: "theyo",
  },
  {
    id: "tekoha",
    name: "Tekoha",
    kategorie: "Kaffee",
    kategorieSlug: "kaffee",
    tagline: "Matekaffee mit Berliner Seele",
    beschreibung:
      "Energetisierend, natürlich, unkonventionell. Mate trifft Kaffee – für alle die beides wollen.",
    herkunft: "Berlin",
    tier: "Juwel",
    featured: false,
    accentColor: "#3d5a1e",
    initials: "TC",
    slug: "tekoha",
  },
];

export const KATEGORIEN = [
  { label: "Alle", slug: "alle" },
  { label: "Spirits", slug: "spirits" },
  { label: "Feinkost", slug: "feinkost" },
  { label: "Kosmetik", slug: "kosmetik" },
  { label: "Supplements", slug: "supplements" },
  { label: "Schokolade", slug: "schokolade" },
  { label: "Tee", slug: "tee" },
  { label: "Kaffee", slug: "kaffee" },
];
