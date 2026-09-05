import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { initializeDatabase, query } from "@/lib/db";
import { registerSchema } from "@/lib/validators";
import { isSameOrigin } from "@/lib/request-security";
import { createVerificationCode, hashVerificationCode } from "@/lib/verification";
import { sendAccountEmail } from "@/lib/email";

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
    const code = createVerificationCode();
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, status, email_verified, email_verification_code_hash, email_verification_code_expires, trial_ends_at) VALUES ($1, $2, $3, 'manager', 'pending', false, $4, NOW() + INTERVAL '10 minutes', NOW() + INTERVAL '30 days') RETURNING id, name, email, role, status, trial_ends_at;`,
      [name, email.toLowerCase(), passwordHash, hashVerificationCode(code)],
    );
    await sendAccountEmail({ to: email, subject: "رمز تأكيد حساب ClothFlow", html: `<div dir="rtl"><h2>مرحبًا بك في ClothFlow</h2><p>رمز تأكيد حسابك:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>ينتهي الرمز خلال 10 دقائق.</p></div>` });

    return NextResponse.json({ user: result.rows[0], message: "تم إنشاء الحساب. تحقق من بريدك لإكمال التفعيل." }, { status: 201 });
  } catch (error) {
    console.error("register-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
