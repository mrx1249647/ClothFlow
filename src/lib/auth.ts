import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { initializeDatabase, query } from "@/lib/db";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager";
  avatarUrl?: string | null;
  shopName?: string | null;
  defaultSeller?: string | null;
  trialEndsAt?: string | null;
};

const getJwtSecret = () => {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret && configuredSecret.length >= 32) return new TextEncoder().encode(configuredSecret);
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be configured with at least 32 characters");

  return new TextEncoder().encode("clothflow-dev-secret-key-for-local-use-123456");
};

export async function createSessionToken(user: SessionUser) {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    shopName: user.shopName,
    defaultSeller: user.defaultSeller,
    trialEndsAt: user.trialEndsAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());

  return {
    id: String(payload.id ?? ""),
    name: String(payload.name ?? ""),
    email: String(payload.email ?? ""),
    role: String(payload.role ?? "manager") as SessionUser["role"],
    avatarUrl: payload.avatarUrl ? String(payload.avatarUrl) : null,
    shopName: payload.shopName ? String(payload.shopName) : null,
    defaultSeller: payload.defaultSeller ? String(payload.defaultSeller) : null,
    trialEndsAt: payload.trialEndsAt ? String(payload.trialEndsAt) : null,
  } satisfies SessionUser;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    await initializeDatabase();
    const user = await verifySessionToken(token);
    const result = await query(`SELECT status, trial_ends_at FROM users WHERE id = $1;`, [user.id]);
    const account = result.rows[0];
    if (!account || account.status !== "active") return null;
    if (user.role !== "admin" && account.trial_ends_at && new Date(String(account.trial_ends_at)) < new Date()) return null;
    return user;
  } catch {
    return null;
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}
