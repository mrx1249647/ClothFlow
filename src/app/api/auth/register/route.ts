import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { initializeDatabase, query } from "@/lib/db";
import { registerSchema } from "@/lib/validators";
import { sendAccountEmail } from "@/lib/email";
import { randomBytes } from "node:crypto";
import { isSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  try {
    await initializeDatabase();
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات غير صالحة" },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;
    const existing = await query(`SELECT id FROM users WHERE email = $1;`, [email]);

    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ message: "البريد الإلكتروني مسجل سابقاً" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString("hex");
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, status, verification_token, verification_expires) VALUES ($1, $2, $3, 'manager', 'pending', $4, NOW() + INTERVAL '24 hours') RETURNING id, name, email, role, status;`,
      [name, email, passwordHash, verificationToken],
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendAccountEmail({
      to: email,
      subject: "تأكيد حساب ClothFlow",
      html: `<p>مرحبًا ${name}،</p><p>اضغط على الرابط لتأكيد حسابك:</p><p><a href="${appUrl}/api/auth/verify?token=${verificationToken}">تأكيد الحساب</a></p>`,
    });

    return NextResponse.json({ user: result.rows[0], message: "تم إنشاء الحساب بنجاح" }, { status: 201 });
  } catch (error) {
    console.error("register-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
