export interface Erlebnis {
  id: string;
  icon: string;
  titel: string;
  kurzBeschreibung: string;
  vollBeschreibung: string;
  schritte?: string[];
  kosten?: string;
  highlight?: string;
}

export const ERLEBNISSE: Erlebnis[] = [
  {
    id: "tasting-bar",
    icon: "👁️",
    titel: "Tasting Bar",
    kurzBeschreibung: "Probieren bevor du kaufst",
    vollBeschreibung:
      "Jede Woche neue Brands. Kostenlos probieren – ohne Kaufzwang. Wer probiert kauft öfter als wer nur schaut.",
    highlight: "Wer probiert kauft öfter als wer nur schaut.",
  },
  {
    id: "blind-box",
    icon: "📦",
    titel: "Blind Box",
    kurzBeschreibung: "Versiegelt. Überraschend. Unwiderstehlich.",
    vollBeschreibung:
      "Nur die Kategorie ist bekannt – was drin ist erfährst du zuhause. Entdeckerbox S · M · Berliner Box · Saisonbox.",
    kosten: "25–49 €",
    highlight: "Nur Kategorie bekannt – alles andere Überraschung.",
  },
  {
    id: "scouts-club",
    icon: "⭐",
    titel: "Scouts Club",
    kurzBeschreibung: "Du kennst eine Brand die hier reingehört?",
    vollBeschreibung:
      "Sag es uns. Wenn wir sie aufnehmen bekommst du ein kostenloses Produkt von ihr.",
    highlight: "Du weißt wer der nächste ist – bevor alle anderen es wissen.",
  },
];
