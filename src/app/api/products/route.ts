import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/products
export async function GET() {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const result = await db.execute(`SELECT * FROM products ORDER BY created_at ASC`);
        return NextResponse.json(result.rows);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// POST /api/products
export async function POST(req: NextRequest) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const body = await req.json();
        const id = body.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await db.execute({
            sql: `INSERT INTO products (id, barcode, name, category, stock_quantity, unit, image_url, tracking_mode, usage_count, status, cost_price, source)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                body.barcode || '',
                body.name,
                body.category || '',
                body.stock_quantity ?? 0,
                body.unit || 'ชิ้น',
                body.image_url || '',
                body.tracking_mode || 'quantity',
                body.usage_count ?? 0,
                body.status || 'available',
                body.cost_price ?? 0,
                body.source || '',
            ],
        });
        return NextResponse.json({ success: true, id });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
