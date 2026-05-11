import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/pipeline")) {
    return NextResponse.next();
  }

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

export const config = {
  matcher: ["/pipeline/:path*"],
};
