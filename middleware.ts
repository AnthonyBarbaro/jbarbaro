import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/admin/appointments")) {
    return NextResponse.next();
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!expectedPassword || cookieValue !== expectedPassword) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/appointments/:path*"],
};
