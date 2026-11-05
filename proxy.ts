import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// PIPELINE_GESCHUETZT entscheidet, wo das Passwort geprüft wird. Der Matcher
// am Dateiende lässt proxy() auf jeder Seite laufen, weil die CRM-Adresse
// (CRM_HOSTS) jeden Pfad abfangen muss.
// Bewusst /feedback/admin und nicht /feedback: der In-Store-QR-Flow
// (/feedback/scan, /feedback/r/*, /feedback/onboarding, /feedback/thanks)
// muss öffentlich bleiben.
const PIPELINE_GESCHUETZT = [
  "/pipeline",
  "/wareneingang",
  "/bestand",
  "/kasse",
  "/feedback/leads",
  "/feedback/admin",
  "/admin",
  "/crm",
];

/** Unter diesen Adressen läuft nur das CRM des Testkaufhaus. */
const CRM_HOSTS = ["crm.testkaufhaus.de"];

const OFFEN = ["/pipeline/login", "/crm/login"];

const passt = (pathname: string, pfad: string) => pathname === pfad || pathname.startsWith(`${pfad}/`);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  // CRM-Adresse: die internen Werkzeuge (Marken, Angebote, Wareneingang …) bleiben
  // erreichbar, die öffentlichen Hub42-Seiten führen nach Aufgaben.
  if (CRM_HOSTS.includes(host) && !PIPELINE_GESCHUETZT.some((pfad) => passt(pathname, pfad))) {
    return NextResponse.redirect(new URL("/crm/aufgaben", request.url));
  }

  if (!PIPELINE_GESCHUETZT.some((pfad) => passt(pathname, pfad)) || OFFEN.includes(pathname)) {
    return NextResponse.next();
  }

  const auth = request.cookies.get("pipeline_auth")?.value;
  if (auth && auth === process.env.PIPELINE_PASSWORD) {
    return NextResponse.next();
  }

  // Das CRM und die CRM-Adresse haben einen eigenen Login im Testkaufhaus-Look,
  // der Rest unter tryhub42 den der Pipeline.
  const login = passt(pathname, "/crm") || CRM_HOSTS.includes(host) ? "/crm/login" : "/pipeline/login";
  const loginUrl = new URL(login, request.url);
  loginUrl.searchParams.set("from", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Alles außer Next-Interna, API und Dateien mit Endung (Bilder, Fonts, robots.txt).
  matcher: ["/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};
