'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            fetch: fetchWithRetry,
        },
    })
    : null;

export function isSupabaseMode(): boolean {
    return !!supabase;
}

// Retry wrapper for fetch — handles 503 from cold-start Supabase projects
async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const maxRetries = 3;
    const retryDelay = 1500; // 1.5 seconds

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(input, {
                ...init,
                signal: init?.signal || AbortSignal.timeout(10000), // 10s timeout
            });

            if (response.status === 503 && attempt < maxRetries) {
                console.warn(`Supabase 503 — retry ${attempt + 1}/${maxRetries}...`);
                await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
                continue;
            }

            return response;
        } catch (err) {
            if (attempt < maxRetries) {
                console.warn(`Supabase fetch error — retry ${attempt + 1}/${maxRetries}...`);
                await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
                continue;
            }
            throw err;
        }
    }

    // Fallback (should not reach here)
    return fetch(input, init);
}
