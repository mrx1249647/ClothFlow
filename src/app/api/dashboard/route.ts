import { NextResponse } from "next/server";

import { getDashboardStats, getNotifications, getProducts, getSales, getUsers, initializeDatabase } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
  }

  await initializeDatabase();
  const [stats, products, sales, notifications, users] = await Promise.all([
    getDashboardStats(),
    getProducts(),
    getSales(),
    getNotifications(10),
    getUsers(),
  ]);

  return NextResponse.json({
    user,
    stats,
    products,
    sales,
    notifications,
    users,
  });
}
