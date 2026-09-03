import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth";
import { initializeDatabase, query } from "@/lib/db";

type GoogleProfile = { sub: string; email: string; name?: string; email_verified?: boolean };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectToLogin = (reason: string) => NextResponse.redirect(new URL(`/login?oauth=${reason}`, request.url));
  if (!code || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return redirectToLogin("google-not-configured");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: `${appUrl}/api/auth/google/callback`, grant_type: "authorization_code" }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) return redirectToLogin("google-failed");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const profile = (await profileResponse.json()) as GoogleProfile;
    if (!profileResponse.ok || !profile.email || !profile.email_verified) return redirectToLogin("google-email-unverified");

    await initializeDatabase();
    const existing = await query("SELECT id, name, email, role FROM users WHERE google_id = $1 OR email = $2", [profile.sub, profile.email]);
    let user = existing.rows[0];
    if (user) {
      await query("UPDATE users SET google_id = $1, email_verified = true, status = 'active' WHERE id = $2", [profile.sub, user.id]);
    } else {
      const created = await query("INSERT INTO users (name, email, role, status, email_verified, google_id) VALUES ($1, $2, 'manager', 'active', true, $3) RETURNING id, name, email, role", [profile.name || profile.email.split("@")[0], profile.email, profile.sub]);
      user = created.rows[0];
    }

    const token = await createSessionToken(user);
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) {
    console.error("google-auth-error", error);
    return redirectToLogin("google-failed");
  }
}