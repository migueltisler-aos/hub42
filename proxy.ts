import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/pipeline")) {
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

  if (pathname.startsWith("/feedback/admin")) {
    if (pathname === "/feedback/admin/login") {
      return NextResponse.next();
    }

    const auth = request.cookies.get("feedback_admin_auth")?.value;
    const expected = process.env.FEEDBACK_PASSWORD;

    if (!auth || auth !== expected) {
      const loginUrl = new URL("/feedback/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/pipeline/:path*", "/feedback/admin/:path*"],
};
