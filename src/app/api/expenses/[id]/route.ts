import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/expenses/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const { id } = await params;
        const body = await req.json();
        const fields = Object.keys(body).map((k) => `${k} = ?`).join(', ');
        const values = [...Object.values(body), id];
        await db.execute(`UPDATE expenses SET ${fields} WHERE id = ?` as string, values as never);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// DELETE /api/expenses/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const { id } = await params;
        await db.execute(`DELETE FROM expenses WHERE id = ?` as string, [id] as never);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
