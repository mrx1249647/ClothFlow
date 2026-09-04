# ClothFlow

لوحة إدارة متجر ملابس مبنية بـNext.js، Neon PostgreSQL، ومهيأة للنشر على Cloudflare Workers عبر OpenNext.

## التشغيل المحلي

```bash
npm install
npm run dev
```

## النشر على Cloudflare

بعد تسجيل الدخول إلى Cloudflare:

```bash
npx wrangler login
npm run cloudflare:deploy
```

للمعاينة المحلية:

```bash
npm run cloudflare:dev
```

## متغيرات البيئة والأسرار

أضفها في Cloudflare Workers Settings أو عبر `wrangler secret put`:

- `DATABASE_URL`: رابط Neon pooled connection string مع SSL.
- `JWT_SECRET`: قيمة عشوائية لا تقل عن 32 حرفًا.
- `NEXT_PUBLIC_APP_NAME`: `ClothFlow`.
- `NEXT_PUBLIC_ADMIN_EMAIL`: بريد المدير.
- `ADMIN_DEFAULT_PASSWORD`: كلمة مرور المدير.

التسجيل حاليًا ينشئ الحساب نشطًا مباشرة بدون تحقق بريد.

## ملاحظات مهمة

- تم استخدام Neon HTTP بدل `pg` لأن Cloudflare Workers لا يدعم اتصال PostgreSQL TCP التقليدي.
- يتم إنشاء الجداول وإضافة الأعمدة المطلوبة تلقائيًا عند أول طلب API.
- لا ترفع `.env.local` أو أي مفاتيح سرية إلى GitHub.
- غيّر أي بيانات اتصال أو كلمات مرور ظهرت خارج لوحة الأسرار.
