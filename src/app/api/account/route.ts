import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { clearSessionCookie, getSessionUser } from "@/lib/auth";
import { initializeDatabase, query } from "@/lib/db";
import { sendAccountEmail } from "@/lib/email";
import { isSameOrigin } from "@/lib/request-security";

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "انتهت الجلسة" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const shopName = typeof body.shopName === "string" ? body.shopName.trim() : undefined;
    const defaultSeller = typeof body.defaultSeller === "string" ? body.defaultSeller.trim() : undefined;

    if (name && name.length < 2) {
      return NextResponse.json({ message: "الاسم قصير جدًا" }, { status: 400 });
    }

    await initializeDatabase();
    const current = await query("SELECT name, email, password_hash FROM users WHERE id = $1", [user.id]);
    const account = current.rows[0] as { name: string; email: string; password_hash: string | null } | undefined;
    if (!account) {
      return NextResponse.json({ message: "الحساب غير موجود" }, { status: 404 });
    }

    if (newPassword) {
      if (newPassword.length < 8 || !currentPassword) {
        return NextResponse.json({ message: "أدخل كلمة المرور الحالية وكلمة مرور جديدة من 8 أحرف على الأقل" }, { status: 400 });
      }
      const valid = account.password_hash ? await bcrypt.compare(currentPassword, account.password_hash) : false;
      if (!valid) {
        return NextResponse.json({ message: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, user.id]);
      await sendAccountEmail({
        to: account.email,
        subject: "تم تغيير كلمة مرور ClothFlow",
        html: `<p>مرحبًا ${account.name}،</p><p>تم تغيير كلمة مرور حسابك بنجاح.</p><p>إذا لم تكن أنت، تواصل مع مسؤول النظام فورًا.</p>`,
      });
    }

    if (name) {
      await query("UPDATE users SET name = $1 WHERE id = $2", [name, user.id]);
    }
    if (shopName !== undefined || defaultSeller !== undefined) {
      await query("UPDATE users SET shop_name = COALESCE($1, shop_name), default_seller = COALESCE($2, default_seller) WHERE id = $3", [shopName || null, defaultSeller || null, user.id]);
    }

    const updated = await query("SELECT id, name, email, role, shop_name, default_seller, trial_ends_at FROM users WHERE id = $1", [user.id]);
    return NextResponse.json({ user: updated.rows[0], passwordChanged: Boolean(newPassword) });
  } catch (error) {
    console.error("account-update-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "انتهت الجلسة" }, { status: 401 });
  await initializeDatabase();
  const result = await query(`SELECT id, name, email, role, shop_name, default_seller, trial_ends_at FROM users WHERE id = $1;`, [user.id]);
  return NextResponse.json({ user: result.rows[0] });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "انتهت الجلسة" }, { status: 401 });
  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";
    await initializeDatabase();
    const result = await query(`SELECT password_hash FROM users WHERE id = $1;`, [user.id]);
    const passwordHash = result.rows[0]?.password_hash as string | null | undefined;
    if (!passwordHash || !password || !(await bcrypt.compare(password, passwordHash))) {
      return NextResponse.json({ message: "أدخل كلمة المرور الصحيحة لتأكيد حذف الحساب" }, { status: 400 });
    }
    if (user.role === "admin") return NextResponse.json({ message: "لا يمكن حذف حساب المدير من هنا" }, { status: 403 });
    await query(`DELETE FROM users WHERE id = $1;`, [user.id]);
    await clearSessionCookie();
    return NextResponse.json({ message: "تم حذف الحساب" });
  } catch (error) {
    console.error("account-delete-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}