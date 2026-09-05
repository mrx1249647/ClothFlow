import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { createSessionToken } from "@/lib/auth";
import { initializeDatabase, query } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { isSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  try {
    await initializeDatabase();
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات تسجيل الدخول غير صالحة" },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const userResult = await query(
      `SELECT id, name, email, password_hash, role, status, avatar_url, shop_name, default_seller, trial_ends_at FROM users WHERE email = $1;`,
      [email],
    );

    const user = userResult.rows[0] as { id: string; name: string; email: string; password_hash: string | null; role: "admin" | "manager"; status: string; avatar_url?: string | null; shop_name?: string | null; default_seller?: string | null; trial_ends_at?: string | null } | undefined;
    if (!user) {
      return NextResponse.json({ message: "البريد الإلكتروني غير موجود" }, { status: 401 });
    }

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@clothflow.com";
    const configuredAdminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "";
    let isValid = false;

    if (user.password_hash) {
      isValid = await bcrypt.compare(password, user.password_hash);
    }

    if (!isValid && email === adminEmail && configuredAdminPassword && password === configuredAdminPassword) {
      const freshHash = await bcrypt.hash(configuredAdminPassword, 10);
      await query(
        `UPDATE users SET password_hash = $1, role = 'admin', status = 'active', name = COALESCE(name, 'Admin') WHERE email = $2;`,
        [freshHash, email],
      );
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ message: "كلمة المرور غير صحيحة" }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json({ message: "الحساب غير مفعل بعد. راجع لوحة التحكم أو طلب التفعيل." }, { status: 403 });
    }

    if (user.role !== "admin" && user.trial_ends_at && new Date(user.trial_ends_at) < new Date()) {
      return NextResponse.json({ message: "انتهت الفترة التجريبية. تواصل مع مسؤول النظام لتفعيل الحساب." }, { status: 403 });
    }

    const token = await createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url as string | null,
      shopName: user.shop_name,
      defaultSeller: user.default_seller,
      trialEndsAt: user.trial_ends_at,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ message: "تم تسجيل الدخول بنجاح", user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatar_url, shopName: user.shop_name, defaultSeller: user.default_seller, trialEndsAt: user.trial_ends_at } });
  } catch (error) {
    console.error("login-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم", error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
