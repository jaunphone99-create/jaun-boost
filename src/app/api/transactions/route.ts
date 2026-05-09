import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/transactions?limit=50&all=true
export async function GET(req: NextRequest) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const { searchParams } = new URL(req.url);
        const all = searchParams.get('all') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');
        const sql = all
            ? `SELECT * FROM transactions ORDER BY created_at DESC`
            : `SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?`;
        const result = all
            ? await db.execute(sql)
            : await db.execute({ sql, args: [limit] });
        // Map to match existing Transaction type
        const rows = result.rows.map((r) => ({
            id: r.id,
            product_id: r.product_id || '',
            item_name: r.product_name || '',
            user_name: r.user_name,
            type: String(r.type || '').toLowerCase() === 'restock' ? 'RESTOCK' : 'WITHDRAW',
            amount: r.quantity ?? 0,
            created_at: r.created_at,
            photo: r.photo || undefined,
        }));
        return NextResponse.json(rows);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// POST /api/transactions
export async function POST(req: NextRequest) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const body = await req.json();
        const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        await db.execute({
            sql: `INSERT INTO transactions (id, product_id, product_name, user_name, quantity, unit, type, photo)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                body.product_id || '',
                body.product_name || body.item_name || '',
                body.user_name,
                body.quantity ?? body.amount ?? 1,
                body.unit || 'ชิ้น',
                body.type?.toLowerCase() || 'withdraw',
                body.photo || '',
            ],
        });
        return NextResponse.json({ success: true, id });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// DELETE /api/transactions?all=true
export async function DELETE(req: NextRequest) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const { searchParams } = new URL(req.url);
        if (searchParams.get('all') === 'true') {
            await db.execute(`DELETE FROM transactions`);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Missing all=true' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
