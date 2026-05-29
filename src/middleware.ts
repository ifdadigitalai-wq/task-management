import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/session";

const PUBLIC_PATHS = ["/login"];
const RESET_PATH = "/reset-password";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  // No token — redirect to login
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);

  // Invalid/expired token — redirect to login
  if (!payload) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - /api/auth/* (login, logout, reset-password API routes must be public)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};