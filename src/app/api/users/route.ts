import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/users
export async function GET() {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const result = await db.execute(`SELECT * FROM service_users ORDER BY registered_at DESC`);
        return NextResponse.json(result.rows);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// POST /api/users — register or login
export async function POST(req: NextRequest) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const body = await req.json();
        const { action, phone, name } = body;

        if (action === 'login') {
            const result = await db.execute({ sql: `SELECT * FROM service_users WHERE phone = ?`, args: [phone] });
            if (result.rows.length === 0) {
                return NextResponse.json({ success: false, error: 'ไม่พบเบอร์โทรนี้ในระบบ กรุณาลงทะเบียนก่อน' });
            }
            const now = new Date().toISOString();
            await db.execute({ sql: `UPDATE service_users SET last_login = ? WHERE phone = ?`, args: [now, phone] });
            return NextResponse.json({ success: true, user: { ...result.rows[0], last_login: now } });
        }

        if (action === 'register') {
            const id = `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const now = new Date().toISOString();
            try {
                await db.execute({
                    sql: `INSERT INTO service_users (id, phone, name, registered_at, total_withdrawals) VALUES (?, ?, ?, ?, 0)`,
                    args: [id, phone, name, now],
                });
                return NextResponse.json({ success: true, user: { id, phone, name, registered_at: now, total_withdrawals: 0 } });
            } catch {
                return NextResponse.json({ success: false, error: 'เบอร์โทรนี้ลงทะเบียนแล้ว' });
            }
        }

        if (action === 'increment') {
            await db.execute({
                sql: `UPDATE service_users SET total_withdrawals = total_withdrawals + 1 WHERE phone = ?`,
                args: [phone],
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
