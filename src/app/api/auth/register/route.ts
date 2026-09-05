import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { initializeDatabase, query } from "@/lib/db";
import { registerSchema } from "@/lib/validators";
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
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, status, email_verified, trial_ends_at) VALUES ($1, $2, $3, 'manager', 'active', true, NOW() + INTERVAL '3 days') RETURNING id, name, email, role, status, trial_ends_at;`,
      [name, email.toLowerCase(), passwordHash],
    );

    return NextResponse.json({ user: result.rows[0], message: "تم إنشاء الحساب. لديك فترة تجربة 3 أيام. للتفعيل الكامل تواصل مع مطور الموقع." }, { status: 201 });
  } catch (error) {
    console.error("register-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
