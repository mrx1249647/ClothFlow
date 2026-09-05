import { NextResponse } from "next/server";

import { clearSessionCookie, getSessionUser } from "@/lib/auth";
import { initializeDatabase, query } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    await clearSessionCookie();
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  await initializeDatabase();
  const result = await query(`SELECT shop_name, default_seller, trial_ends_at FROM users WHERE id = $1;`, [user.id]);
  const settings = result.rows[0];

  return NextResponse.json({ authenticated: true, user: { ...user, shopName: settings?.shop_name || null, defaultSeller: settings?.default_seller || null, trialEndsAt: settings?.trial_ends_at || null } });
}
