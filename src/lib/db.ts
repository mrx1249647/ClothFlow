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
        verification_token TEXT, verification_expires TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`);
      const columns = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users';`);
      const names = new Set(columns.rows.map((row) => row.column_name));
      if (!names.has("avatar_url")) await query(`ALTER TABLE users ADD COLUMN avatar_url TEXT;`);
      if (!names.has("google_id")) await query(`ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;`);
      if (!names.has("email_verified")) await query(`ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;`);
      if (!names.has("verification_token")) await query(`ALTER TABLE users ADD COLUMN verification_token TEXT;`);
      if (!names.has("verification_expires")) await query(`ALTER TABLE users ADD COLUMN verification_expires TIMESTAMPTZ;`);
      await query(`CREATE TABLE IF NOT EXISTS products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, category TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 0, price NUMERIC(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
      await query(`ALTER TABLE products DROP COLUMN IF EXISTS sku;`);
      await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;`);
      await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB NOT NULL DEFAULT '[]'::jsonb;`);
      await query(`CREATE TABLE IF NOT EXISTS sales (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, quantity INTEGER NOT NULL, total NUMERIC(12,2) NOT NULL, customer TEXT NOT NULL, sold_by TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS order_id UUID;`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0;`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_reason TEXT;`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS size TEXT;`);
      await query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS shop_name TEXT;`);
      await query(`CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
      await query(`CREATE TABLE IF NOT EXISTS audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), message TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@clothflow.com";
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "ChangeMe@2026!Strong";
      const existing = await query(`SELECT id, password_hash FROM users WHERE email = $1;`, [adminEmail]);
      if (existing.rowCount === 0) {
        await query(`INSERT INTO users (name, email, password_hash, role, status, email_verified) VALUES ($1, $2, $3, 'admin', 'active', true);`, ["Admin", adminEmail, await bcrypt.hash(adminPassword, 10)]);
      } else {
        await query(`UPDATE users SET role = 'admin', status = 'active', email_verified = true, name = COALESCE(NULLIF(name, ''), 'Admin') WHERE email = $1;`, [adminEmail]);
      }
    })();
  }
  await globalThis.__dbInitPromise;
  return true;
}

export async function logNotification(item: { type: string; title: string; description: string }) {
  const response = await query(`INSERT INTO notifications (type, title, description) VALUES ($1, $2, $3) RETURNING *;`, [item.type, item.title, item.description]);
  return response.rows[0];
}
export async function logAudit(message: string) { await query(`INSERT INTO audit_logs (message) VALUES ($1);`, [message]); }
export async function getNotifications(limit = 20) { const response = await query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT $1;`, [limit]); return response.rows; }
export async function getUsers() { const response = await query(`SELECT id, name, email, role, status, avatar_url, created_at FROM users ORDER BY created_at DESC;`); return response.rows; }
export async function getProducts() { const response = await query(`SELECT * FROM products ORDER BY created_at DESC;`); return response.rows; }
export async function getSales() { const response = await query(`SELECT s.*, p.name AS product_name FROM sales s JOIN products p ON p.id = s.product_id ORDER BY s.created_at DESC;`); return response.rows; }
export async function getDashboardStats() {
  const [users, products, sales, notifications] = await Promise.all([query(`SELECT COUNT(*)::int AS count FROM users;`), query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(stock),0)::int AS stock FROM products;`), query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(total),0)::numeric AS total FROM sales;`), query(`SELECT COUNT(*)::int AS count FROM notifications;`)]);
  return { users: users.rows[0]?.count ?? 0, products: products.rows[0]?.count ?? 0, stock: products.rows[0]?.stock ?? 0, sales: sales.rows[0]?.count ?? 0, revenue: Number(sales.rows[0]?.total ?? 0), notifications: notifications.rows[0]?.count ?? 0 };
}
