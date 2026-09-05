import { NextResponse } from "next/server";
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
    if (!email || !/^\d{6}$/.test(code)) return NextResponse.json({ message: "أدخل البريد والرمز المكون من 6 أرقام" }, { status: 400 });
    const result = await query(`SELECT id, password_reset_code_hash, password_reset_code_expires, password_reset_attempts FROM users WHERE LOWER(email) = $1;`, [email]);
    const account = result.rows[0];
    if (!account || Number(account.password_reset_attempts || 0) >= 5 || !account.password_reset_code_expires || new Date(String(account.password_reset_code_expires)) <= new Date() || account.password_reset_code_hash !== hashVerificationCode(code)) {
      if (account) await query(`UPDATE users SET password_reset_attempts = password_reset_attempts + 1 WHERE id = $1;`, [account.id]);
      return NextResponse.json({ message: "الرمز غير صحيح أو منتهي الصلاحية" }, { status: 400 });
    }
    return NextResponse.json({ verified: true, message: "تم التحقق من الرمز" });
  } catch (error) {
    console.error("password-reset-verify-error", error);
    return NextResponse.json({ message: "تعذر التحقق من الرمز" }, { status: 500 });
  }
}