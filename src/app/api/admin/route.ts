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
  const result = await query(`SELECT id, name, email, role, status, trial_ends_at, created_at FROM users ORDER BY created_at DESC;`);
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
    const { userId, status, action } = body;

    if (action === "trial") {
      if (!userId) return NextResponse.json({ message: "بيانات غير مكتملة" }, { status: 400 });
      await initializeDatabase();
      const trial = await query(`UPDATE users SET status = 'active', trial_ends_at = NOW() + INTERVAL '30 days' WHERE id = $1 AND role <> 'admin' RETURNING id;`, [userId]);
      if (!trial.rowCount) return NextResponse.json({ message: "لا يمكن فتح تجربة لهذا الحساب" }, { status: 400 });
      await logAudit(user.id, `${user.name} فتح فترة تجريبية 30 يومًا للحساب`);
      return NextResponse.json({ message: "تم فتح فترة تجريبية 30 يومًا" });
    }

    if (action === "delete") {
      if (!userId || userId === user.id) return NextResponse.json({ message: "لا يمكن حذف حساب المدير الحالي" }, { status: 400 });
      await initializeDatabase();
      await query(`DELETE FROM users WHERE id = $1 AND role <> 'admin';`, [userId]);
      await logAudit(user.id, `${user.name} حذف حسابًا من لوحة الإدارة`);
      return NextResponse.json({ message: "تم حذف الحساب" });
    }

    if (!userId || !["active", "pending", "blocked"].includes(status)) {
      return NextResponse.json({ message: "بيانات غير مكتملة" }, { status: 400 });
    }

    await initializeDatabase();
    await query(`UPDATE users SET status = $1 WHERE id = $2;`, [status, userId]);
    await logAudit(user.id, `${user.name} غيّر حالة الحساب إلى: ${status}`);
    await logNotification(user.id, {
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
