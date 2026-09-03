import bcrypt from "bcryptjs";
import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
  var __dbInitPromise: Promise<void> | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Add it to .env.local or your deployment environment.");
}

const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
}

export const query = (text: string, params?: unknown[]) => {
  if (params && params.length > 0) {
    return pool.query(text, params);
  }

  return pool.query(text);
};

export async function initializeDatabase() {
  if (!globalThis.__dbInitPromise) {
    globalThis.__dbInitPromise = (async () => {
      await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT,
          role TEXT NOT NULL DEFAULT 'manager',
          status TEXT NOT NULL DEFAULT 'pending',
          email_verified BOOLEAN NOT NULL DEFAULT false,
          google_id TEXT UNIQUE,
          verification_token TEXT,
          verification_expires TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const columnsResult = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users';
      `);
      const columns = new Set(columnsResult.rows.map((row) => row.column_name));

      if (!columns.has("password_hash")) {
        await query(`ALTER TABLE users ADD COLUMN password_hash TEXT;`);
      }
      if (!columns.has("role")) {
        await query(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'manager';`);
      }
      if (!columns.has("status")) {
        await query(`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';`);
      }
      if (!columns.has("name")) {
        await query(`ALTER TABLE users ADD COLUMN name TEXT;`);
      }
      if (!columns.has("email")) {
        await query(`ALTER TABLE users ADD COLUMN email TEXT;`);
      }
      if (!columns.has("email_verified")) {
        await query(`ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;`);
      }
      if (!columns.has("google_id")) {
        await query(`ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;`);
      }
      if (!columns.has("verification_token")) {
        await query(`ALTER TABLE users ADD COLUMN verification_token TEXT;`);
      }
      if (!columns.has("verification_expires")) {
        await query(`ALTER TABLE users ADD COLUMN verification_expires TIMESTAMPTZ;`);
      }

      await query(`
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          sku TEXT NOT NULL UNIQUE,
          stock INTEGER NOT NULL DEFAULT 0,
          price NUMERIC(12,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS sales (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL,
          total NUMERIC(12,2) NOT NULL,
          customer TEXT NOT NULL,
          sold_by TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@clothflow.com";
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "ChangeMe@2026!Strong";
      const adminHash = await bcrypt.hash(adminPassword, 10);
      const existingAdmin = await query(`SELECT id FROM users WHERE email = $1;`, [adminEmail]);

      if (existingAdmin.rowCount === 0) {
        await query(
          `INSERT INTO users (name, email, password_hash, role, status) VALUES ($1, $2, $3, 'admin', 'active');`,
          ["Admin", adminEmail, adminHash],
        );
      } else {
        await query(
          `UPDATE users SET name = COALESCE(name, 'Admin'), role = 'admin', status = 'active', password_hash = $1 WHERE email = $2;`,
          [adminHash, adminEmail],
        );
      }

      await query(
        `UPDATE users SET password_hash = $1, role = 'admin', status = 'active', name = COALESCE(name, 'Admin') WHERE email = $2;`,
        [adminHash, adminEmail],
      );
    })();
  }

  await globalThis.__dbInitPromise;
  return true;
}

export async function logNotification({
  type,
  title,
  description,
}: {
  type: string;
  title: string;
  description: string;
}) {
  const result = await query(
    `INSERT INTO notifications (type, title, description) VALUES ($1, $2, $3) RETURNING *;`,
    [type, title, description],
  );

  return result.rows[0];
}

export async function logAudit(message: string) {
  await query(`INSERT INTO audit_logs (message) VALUES ($1);`, [message]);
}

export async function getNotifications(limit = 20) {
  const result = await query(
    `SELECT * FROM notifications ORDER BY created_at DESC LIMIT $1;`,
    [limit],
  );

  return result.rows;
}

export async function getUsers() {
  const result = await query(
    `SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC;`,
  );

  return result.rows;
}

export async function getProducts() {
  const result = await query(
    `SELECT * FROM products ORDER BY created_at DESC;`,
  );

  return result.rows;
}

export async function getSales() {
  const result = await query(
    `SELECT s.*, p.name AS product_name FROM sales s JOIN products p ON p.id = s.product_id ORDER BY s.created_at DESC;`,
  );

  return result.rows;
}

export async function getDashboardStats() {
  const [users, products, sales, notifications] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM users;`),
    query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(stock),0)::int AS stock FROM products;`),
    query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(total),0)::numeric AS total FROM sales;`),
    query(`SELECT COUNT(*)::int AS count FROM notifications;`),
  ]);

  return {
    users: users.rows[0]?.count ?? 0,
    products: products.rows[0]?.count ?? 0,
    stock: products.rows[0]?.stock ?? 0,
    sales: sales.rows[0]?.count ?? 0,
    revenue: Number(sales.rows[0]?.total ?? 0),
    notifications: notifications.rows[0]?.count ?? 0,
  };
}
