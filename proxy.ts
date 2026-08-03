import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PIPELINE_GESCHUETZT = ["/pipeline", "/wareneingang", "/bestand"];

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
  matcher: ["/pipeline/:path*", "/wareneingang/:path*", "/bestand/:path*"],
};
