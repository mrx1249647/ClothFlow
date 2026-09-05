import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initializeDatabase, query } from "@/lib/db";
import { hashVerificationCode } from "@/lib/verification";
import { isSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  try {
    await initializeDatabase();
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !/^\d{6}$/.test(code) || password.length < 8) return NextResponse.json({ message: "البيانات غير صالحة" }, { status: 400 });
    const result = await query(`SELECT id, password_reset_code_hash, password_reset_code_expires, password_reset_attempts FROM users WHERE LOWER(email) = $1;`, [email]);
    const account = result.rows[0];
    if (!account || Number(account.password_reset_attempts || 0) >= 5 || !account.password_reset_code_expires || new Date(String(account.password_reset_code_expires)) <= new Date() || account.password_reset_code_hash !== hashVerificationCode(code)) return NextResponse.json({ message: "الرمز غير صحيح أو منتهي الصلاحية" }, { status: 400 });
    await query(`UPDATE users SET password_hash = $1, password_reset_code_hash = NULL, password_reset_code_expires = NULL, password_reset_attempts = 0 WHERE id = $2;`, [await bcrypt.hash(password, 12), account.id]);
    return NextResponse.json({ message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    console.error("password-reset-complete-error", error);
    return NextResponse.json({ message: "تعذر تغيير كلمة المرور" }, { status: 500 });
  }
}