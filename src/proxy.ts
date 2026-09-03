import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes = ["/dashboard", "/inventory", "/sales", "/sales-log", "/notifications", "/admin", "/account"];

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return false;

  try {
    const configuredSecret = process.env.JWT_SECRET?.trim();
    if (!configuredSecret || configuredSecret.length < 32) {
      if (process.env.NODE_ENV === "production") return false;
      await jwtVerify(token, new TextEncoder().encode("clothflow-dev-secret-key-for-local-use-123456"));
      return true;
    }
    await jwtVerify(token, new TextEncoder().encode(configuredSecret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionIsValid = await hasValidSession(request);
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isProtectedRoute && !sessionIsValid) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("session");
    return response;
  }

  if (isAuthRoute && sessionIsValid) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inventory/:path*",
    "/sales/:path*",
    "/sales-log/:path*",
    "/notifications/:path*",
    "/admin/:path*",
    "/account/:path*",
    "/login",
    "/register",
  ],
};
