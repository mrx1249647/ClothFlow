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
    const type = body.type === "password" ? "password" : "account";
    if (!email || !email.includes("@")) return NextResponse.json({ message: "أدخل بريدًا إلكترونيًا صالحًا" }, { status: 400 });

    const result = await query(`SELECT id, name, status, email_verified, email_verification_code_expires, password_reset_code_expires FROM users WHERE LOWER(email) = $1;`, [email]);
    const account = result.rows[0];
    if (!account) return NextResponse.json({ message: "إذا كان البريد مسجلًا، فسيصلك رمز تحقق خلال لحظات" });
    if (type === "account" && account.email_verified) return NextResponse.json({ message: "هذا الحساب مؤكد بالفعل. يمكنك تسجيل الدخول." });

    const expiresAt = type === "password" ? account.password_reset_code_expires : account.email_verification_code_expires;
    if (expiresAt && new Date(String(expiresAt)) > new Date()) {
      const retryAfter = Math.max(1, Math.ceil((new Date(String(expiresAt)).getTime() - Date.now()) / 1000));
      return NextResponse.json({ message: "تم إرسال رمز مؤخرًا. انتظر انتهاء المؤقت قبل طلب رمز جديد.", retryAfter }, { status: 429 });
    }

    const code = createVerificationCode();
    const codeHash = hashVerificationCode(code);
    if (type === "password") {
      await query(`UPDATE users SET password_reset_code_hash = $1, password_reset_code_expires = NOW() + INTERVAL '10 minutes', password_reset_attempts = 0 WHERE id = $2;`, [codeHash, account.id]);
    } else {
      await query(`UPDATE users SET email_verification_code_hash = $1, email_verification_code_expires = NOW() + INTERVAL '10 minutes' WHERE id = $2 AND email_verified = false;`, [codeHash, account.id]);
    }

    const subject = type === "password" ? "رمز إعادة تعيين كلمة مرور ClothFlow" : "رمز تأكيد حساب ClothFlow";
    await sendAccountEmail({
      to: email,
      subject,
      html: `<div dir="rtl"><h2>${type === "password" ? "إعادة تعيين كلمة المرور" : "تأكيد حساب ClothFlow"}</h2><p>مرحبًا ${String(account.name)},</p><p>رمز التحقق المؤقت الخاص بك:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>ينتهي الرمز خلال 10 دقائق.</p></div>`,
    });

    return NextResponse.json({ message: "تم إرسال رمز تحقق جديد. يمكنك طلب رمز آخر بعد 10 دقائق.", retryAfter: 600 });
  } catch (error) {
    console.error("resend-code-error", error);
    return NextResponse.json({ message: "تعذر إرسال الرمز حاليًا. تحقق من إعدادات البريد." }, { status: 500 });
  }
}
