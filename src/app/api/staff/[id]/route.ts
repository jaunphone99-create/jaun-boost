import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/staff/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const { id } = await params;
        const body = await req.json();
        if (body.permissions && typeof body.permissions === 'object') {
            body.permissions = JSON.stringify(body.permissions);
        }
        const fields = Object.keys(body).map((k) => `${k} = ?`).join(', ');
        const values = [...Object.values(body), id];
        await db.execute(`UPDATE staff SET ${fields} WHERE employee_id = ?` as string, values as never);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// DELETE /api/staff/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const { id } = await params;
        await db.execute(`DELETE FROM staff WHERE employee_id = ?` as string, [id] as never);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
