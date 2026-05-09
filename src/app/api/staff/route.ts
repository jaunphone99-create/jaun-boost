import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/staff
export async function GET() {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const result = await db.execute(`SELECT * FROM staff`);
        const list: Record<string, unknown>[] = result.rows.map((s) => ({
            ...(s as Record<string, unknown>),
            permissions: (() => {
                try { return typeof s.permissions === 'string' ? JSON.parse(s.permissions as string) : s.permissions; }
                catch { return {}; }
            })(),
        }));
        // Ensure admin exists
        if (!list.find((s) => s.employee_id === 'admin')) {
            list.unshift({ employee_id: 'admin', employee_name: 'ผู้ดูแลระบบ', role: 'admin', password: '1234', permissions: {} });
        }
        return NextResponse.json(list);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// POST /api/staff
export async function POST(req: NextRequest) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const body = await req.json();
        await db.execute({
            sql: `INSERT INTO staff (employee_id, employee_name, role, password, permissions) VALUES (?, ?, ?, ?, ?)`,
            args: [
                body.employee_id,
                body.employee_name,
                body.role || 'viewer',
                body.password || '1234',
                JSON.stringify(body.permissions || {}),
            ],
        });
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const msg = String(err);
        if (msg.includes('UNIQUE constraint')) return NextResponse.json({ error: 'เบอร์โทรซ้ำ' }, { status: 409 });
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
