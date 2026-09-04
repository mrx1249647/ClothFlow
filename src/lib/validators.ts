import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "اسم المستخدم قصير جدًا"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "الحد الأدنى 8 أحرف"),
});

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور قصيرة"),
});

export const productSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  stock: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  imageUrl: z.string().max(2_000_000).optional().default(""),
  sizes: z.array(z.object({ label: z.string().min(1).max(10), stock: z.coerce.number().int().min(0) })).default([]),
});

export const saleSchema = z.object({
  items: z.array(z.object({ productId: z.string().min(1), size: z.string().min(1).max(10), quantity: z.coerce.number().int().min(1) })).min(1),
  customer: z.string().min(2),
  soldBy: z.string().min(2),
  discount: z.coerce.number().min(0).default(0),
  discountReason: z.string().max(200).optional().default(""),
  shopName: z.string().min(2).max(120),
});
