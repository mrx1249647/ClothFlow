import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { initializeDatabase, logAudit, logNotification, query } from "@/lib/db";
import { saleSchema } from "@/lib/validators";
import { isSameOrigin } from "@/lib/request-security";
import { randomUUID } from "node:crypto";

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

    const { items, customer, soldBy, discount, discountReason, shopName } = parsed.data;
    const orderId = randomUUID();
    const lines: { product: { id: string; name: string; price: number; stock: number; sizes?: { label: string; stock: number }[] }; size: string; quantity: number; subtotal: number }[] = [];
    for (const item of items) {
      const productResult = await query(`SELECT * FROM products WHERE id = $1;`, [item.productId]);
      const product = productResult.rows[0] as { id: string; name: string; price: number; stock: number; sizes?: { label: string; stock: number }[] } | undefined;
      if (!product) return NextResponse.json({ message: "أحد المنتجات غير موجود" }, { status: 404 });
      const size = product.sizes?.find((availableSize) => availableSize.label === item.size);
      if (!size || size.stock < item.quantity) return NextResponse.json({ message: `المقاس ${item.size} غير متوفر بالكمية المطلوبة من ${product.name}` }, { status: 400 });
      lines.push({ product, size: item.size, quantity: item.quantity, subtotal: Number(product.price) * item.quantity });
    }
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    if (discount > subtotal) return NextResponse.json({ message: "الخصم لا يمكن أن يتجاوز إجمالي الفاتورة" }, { status: 400 });
    const saleResults = [];
    for (const line of lines) {
      const lineDiscount = subtotal ? discount * (line.subtotal / subtotal) : 0;
      const saleResult = await query(`INSERT INTO sales (product_id, quantity, total, customer, sold_by, order_id, discount, discount_reason, size, shop_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;`, [line.product.id, line.quantity, line.subtotal - lineDiscount, customer, soldBy, orderId, lineDiscount, discountReason || null, line.size, shopName]);
      saleResults.push(saleResult.rows[0]);
      const updatedSizes = (line.product.sizes || []).map((availableSize) => availableSize.label === line.size ? { ...availableSize, stock: availableSize.stock - line.quantity } : availableSize);
      await query(`UPDATE products SET stock = stock - $1, sizes = $2 WHERE id = $3;`, [line.quantity, JSON.stringify(updatedSizes), line.product.id]);
    }
    const total = subtotal - discount;
    await logNotification({
      type: "sale",
      title: "تمت عملية بيع جديدة",
      description: `${customer} اشترى ${items.length} منتجات بقيمة ${total} ج.م`,
    });
    await logAudit(`${user.name} سجل فاتورة بيع للعميل: ${customer}`);

    return NextResponse.json({ sales: saleResults, total, message: "تم تسجيل البيع بنجاح" }, { status: 201 });
  } catch (error) {
    console.error("sales-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
