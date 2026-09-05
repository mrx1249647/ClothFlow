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
    const result = await query(`UPDATE users SET email_verified = true, status = 'active', email_verification_code_hash = NULL, email_verification_code_expires = NULL WHERE LOWER(email) = $1 AND email_verification_code_hash = $2 AND email_verification_code_expires > NOW() RETURNING id;`, [email, hashVerificationCode(code)]);
    if (!result.rowCount) return NextResponse.json({ message: "الرمز غير صحيح أو منتهي الصلاحية" }, { status: 400 });
    return NextResponse.json({ message: "تم تأكيد الحساب بنجاح" });
  } catch (error) {
    console.error("verify-code-error", error);
    return NextResponse.json({ message: "تعذر تأكيد الحساب" }, { status: 500 });
  }
}