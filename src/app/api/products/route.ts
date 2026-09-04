import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { initializeDatabase, logAudit, logNotification, query } from "@/lib/db";
import { productSchema } from "@/lib/validators";
import { isSameOrigin } from "@/lib/request-security";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
  }

  await initializeDatabase();
  const result = await query(`SELECT * FROM products ORDER BY created_at DESC;`);
  return NextResponse.json({ products: result.rows, user });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
  }

  try {
    await initializeDatabase();
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || "بيانات المنتج غير صالحة" }, { status: 400 });
    }

    const { name, category, stock, price, imageUrl } = parsed.data;
    const result = await query(
      `INSERT INTO products (name, category, stock, price, image_url, sizes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
      [name, category, stock, price, imageUrl || null, JSON.stringify(parsed.data.sizes)],
    );

    await logNotification({
      type: "product",
      title: "تمت إضافة منتج جديد",
      description: `${name} بإجمالي ${stock} قطعة في المخزون`,
    });
    await logAudit(`${user.name} أضاف منتجًا جديدًا: ${name}`);

    return NextResponse.json({ product: result.rows[0], message: "تم حفظ المنتج" }, { status: 201 });
  } catch (error) {
    console.error("products-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
