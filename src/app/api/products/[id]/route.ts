import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { initializeDatabase, logAudit, logNotification, query } from "@/lib/db";
import { productSchema } from "@/lib/validators";
import { isSameOrigin } from "@/lib/request-security";

async function getOwnedProduct(id: string, ownerId: string) {
  const result = await query(`SELECT * FROM products WHERE id = $1 AND owner_id = $2;`, [id, ownerId]);
  return result.rows[0];
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });

  try {
    await initializeDatabase();
    const { id } = await params;
    if (!await getOwnedProduct(id, user.id)) return NextResponse.json({ message: "المنتج غير موجود" }, { status: 404 });
    const parsed = productSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || "بيانات المنتج غير صالحة" }, { status: 400 });
    const { name, category, stock, price, imageUrl, sizes } = parsed.data;
    const result = await query(
      `UPDATE products SET name = $1, category = $2, stock = $3, price = $4, image_url = $5, sizes = $6 WHERE id = $7 AND owner_id = $8 RETURNING *;`,
      [name, category, stock, price, imageUrl || null, JSON.stringify(sizes), id, user.id],
    );
    await logAudit(user.id, `${user.name} عدّل المنتج: ${name}`);
    return NextResponse.json({ product: result.rows[0], message: "تم تحديث المنتج" });
  } catch (error) {
    console.error("product-update-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "مصدر الطلب غير مسموح" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "غير مصرح" }, { status: 401 });

  try {
    await initializeDatabase();
    const { id } = await params;
    const product = await getOwnedProduct(id, user.id) as { name?: string } | undefined;
    if (!product) return NextResponse.json({ message: "المنتج غير موجود" }, { status: 404 });
    await query(`DELETE FROM products WHERE id = $1 AND owner_id = $2;`, [id, user.id]);
    await logNotification(user.id, { type: "product", title: "تم حذف منتج", description: `تم حذف ${product.name || "منتج"}`, details: { name: product.name || "منتج" } });
    await logAudit(user.id, `${user.name} حذف المنتج: ${product.name || id}`);
    return NextResponse.json({ message: "تم حذف المنتج" });
  } catch (error) {
    console.error("product-delete-error", error);
    return NextResponse.json({ message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
