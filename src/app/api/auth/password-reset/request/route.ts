import { NextResponse } from "next/server";
import { initializeDatabase, query } from "@/lib/db";
import { sendAccountEmail } from "@/lib/email";
import { createVerificationCode, hashVerificationCode } from "@/lib/verification";
import { isSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  try {
    await initializeDatabase();
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) return NextResponse.json({ message: "أدخل بريدًا إلكترونيًا صالحًا" }, { status: 400 });
    const account = await query(`SELECT id, name, email FROM users WHERE LOWER(email) = $1;`, [email]);
    if (account.rowCount) {
      const code = createVerificationCode();
      await query(`UPDATE users SET password_reset_code_hash = $1, password_reset_code_expires = NOW() + INTERVAL '10 minutes', password_reset_attempts = 0 WHERE id = $2;`, [hashVerificationCode(code), account.rows[0].id]);
      await sendAccountEmail({ to: email, subject: "رمز إعادة تعيين كلمة مرور ClothFlow", html: `<div dir="rtl"><h2>إعادة تعيين كلمة المرور</h2><p>مرحبًا ${String(account.rows[0].name)},</p><p>رمز التحقق المؤقت الخاص بك:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>ينتهي الرمز خلال 10 دقائق. إذا لم تطلب ذلك، تجاهل الرسالة.</p></div>` });
    }
    return NextResponse.json({ message: "إذا كان البريد مسجلًا، فسيصلك رمز تحقق خلال لحظات" });
  } catch (error) {
    console.error("password-reset-request-error", error);
    return NextResponse.json({ message: "تعذر إرسال الرمز حاليًا" }, { status: 500 });
  }
}