import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/session";

// Next 16: `proxy` replaces `middleware`. Every page needs the signed admin cookie.
export async function proxy(request) {
  const ok = await verifySessionValue(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = request.nextUrl.pathname === "/login";
  if (!ok && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (ok && isLogin) return NextResponse.redirect(new URL("/contenus", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
