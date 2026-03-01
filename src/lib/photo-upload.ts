'use client';

import { supabase, isSupabaseMode } from './supabase';

const BUCKET_NAME = 'evidence-photos';

/**
 * Upload a base64 photo to Supabase Storage and return the public URL.
 * Falls back to returning the base64 string if Supabase is not available.
 */
export async function uploadPhoto(base64Data: string): Promise<string> {
    if (!isSupabaseMode() || !base64Data) return base64Data;

    try {
        // Convert base64 to Blob
        const matches = base64Data.match(/^data:(.+?);base64,(.+)$/);
        if (!matches) return base64Data;

        const mimeType = matches[1];
        const base64 = matches[2];
        const byteChars = atob(base64);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteArray[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: mimeType });

        // Generate unique filename
        const ext = mimeType.split('/')[1] || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
        const filePath = `withdrawals/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase!.storage
            .from(BUCKET_NAME)
            .upload(filePath, blob, {
                contentType: mimeType,
                upsert: false,
            });

        if (uploadError) {
            console.warn('Photo upload failed:', uploadError.message);
            return base64Data; // fallback to base64
        }

        // Get public URL
        const { data: urlData } = supabase!.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    } catch (err) {
        console.warn('Photo upload error:', err);
        return base64Data; // fallback to base64
    }
}
