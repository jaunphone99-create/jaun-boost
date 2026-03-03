import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }, { status: 500 });
        }

        const body = await req.json();
        const { userName, items, timestamp } = body;

        // Build Flex Message
        const date = new Date(timestamp || Date.now());
        const thaiDate = date.toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        let textMessage = `\n📦 แจ้งเตือนเบิกสินค้า`;
        textMessage += `\n👤 ${userName}`;
        textMessage += `\n🕐 ${thaiDate}`;
        textMessage += `\n─────────────`;

        for (const item of items) {
            textMessage += `\n🛒 ${item.name} x${item.quantity}`;
            if (item.remaining !== undefined) {
                textMessage += ` (คงเหลือ: ${item.remaining})`;
            }
        }

        // Broadcast to all followers of the Official Account
        const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        type: 'text',
                        text: textMessage.trim(),
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LINE Messaging API error:', errorText);
            return NextResponse.json({ error: 'LINE send failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('LINE Messaging API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
