import { NextResponse } from "next/server";
import { initializeDatabase, query } from "@/lib/db";

export async function GET(request: Request) {
  await initializeDatabase();
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?verified=invalid", request.url));

  const result = await query(
    `UPDATE users SET email_verified = true, status = 'active', verification_token = NULL, verification_expires = NULL WHERE verification_token = $1 AND verification_expires > NOW() RETURNING id`,
    [token],
  );
  return NextResponse.redirect(new URL(result.rowCount ? "/login?verified=success" : "/login?verified=invalid", request.url));
}