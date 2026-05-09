import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/expense-logs
export async function GET() {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const result = await db.execute(`SELECT * FROM expense_logs ORDER BY created_at DESC LIMIT 100`);
        return NextResponse.json(result.rows);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// POST /api/expense-logs
export async function POST(req: NextRequest) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const body = await req.json();
        if (body.clear) {
            await db.execute(`DELETE FROM expense_logs`);
            return NextResponse.json({ success: true });
        }
        const id = `elog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await db.execute({
            sql: `INSERT INTO expense_logs (id, action, description, admin_name) VALUES (?, ?, ?, ?)`,
            args: [id, body.action, body.description || '', body.admin_name || 'admin'],
        });
        return NextResponse.json({ success: true, id });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
