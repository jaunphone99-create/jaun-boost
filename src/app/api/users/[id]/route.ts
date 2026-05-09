import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE /api/users/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const { id } = await params;
        await db.execute({ sql: `DELETE FROM service_users WHERE id = ?`, args: [id] });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
