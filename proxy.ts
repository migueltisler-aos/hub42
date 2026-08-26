import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Muss synchron zu config.matcher am Dateiende bleiben – der Matcher entscheidet,
// ob proxy() überhaupt läuft, diese Liste, ob dann das Passwort geprüft wird.
// Bewusst /feedback/admin und nicht /feedback: der In-Store-QR-Flow
// (/feedback/scan, /feedback/r/*, /feedback/onboarding, /feedback/thanks)
// muss öffentlich bleiben.
const PIPELINE_GESCHUETZT = [
  "/pipeline",
  "/wareneingang",
  "/bestand",
  "/feedback/leads",
  "/feedback/admin",
  "/admin",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PIPELINE_GESCHUETZT.some((pfad) => pathname === pfad || pathname.startsWith(`${pfad}/`))) {
    if (pathname === "/pipeline/login") {
      return NextResponse.next();
    }

    const auth = request.cookies.get("pipeline_auth")?.value;
    const expected = process.env.PIPELINE_PASSWORD;

    if (!auth || auth !== expected) {
      const loginUrl = new URL("/pipeline/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/pipeline/:path*",
    "/wareneingang/:path*",
    "/bestand/:path*",
    "/feedback/leads/:path*",
    "/feedback/admin/:path*",
    "/admin/:path*",
  ],
};
