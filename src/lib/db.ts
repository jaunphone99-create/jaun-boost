// ===== Turso (libSQL) Database Client =====
// Server-side only — do NOT import this in 'use client' files

import { createClient, type InStatement } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = url
    ? createClient({ url, authToken })
    : null;

export function isTursoMode(): boolean {
    return !!db;
}

// Re-export InStatement type for use in route files
export type { InStatement };
