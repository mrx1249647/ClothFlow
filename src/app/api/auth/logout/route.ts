import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  await clearSessionCookie();

  return NextResponse.json({ message: "تم تسجيل الخروج" });
}
