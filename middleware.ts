import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { navForRole } from "@/lib/rbac";

const SECRET = process.env.JWT_SECRET || "dev-secret";
const secretKey = new TextEncoder().encode(SECRET);
const COOKIE_NAME = "sms_session";
const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/me", "/api/auth/logout", "/api/internal/fee-reminders"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_API_PATHS.includes(pathname)
  ) {
    return NextResponse.next();
  }
  const isApi = pathname.startsWith("/api/");

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let valid = false;
  let role = "";
  if (token) {
    try {
      // jose uses the Web Crypto API, which (unlike the Node "crypto" module
      // that jsonwebtoken relies on) is supported in the Edge Runtime that
      // Next.js middleware always runs on.
      const { payload } = await jwtVerify(token, secretKey);
      valid = true;
      role = typeof payload.role === "string" ? payload.role : "";
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    if (isApi) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isApi) {
    const modulePath = pathname === "/api/uploads" || pathname.startsWith("/api/uploads/")
      ? "/profile"
      : pathname === "/api/notification-preferences" || pathname.startsWith("/api/notification-preferences/")
      ? "/notifications"
      : pathname === "/api/streams" || pathname.startsWith("/api/streams/")
      ? "/classes"
      : pathname.replace(/^\/api(?=\/|$)/, "");
    const allowed = navForRole(role).some((item) =>
      modulePath === item.href || modulePath.startsWith(`${item.href}/`),
    );
    if (!allowed) {
      return NextResponse.json({ error: "You do not have permission to access this module." }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
