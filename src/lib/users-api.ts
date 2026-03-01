'use client';

import { ServiceUser } from './types';
import { USERS_KEY, SESSION_KEY } from './storage';
import { supabase, isSupabaseMode } from './supabase';

// ===== Service Users CRUD =====

export async function getServiceUsers(): Promise<ServiceUser[]> {
    if (isSupabaseMode()) {
        try {
            const { data, error } = await supabase!.from('service_users').select('*').order('registered_at', { ascending: false });
            if (!error && data) return data as ServiceUser[];
        } catch {
            console.warn('Supabase failed, falling back to localStorage');
        }
    }
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
}

export async function registerServiceUser(phone: string, name: string): Promise<{ success: boolean; user?: ServiceUser; error?: string }> {
    const id = `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    if (isSupabaseMode()) {
        try {
            const { error } = await supabase!.from('service_users').insert({
                id, phone, name, registered_at: now, total_withdrawals: 0,
            });
            if (!error) {
                return { success: true, user: { id, phone, name, registered_at: now, total_withdrawals: 0 } };
            }
            // Unique constraint violation = duplicate phone
            return { success: false, error: 'เบอร์โทรนี้ลงทะเบียนแล้ว' };
        } catch {
            console.warn('Supabase failed, falling back to localStorage');
        }
    }

    const list = await getServiceUsers();
    if (list.find((u) => u.phone === phone)) {
        return { success: false, error: 'เบอร์โทรนี้ลงทะเบียนแล้ว' };
    }
    const newUser: ServiceUser = { id, phone, name, registered_at: now, total_withdrawals: 0 };
    list.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
    return { success: true, user: newUser };
}

export async function loginServiceUser(phone: string): Promise<{ success: boolean; user?: ServiceUser; error?: string }> {
    if (isSupabaseMode()) {
        try {
            const { data, error } = await supabase!.from('service_users').select('*').eq('phone', phone).single();
            if (error || !data) {
                return { success: false, error: 'ไม่พบเบอร์โทรนี้ในระบบ กรุณาลงทะเบียนก่อน' };
            }
            const now = new Date().toISOString();
            await supabase!.from('service_users').update({ last_login: now }).eq('id', data.id);
            const user = { ...data, last_login: now } as ServiceUser;
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                user_id: user.id, phone: user.phone, name: user.name,
                logged_in_at: now,
            }));
            return { success: true, user };
        } catch {
            console.warn('Supabase failed, falling back to localStorage');
        }
    }

    const list = await getServiceUsers();
    const user = list.find((u) => u.phone === phone);
    if (!user) {
        return { success: false, error: 'ไม่พบเบอร์โทรนี้ในระบบ กรุณาลงทะเบียนก่อน' };
    }
    user.last_login = new Date().toISOString();
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        user_id: user.id, phone: user.phone, name: user.name,
        logged_in_at: new Date().toISOString(),
    }));
    return { success: true, user };
}

export async function incrementUserWithdrawals(phone: string): Promise<void> {
    if (isSupabaseMode()) {
        try {
            const { data } = await supabase!.from('service_users').select('total_withdrawals').eq('phone', phone).single();
            if (data) {
                await supabase!.from('service_users').update({
                    total_withdrawals: (data.total_withdrawals || 0) + 1,
                }).eq('phone', phone);
            }
            return;
        } catch {
            console.warn('Supabase failed, falling back to localStorage');
        }
    }

    const list = await getServiceUsers();
    const user = list.find((u) => u.phone === phone);
    if (user) {
        user.total_withdrawals = (user.total_withdrawals || 0) + 1;
        localStorage.setItem(USERS_KEY, JSON.stringify(list));
    }
}

export async function deleteServiceUser(id: string): Promise<{ success: boolean }> {
    if (isSupabaseMode()) {
        try {
            const { error } = await supabase!.from('service_users').delete().eq('id', id);
            if (!error) return { success: true };
        } catch {
            console.warn('Supabase failed, falling back to localStorage');
        }
    }

    const list = (await getServiceUsers()).filter((u) => u.id !== id);
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
    return { success: true };
}
