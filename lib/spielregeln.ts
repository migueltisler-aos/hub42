/* Partnervereinbarung Retailtest Beeskow als Text, eine Quelle für die Seite
 * /marke/spielregeln (lesen, drucken) und die Zustimmung in den Stammdaten.
 * Wortgleich mit projekte/261111-beeskow-raumplan/Testkaufhaus_Partnervereinbarung_Beeskow.docx
 * im Marketing-Workspace, Stand 2026-11-23 (ohne EAN-Pflicht).
 * Jede inhaltliche Änderung hebt SPIELREGELN_VERSION, damit klar ist, welcher Fassung eine Marke zugestimmt hat. */

export const SPIELREGELN_VERSION = "2026-11-23";
export const SPIELREGELN_TITEL = "Partnervereinbarung Retailtest Beeskow";
export const SPIELREGELN_ZUSTIMMUNG_TEXT =
  "Ich habe die Spielregeln der Partnervereinbarung gelesen und nehme sie für meine Marke an.";

/** Die Daten des Retailtests, die in der Anlage für alle gleich sind. */
export const RETAILTEST = {
  laden: "Das Testkaufhaus Beeskow Seenland Oder-Spree, Berliner Str. 4, 15848 Beeskow",
  zeitraum: "30.11.2026 bis 22.12.2026",
  lieferadresse: "Hub42 UG (haftungsbeschränkt), c/o Valuedfriends Innovation GmbH, Spreeinsel 6, 15848 Beeskow",
  lieferfrist: "26.11.2026",
  regalmiete: "0 Euro",
  provision: "7 % auf den Bruttoverkaufspreis",
};

export type Absatz = string | { liste: string[] };

export const VERSPRECHEN: Absatz[] = [
  "Du hast ein Produkt, das gut ist. Das Problem: Es kommt nicht ins Regal. Der Einkauf fragt „Wie dreht das Produkt?“, und ohne echte Zahlen bekommst du nicht mal einen Termin. Online kaufst du Aufmerksamkeit, die morgen wieder weg ist.",
  "Wir kennen das. Wir haben 20 Jahre auf der anderen Seite des Tisches gestanden, in Logistik und Handel. Deshalb haben wir das Testkaufhaus gebaut: einen Laden nur für Neuheiten, mit echter Kasse statt Umfrage. Bevor wir im Alexa Berlin öffnen, testen wir in Beeskow zur Weihnachtsmarktzeit. Du kannst dabei sein, 4 Wochen ohne Regalmiete.",
  "So läuft es:",
  {
    liste: [
      "Ins Regal. Du schickst uns deine Ware, wir stellen sie ins Regal. Regalmiete: 0 Euro.",
      "Verkaufen und lernen. Wir verkaufen, verkosten und erzählen deine Story. Nach 4 Wochen bekommst du deine Zahlen.",
      "Weitergehen. Mit echten Abverkaufsdaten gehst du in den nächsten Schritt, zum Beispiel ins Testkaufhaus im Alexa Berlin.",
    ],
  },
  "Ehrlich gesagt: Beeskow ist nicht der Alexanderplatz. Wir rechnen mit etwa einem Zehntel der Besucher, die wir später im Alexa erwarten. Der Test bringt dir also keine großen Stückzahlen, sondern erste echte Käufe, Feedback aus Tastings und einen Platz in der ersten Reihe, wenn das Testkaufhaus in Berlin öffnet. Deshalb kostet er dich keine Miete: Der Retailtest wird vom IVB Accelerator gefördert. Die Plätze sind begrenzt, wir wählen die Marken aus.",
  "Was auf dem Spiel steht: Ohne Beweis bleibt dein Produkt ein Geheimtipp. Mit Beweis wird es eine Listung.",
  "Die Ware bleibt deine, der Preis bleibt deiner. Wir verdienen nur, wenn du verkaufst.",
];

export const FAIR: { thema: string; wir: string; du: string }[] = [
  { thema: "Ware", wir: "Wir lagern und verkaufen sorgfältig, Eigentum bleibt bei dir", du: "Du lieferst verkaufsfertige Ware mit allen Pflichtangaben" },
  { thema: "Preis", wir: "Wir verkaufen zu deinem Preis, ohne Rabatt ohne deine Zustimmung", du: "Du nennst einen festen Verkaufspreis inkl. USt" },
  { thema: "Kosten", wir: "4 Wochen Regal ohne Miete, wir verdienen nur 7 % auf deinen Verkauf", du: "Du trägst den Versand zu uns, den Rückversand zahlen wir" },
  { thema: "Geld", wir: "Abrechnung und Auszahlung bis zum 10. des Monats nach Testende", du: "Du wählst: Rechnung von dir oder Gutschrift von uns" },
  { thema: "Verkauf", wir: "Tastings und Beratung kostenlos, in den 7 % enthalten", du: "Du stellst Probierware für Tastings" },
  { thema: "Schwund", wir: "Wir ersetzen jedes verlorene Stück mit 50 % des Verkaufspreises, max. 25 Euro", du: "Du trägst die andere Hälfte" },
  { thema: "Nachschub", wir: "Wir melden niedrigen Bestand rechtzeitig", du: "Du lieferst innerhalb von 7 Tagen nach" },
  { thema: "Ausstieg", wir: "Der Test endet nach 4 Wochen automatisch, keine Kündigung, keine Folgekosten", du: "Du sagst uns, wohin die Restware zurück soll" },
];

export const REGELN: { titel: string; text: Absatz[] }[] = [
  { titel: "Wer mit wem", text: ["Vertragspartner sind die Hub42 UG (haftungsbeschränkt), Spreeinsel 6, 15848 Beeskow, Betreiberin des Testkaufhaus und des Retailtests in Beeskow („wir“), und die Marke aus der Anlage („du“)."] },
  { titel: "Kommission", text: ["Wir verkaufen deine Ware im eigenen Namen auf deine Rechnung (Kommission nach § 383 HGB). Wir kaufen nichts an und haben keinen Abnahmezwang."] },
  { titel: "Eigentum", text: ["Die Ware bleibt dein Eigentum, bis ein Kunde sie bezahlt. Nicht verkaufte Ware gehört jederzeit dir."] },
  { titel: "Preis", text: ["Du legst den Verkaufspreis inkl. USt fest. Preisänderungen meldest du 7 Tage vorher in Textform. Rabatte und Aktionen nur mit deiner Zustimmung."] },
  {
    titel: "Vergütung",
    text: [
      "Wir erhalten:",
      { liste: ["keine Regalmiete für die 4 Wochen des Retailtests, gefördert durch den IVB Accelerator,", "7 % Provision auf den Bruttoverkaufspreis, Zahlungsabwicklung inklusive."] },
      "Alle Beträge verstehen sich zzgl. gesetzlicher USt.",
    ],
  },
  { titel: "Abrechnung", text: ["Bis zum 10. des Monats nach Testende bekommst du eine Abrechnung mit allen Verkäufen und den Verkaufserlös abzüglich Provision. Weitere Kosten gibt es nicht. Du wählst in der Anlage: Entweder du stellst uns eine Rechnung, oder wir erstellen dir eine Gutschrift (§ 14 Abs. 2 UStG). Die Gutschrift geht in der Regel schneller. Bist du Kleinunternehmer, rechnen wir auf Basis des Nettopreises ab."] },
  { titel: "Lieferung und Ware", text: ["Du trägst Versandkosten und Transportrisiko bis in den Laden. Den Rückversand übernehmen wir auf unsere Kosten. Jedes Produkt braucht Kennzeichnung nach LMIV (bei Lebensmitteln), Herstellerangaben nach GPSR und eine LUCID-Registrierung. Du haftest für Qualität, Kennzeichnung und Produktsicherheit."] },
  { titel: "Nachschub und MHD", text: ["Wir melden niedrigen Bestand, du lieferst innerhalb von 7 Tagen nach. Ware mit MHD melden wir 4 Wochen vor Ablauf. Du entscheidest dann: Abholung oder Abverkauf zum reduzierten Preis."] },
  { titel: "Schwund", text: ["Geht Ware bei uns verloren, etwa durch Diebstahl, Bruch oder weil sie unauffindbar ist, ersetzen wir dir je Stück 50 % des vereinbarten Verkaufspreises, höchstens 25 Euro pro Stück. Damit ist der Schwund abgegolten."] },
  { titel: "Haftung", text: ["Wir lagern deine Ware mit der Sorgfalt eines ordentlichen Kaufmanns. Wir haften unbegrenzt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper und Gesundheit. Sonst haften wir nur für wesentliche Pflichten und begrenzt auf den typischen, vorhersehbaren Schaden."] },
  { titel: "Tastings", text: ["Tastings sind kostenlos und in den 7 % enthalten. Du stellst die Probierware, sie wird nicht abgerechnet und zählt nicht als Schwund."] },
  { titel: "Daten", text: ["Du bekommst deine Abverkaufszahlen sowie anonyme Käuferdaten (Geschlecht, Altersklasse) und das Tasting-Feedback. Wir dürfen deine Daten anonymisiert und zusammengefasst für Auswertungen nutzen. Wir nennen dich nur mit deiner Zustimmung als Referenz."] },
  { titel: "Marke und Bilder", text: ["Du erlaubst uns, Namen, Logo und Produktbilder für Laden, Website und Social Media zu nutzen, auch über das Testende hinaus, bis du widerrufst. Ein Widerruf in Textform reicht, bereits gedrucktes Material dürfen wir aufbrauchen."] },
  { titel: "Laufzeit", text: ["Der Retailtest läuft 4 Wochen ab dem Starttermin in der Anlage und endet dann automatisch, ohne Kündigung. Aus wichtigem Grund können beide Seiten früher aussteigen. Ein Wechsel ins Alexa Berlin danach ist freiwillig, siehe Nr. 17."] },
  { titel: "Ende", text: ["Nach Testende schicken wir dir deine Restware innerhalb von 14 Tagen auf unsere Kosten zurück, außer du holst sie selbst ab. Danach rechnen wir final ab."] },
  { titel: "Wenn der Test ausfällt", text: ["Findet der Retailtest nicht statt, sagen wir dir sofort Bescheid. Schon gelieferte Ware schicken wir dir auf unsere Kosten zurück."] },
  {
    titel: "Weiter ins Alexa Berlin",
    text: [
      "Willst du nach dem Test ins Testkaufhaus im Alexa Berlin, gelten diese Spielregeln weiter, mit diesen Änderungen:",
      {
        liste: [
          "Miete: Du zahlst eine Regalmiete von ________ Euro netto im Monat, monatlich im Voraus.",
          "Laufzeit: Mindestens 3 Monate ab Regalstart, danach monatlich zum Monatsende kündbar.",
          "Rückversand: Wer beendet, zahlt. Kündigst du, holst du deine Ware ab oder zahlst den Rückversand. Kündigen wir, schließen den Laden oder nehmen ein Produkt raus, zahlen wir.",
          "Schwund: Du trägst bis zu 2 % der gelieferten Menge je Quartal. Darüber ersetzen wir je Stück 50 % des Verkaufspreises, höchstens 25 Euro. Bruch durch unzureichende Verpackung trägst du.",
        ],
      },
      "Den Wechsel bestätigen wir mit einer neuen Anlage.",
    ],
  },
  { titel: "Schluss", text: ["Änderungen in Textform. Ist eine Regel unwirksam, gilt der Rest weiter. Es gilt deutsches Recht."] },
];

/** Fragen fürs Verkaufsteam, Schlüssel = Feld in brand_konditionen.verkaufsteam (jsonb). */
export const VERKAUFSTEAM_FRAGEN: { key: string; frage: string; hilfe?: string }[] = [
  { key: "verkostung", frage: "So wird verkostet", hilfe: "Menge, Temperatur, Kombination, z. B. pur, auf Brot, gekühlt" },
  { key: "fuer_wen", frage: "Für wen ist es?", hilfe: "Zielgruppe, Anlass, z. B. Geschenk, Frühstück, Sport" },
  { key: "ein_satz", frage: "Dein Produkt in einem Satz: Warum soll man es kaufen?" },
  { key: "story", frage: "Deine Story: Wer steckt dahinter, wie kam es dazu?" },
  { key: "ueberzeugt", frage: "Was überzeugt Kunden erfahrungsgemäß am meisten?", hilfe: "Satz, Frage oder Moment" },
  { key: "nicht_sagen", frage: "Was sollen wir nicht sagen?", hilfe: "z. B. Heilversprechen, falsche Vergleiche" },
  { key: "material", frage: "Material, das du mitschickst", hilfe: "Aufsteller, Flyer, Bilder, Video" },
];

export type Verkaufsteam = { tasting?: boolean | null } & Partial<Record<string, string | boolean | null>>;
