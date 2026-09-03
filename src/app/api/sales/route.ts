import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { initializeDatabase, logAudit, logNotification, query } from "@/lib/db";
import { saleSchema } from "@/lib/validators";
import { isSameOrigin } from "@/lib/request-security";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
  }

  await initializeDatabase();
  const result = await query(`SELECT s.*, p.name AS product_name FROM sales s JOIN products p ON p.id = s.product_id ORDER BY s.created_at DESC;`);
  return NextResponse.json({ sales: result.rows });
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
    const parsed = saleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || "بيانات البيع غير صالحة" }, { status: 400 });
    }

    const { productId, quantity, customer, soldBy } = parsed.data;
    const productResult = await query(`SELECT * FROM products WHERE id = $1;`, [productId]);
    const product = productResult.rows[0];

    if (!product) {
      return NextResponse.json({ message: "المنتج غير موجود" }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ message: "الكمية المطلوبة تتجاوز المخزون الحالي" }, { status: 400 });
    }

    const total = Number(product.price) * Number(quantity);
    const saleResult = await query(
      `INSERT INTO sales (product_id, quantity, total, customer, sold_by) VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
      [productId, quantity, total, customer, soldBy],
    );

    await query(`UPDATE products SET stock = stock - $1 WHERE id = $2;`, [quantity, productId]);
    await logNotification({
      type: "sale",
      title: "تمت عملية بيع جديدة",
      description: `${customer} اشترى ${quantity} وحدات من ${product.name} بقيمة ${total} ر.س`,
    });
    await logAudit(`${user.name} سجل بيعًا: ${customer} - ${product.name}`);

    return NextResponse.json({ sale: saleResult.rows[0], message: "تم تسجيل البيع بنجاح" }, { status: 201 });
  } catch (error) {
    console.error("sales-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
