import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getNotifications, initializeDatabase } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
  }

  await initializeDatabase();
  const notifications = await getNotifications(30);
  return NextResponse.json({ notifications });
}
