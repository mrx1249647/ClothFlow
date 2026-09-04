import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager";
  avatarUrl?: string | null;
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
  } satisfies SessionUser;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
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
