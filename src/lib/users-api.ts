'use client';

import { ServiceUser } from './types';
import { USERS_KEY, SESSION_KEY } from './storage';

// ===== Service Users (via API Routes) =====

export async function getServiceUsers(): Promise<ServiceUser[]> {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('API error');
        return await res.json();
    } catch {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(USERS_KEY);
        return stored ? JSON.parse(stored) : [];
    }
}

export async function registerServiceUser(phone: string, name: string): Promise<{ success: boolean; user?: ServiceUser; error?: string }> {
    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', phone, name }),
        });
        const data = await res.json();
        return data;
    } catch {
        // localStorage fallback
        const list = await getServiceUsers();
        if (list.find((u) => u.phone === phone)) return { success: false, error: 'เบอร์โทรนี้ลงทะเบียนแล้ว' };
        const id = `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const now = new Date().toISOString();
        const newUser: ServiceUser = { id, phone, name, registered_at: now, total_withdrawals: 0 };
        list.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(list));
        return { success: true, user: newUser };
    }
}

export async function loginServiceUser(phone: string): Promise<{ success: boolean; user?: ServiceUser; error?: string }> {
    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', phone }),
        });
        const data = await res.json();
        if (data.success && data.user) {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                user_id: data.user.id, phone: data.user.phone, name: data.user.name,
                logged_in_at: new Date().toISOString(),
            }));
        }
        return data;
    } catch {
        const list = await getServiceUsers();
        const user = list.find((u) => u.phone === phone);
        if (!user) return { success: false, error: 'ไม่พบเบอร์โทรนี้ในระบบ กรุณาลงทะเบียนก่อน' };
        user.last_login = new Date().toISOString();
        localStorage.setItem(USERS_KEY, JSON.stringify(list));
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            user_id: user.id, phone: user.phone, name: user.name,
            logged_in_at: new Date().toISOString(),
        }));
        return { success: true, user };
    }
}

export async function incrementUserWithdrawals(phone: string): Promise<void> {
    try {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'increment', phone }),
        });
    } catch {
        const list = await getServiceUsers();
        const user = list.find((u) => u.phone === phone);
        if (user) {
            user.total_withdrawals = (user.total_withdrawals || 0) + 1;
            localStorage.setItem(USERS_KEY, JSON.stringify(list));
        }
    }
}

export async function deleteServiceUser(id: string): Promise<{ success: boolean }> {
    try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        return { success: res.ok };
    } catch {
        return { success: false };
    }
}
