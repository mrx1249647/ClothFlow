import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

declare global {
  var __neonQuery: ReturnType<typeof neon> | undefined;
  var __dbInitPromise: Promise<void> | undefined;
}

type QueryResult = { rows: Record<string, unknown>[]; rowCount: number };

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required. Add it to .env.local or your deployment environment.");

const neonQuery = globalThis.__neonQuery ?? neon(databaseUrl, { fetchOptions: { cache: "no-store" } });
if (process.env.NODE_ENV !== "production") globalThis.__neonQuery = neonQuery;

export async function query(text: string, params?: unknown[]) {
  const result = await neonQuery.query<false, true>(text, params, { fullResults: true });
  return { rows: result.rows as Record<string, unknown>[], rowCount: result.rowCount } satisfies QueryResult;
}

export async function initializeDatabase() {
  if (!globalThis.__dbInitPromise) {
    globalThis.__dbInitPromise = (async () => {
      await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
      await query(`CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
        password_hash TEXT, role TEXT NOT NULL DEFAULT 'manager', status TEXT NOT NULL DEFAULT 'pending',
        email_verified BOOLEAN NOT NULL DEFAULT false, google_id TEXT UNIQUE, avatar_url TEXT,
        verification_token TEXT, verification_expires TIMESTAMPTZ,
        email_verification_code_hash TEXT, email_verification_code_expires TIMESTAMPTZ,
        password_reset_code_hash TEXT, password_reset_code_expires TIMESTAMPTZ, password_reset_attempts INTEGER NOT NULL DEFAULT 0,
        shop_name TEXT, default_seller TEXT,
        trial_ends_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`);
      const columns = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users';`);
      const names = new Set(columns.rows.map((row) => row.column_name));
      if (!names.has("avatar_url")) await query(`ALTER TABLE users ADD COLUMN avatar_url TEXT;`);
      if (!names.has("google_id")) await query(`ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;`);
      if (!names.has("email_verified")) await query(`ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;`);
      if (!names.has("verification_token")) await query(`ALTER TABLE users ADD COLUMN verification_token TEXT;`);
      if (!names.has("verification_expires")) await query(`ALTER TABLE users ADD COLUMN verification_expires TIMESTAMPTZ;`);
      if (!names.has("email_verification_code_hash")) await query(`ALTER TABLE users ADD COLUMN email_verification_code_hash TEXT;`);
      if (!names.has("email_verification_code_expires")) await query(`ALTER TABLE users ADD COLUMN email_verification_code_expires TIMESTAMPTZ;`);
      if (!names.has("password_reset_code_hash")) await query(`ALTER TABLE users ADD COLUMN password_reset_code_hash TEXT;`);
      if (!names.has("password_reset_code_expires")) await query(`ALTER TABLE users ADD COLUMN password_reset_code_expires TIMESTAMPTZ;`);
      if (!names.has("password_reset_attempts")) await query(`ALTER TABLE users ADD COLUMN password_reset_attempts INTEGER NOT NULL DEFAULT 0;`);
      if (!names.has("shop_name")) await query(`ALTER TABLE users ADD COLUMN shop_name TEXT;`);
      if (!names.has("default_seller")) await query(`ALTER TABLE users ADD COLUMN default_seller TEXT;`);
      if (!names.has("trial_ends_at")) await query(`ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMPTZ;`);
      await query(`CREATE TABLE IF NOT EXISTS products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, category TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 0, price NUMERIC(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
      await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;`);
      await query(`ALTER TABLE products DROP COLUMN IF EXISTS sku;`);
      await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;`);
      await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB NOT NULL DEFAULT '[]'::jsonb;`);
      await query(`CREATE TABLE IF NOT EXISTS sales (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID REFERENCES users(id) ON DELETE CASCADE, product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, quantity INTEGER NOT NULL, total NUMERIC(12,2) NOT NULL, customer TEXT NOT NULL, sold_by TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS order_id UUID;`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0;`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_reason TEXT;`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS size TEXT;`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS shop_name TEXT;`);
      await query(`CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
      await query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;`);
      await query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;`);
      await query(`CREATE TABLE IF NOT EXISTS audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID REFERENCES users(id) ON DELETE CASCADE, message TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
      await query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;`);
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@clothflow.com";
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "ChangeMe@2026!Strong";
      const existing = await query(`SELECT id, password_hash FROM users WHERE email = $1;`, [adminEmail]);
      if (existing.rowCount === 0) {
        await query(`INSERT INTO users (name, email, password_hash, role, status, email_verified) VALUES ($1, $2, $3, 'admin', 'active', true);`, ["Admin", adminEmail, await bcrypt.hash(adminPassword, 10)]);
      } else {
        await query(`UPDATE users SET role = 'admin', status = 'active', email_verified = true, name = COALESCE(NULLIF(name, ''), 'Admin') WHERE email = $1;`, [adminEmail]);
      }
      const admin = await query(`SELECT id FROM users WHERE email = $1;`, [adminEmail]);
      const adminId = admin.rows[0]?.id;
      if (adminId) {
        await query(`UPDATE products SET owner_id = $1 WHERE owner_id IS NULL;`, [adminId]);
        await query(`UPDATE sales s SET owner_id = p.owner_id FROM products p WHERE s.product_id = p.id AND s.owner_id IS NULL;`);
        await query(`UPDATE notifications SET owner_id = $1 WHERE owner_id IS NULL;`, [adminId]);
        await query(`UPDATE audit_logs SET owner_id = $1 WHERE owner_id IS NULL;`, [adminId]);
      }
      await query(`CREATE INDEX IF NOT EXISTS products_owner_id_idx ON products(owner_id);`);
      await query(`CREATE INDEX IF NOT EXISTS sales_owner_id_created_at_idx ON sales(owner_id, created_at DESC);`);
      await query(`CREATE INDEX IF NOT EXISTS notifications_owner_id_created_at_idx ON notifications(owner_id, created_at DESC);`);
    })();
  }
  await globalThis.__dbInitPromise;
  return true;
}

export async function logNotification(ownerId: string, item: { type: string; title: string; description: string; details?: Record<string, unknown> }) {
  const response = await query(`INSERT INTO notifications (owner_id, type, title, description, details) VALUES ($1, $2, $3, $4, $5) RETURNING *;`, [ownerId, item.type, item.title, item.description, JSON.stringify(item.details || {})]);
  return response.rows[0];
}
export async function logAudit(ownerId: string, message: string) { await query(`INSERT INTO audit_logs (owner_id, message) VALUES ($1, $2);`, [ownerId, message]); }
export async function getNotifications(ownerId: string, limit = 20) { const response = await query(`SELECT * FROM notifications WHERE owner_id = $1 ORDER BY created_at DESC LIMIT $2;`, [ownerId, limit]); return response.rows; }
export async function getUsers() { const response = await query(`SELECT id, name, email, role, status, avatar_url, created_at FROM users ORDER BY created_at DESC;`); return response.rows; }
export async function getProducts(ownerId: string) { const response = await query(`SELECT * FROM products WHERE owner_id = $1 ORDER BY created_at DESC;`, [ownerId]); return response.rows; }
export async function getSales(ownerId: string) { const response = await query(`SELECT s.*, p.name AS product_name, p.image_url FROM sales s JOIN products p ON p.id = s.product_id WHERE s.owner_id = $1 ORDER BY s.created_at DESC;`, [ownerId]); return response.rows; }
export async function getDashboardStats(ownerId: string) {
  const [users, products, sales, notifications] = await Promise.all([query(`SELECT COUNT(*)::int AS count FROM users WHERE id = $1;`, [ownerId]), query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(stock),0)::int AS stock FROM products WHERE owner_id = $1;`, [ownerId]), query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(total),0)::numeric AS total FROM sales WHERE owner_id = $1;`, [ownerId]), query(`SELECT COUNT(*)::int AS count FROM notifications WHERE owner_id = $1;`, [ownerId])]);
  return { users: users.rows[0]?.count ?? 0, products: products.rows[0]?.count ?? 0, stock: products.rows[0]?.stock ?? 0, sales: sales.rows[0]?.count ?? 0, revenue: Number(sales.rows[0]?.total ?? 0), notifications: notifications.rows[0]?.count ?? 0 };
}
