import { NextRequest, NextResponse } from 'next/server';

// POST /api/photos/upload
// Stores photo as base64 in Turso (no external storage needed for now)
// When Cloudflare R2 credentials are added, this will upload there instead
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { photo } = body;
        if (!photo) return NextResponse.json({ error: 'No photo provided' }, { status: 400 });

        // If Cloudflare R2 is configured, upload there
        const r2AccountId = process.env.R2_ACCOUNT_ID;
        const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
        const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
        const r2Bucket = process.env.R2_BUCKET_NAME;
        const r2PublicUrl = process.env.R2_PUBLIC_URL;

        if (r2AccountId && r2AccessKey && r2SecretKey && r2Bucket && r2PublicUrl) {
            try {
                // Extract base64 data
                const matches = photo.match(/^data:(.+?);base64,(.+)$/);
                if (!matches) return NextResponse.json({ url: photo });

                const mimeType = matches[1];
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, 'base64');
                const ext = mimeType.split('/')[1] || 'jpg';
                const fileName = `withdrawals/${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;

                // Upload to R2 via S3-compatible API
                const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
                const url = `${endpoint}/${r2Bucket}/${fileName}`;

                const uploadRes = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': mimeType,
                        'Content-Length': String(buffer.length),
                        Authorization: `AWS4-HMAC-SHA256 Credential=${r2AccessKey}`,
                    },
                    body: buffer,
                });

                if (uploadRes.ok) {
                    return NextResponse.json({ url: `${r2PublicUrl}/${fileName}` });
                }
            } catch (r2Err) {
                console.warn('R2 upload failed, using base64:', r2Err);
            }
        }

        // Fallback: return base64 as-is (stored directly in DB)
        return NextResponse.json({ url: photo });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
