import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE /api/transactions/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    try {
        const { id } = await params;
        // Fetch transaction data before deleting (to restore stock)
        const txResult = await db.execute({ sql: `SELECT * FROM transactions WHERE id = ?`, args: [id] });
        const tx = txResult.rows[0];
        await db.execute({ sql: `DELETE FROM transactions WHERE id = ?`, args: [id] });

        // Restore stock if it was a withdrawal
        if (tx && String(tx.type).toLowerCase() === 'withdraw' && tx.product_id) {
            await db.execute({
                sql: `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
                args: [tx.quantity ?? 1, tx.product_id],
            });
        }
        // Decrement user withdrawal count
        if (tx?.user_name) {
            await db.execute({
                sql: `UPDATE service_users SET total_withdrawals = MAX(0, total_withdrawals - 1) WHERE name = ?`,
                args: [tx.user_name],
            });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
