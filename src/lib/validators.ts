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
  sku: z.string().min(3),
  stock: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
});

export const saleSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().min(1),
  customer: z.string().min(2),
  soldBy: z.string().min(2),
});
