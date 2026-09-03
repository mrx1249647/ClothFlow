import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { initializeDatabase, logAudit, logNotification, query } from "@/lib/db";
import { isSameOrigin } from "@/lib/request-security";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  }

  await initializeDatabase();
  const result = await query(`SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC;`);
  return NextResponse.json({ users: result.rows });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !["active", "pending", "blocked"].includes(status)) {
      return NextResponse.json({ message: "بيانات غير مكتملة" }, { status: 400 });
    }

    await initializeDatabase();
    await query(`UPDATE users SET status = $1 WHERE id = $2;`, [status, userId]);
    await logAudit(`${user.name} غيّر حالة الحساب إلى: ${status}`);
    await logNotification({
      type: "account",
      title: "تحديث حالة حساب",
      description: `تم تحديث حالة الحساب إلى ${status}`,
    });

    return NextResponse.json({ message: "تم تحديث حالة الحساب بنجاح" });
  } catch (error) {
    console.error("admin-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
