import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    // Verify cron secret (optional security)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineToken) {
        return NextResponse.json({ error: 'LINE token not configured' }, { status: 500 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get today's date range (Thailand timezone)
    const now = new Date();
    const thaiOffset = 7 * 60 * 60 * 1000;
    const thaiNow = new Date(now.getTime() + thaiOffset);
    const todayStart = new Date(thaiNow);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(thaiNow);
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Convert back to UTC for query
    const startUTC = new Date(todayStart.getTime() - thaiOffset).toISOString();
    const endUTC = new Date(todayEnd.getTime() - thaiOffset).toISOString();

    // Fetch today's transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startUTC)
        .lte('created_at', endUTC)
        .in('type', ['withdraw', 'WITHDRAW'])
        .order('created_at', { ascending: false });

    // Fetch all products for low stock check
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .order('stock_quantity', { ascending: true });

    const txs = transactions || [];
    const prods = products || [];

    // Format date
    const thaiDate = thaiNow.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Build summary
    const uniqueUsers = [...new Set(txs.map(t => t.user_name))];

    // Group by product
    const productSummary: Record<string, { qty: number; unit: string }> = {};
    for (const t of txs) {
        if (!productSummary[t.product_name]) {
            productSummary[t.product_name] = { qty: 0, unit: t.unit || '' };
        }
        productSummary[t.product_name].qty += t.quantity || 1;
    }

    // Find low stock items (less than 10)
    const lowStock = prods.filter(p =>
        p.tracking_mode !== 'usage' && p.stock_quantity <= 10
    );

    // Build message
    let message = `\n📊 สรุปการเบิกประจำวัน`;
    message += `\n📅 ${thaiDate}`;
    message += `\n─────────────`;

    if (txs.length === 0) {
        message += `\n✅ วันนี้ไม่มีการเบิกสินค้า`;
    } else {
        message += `\n🛒 เบิกทั้งหมด: ${txs.length} รายการ`;
        message += `\n👤 ผู้เบิก: ${uniqueUsers.length} คน`;
        message += `\n─────────────`;

        for (const [name, data] of Object.entries(productSummary)) {
            const prod = prods.find(p => p.name === name);
            const remaining = prod ? prod.stock_quantity : '?';
            message += `\n• ${name} x${data.qty} (คงเหลือ: ${remaining})`;
        }
    }

    if (lowStock.length > 0) {
        message += `\n─────────────`;
        message += `\n⚠️ สินค้าใกล้หมด:`;
        for (const p of lowStock) {
            message += `\n• ${p.name}: เหลือ ${p.stock_quantity} ${p.unit || ''}`;
        }
    }

    // Send to LINE
    const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${lineToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: [{ type: 'text', text: message.trim() }],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('LINE API error:', errorText);
        return NextResponse.json({ error: 'LINE send failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, transactions: txs.length });
}
