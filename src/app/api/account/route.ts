import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
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

    if (name && name.length < 2) {
      return NextResponse.json({ message: "الاسم قصير جدًا" }, { status: 400 });
    }

    const current = await query("SELECT name, email, password_hash FROM users WHERE id = $1", [user.id]);
    const account = current.rows[0];
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

    const updated = await query("SELECT id, name, email, role FROM users WHERE id = $1", [user.id]);
    return NextResponse.json({ user: updated.rows[0], passwordChanged: Boolean(newPassword) });
  } catch (error) {
    console.error("account-update-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}