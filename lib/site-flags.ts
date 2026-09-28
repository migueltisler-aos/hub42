// Schalter für Inhalte, die schon gebaut sind, aber noch nicht live dürfen.
//
// Beide greifen auf der Startseite (/) und auf /hersteller. Ein Schalter
// blendet die Sektion UND jeden Hinweis darauf aus (Nav, Treppe, Preise,
// Formularfeld), damit keine toten Links auf #beratung stehen bleiben.

/** Geförderte Beratung über das BAFA-Programm "Förderung von
    Unternehmensberatungen für KMU". Erst auf true, wenn die BAFA-Listung als
    Berater vorliegt UND die Förderrichtlinie über 2026 hinaus bestätigt ist. */
export const SHOW_BAFA = false;

/** BIFI als wissenschaftlicher Partner, "Feedback Factory" als Ladenmarke
    und die Pilotzahlen von 2018/2019. Erst auf true, wenn die Freigabe von
    BIFI schriftlich vorliegt. */
export const SHOW_PARTNER = false;
