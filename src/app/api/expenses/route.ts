import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/expenses
export async function GET() {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const result = await db.execute(`SELECT * FROM expenses ORDER BY date DESC`);
        return NextResponse.json(result.rows);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// POST /api/expenses
export async function POST(req: NextRequest) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const body = await req.json();
        const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await db.execute({
            sql: `INSERT INTO expenses (id, date, product_name, product_id, quantity, unit, unit_cost, total_cost, note)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [id, body.date, body.product_name, body.product_id || '', body.quantity, body.unit || 'ชิ้น', body.unit_cost, body.total_cost, body.note || ''],
        });
        return NextResponse.json({ success: true, id });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
