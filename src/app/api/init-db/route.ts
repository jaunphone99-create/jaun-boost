import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/init-db — สร้าง Tables ครั้งแรก
export async function POST() {
    if (!db) {
        return NextResponse.json({ error: 'Turso not configured' }, { status: 500 });
    }
    try {
        await db.executeMultiple(`
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                barcode TEXT DEFAULT '',
                name TEXT NOT NULL,
                category TEXT DEFAULT '',
                stock_quantity INTEGER DEFAULT 0,
                unit TEXT DEFAULT 'ชิ้น',
                image_url TEXT DEFAULT '',
                tracking_mode TEXT DEFAULT 'quantity',
                usage_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'available',
                cost_price REAL DEFAULT 0,
                source TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                product_id TEXT DEFAULT '',
                product_name TEXT DEFAULT '',
                user_name TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                unit TEXT DEFAULT 'ชิ้น',
                type TEXT DEFAULT 'withdraw',
                photo TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS staff (
                employee_id TEXT PRIMARY KEY,
                employee_name TEXT NOT NULL,
                role TEXT DEFAULT 'viewer',
                password TEXT DEFAULT '1234',
                permissions TEXT DEFAULT '{}'
            );
            CREATE TABLE IF NOT EXISTS service_users (
                id TEXT PRIMARY KEY,
                phone TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                registered_at TEXT DEFAULT (datetime('now')),
                last_login TEXT DEFAULT '',
                total_withdrawals INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                product_name TEXT NOT NULL,
                product_id TEXT DEFAULT '',
                quantity INTEGER DEFAULT 0,
                unit TEXT DEFAULT 'ชิ้น',
                unit_cost REAL DEFAULT 0,
                total_cost REAL DEFAULT 0,
                note TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS expense_logs (
                id TEXT PRIMARY KEY,
                action TEXT NOT NULL,
                description TEXT DEFAULT '',
                admin_name TEXT DEFAULT 'admin',
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_transactions_user_name ON transactions(user_name);
            CREATE INDEX IF NOT EXISTS idx_service_users_phone ON service_users(phone);
            CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
        `);
        return NextResponse.json({ success: true, message: 'Database initialized successfully' });
    } catch (err) {
        console.error('Init DB error:', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
