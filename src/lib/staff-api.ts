'use client';

import { Staff, StaffRole, StaffPermissions } from './types';
import { STAFF_KEY } from './storage';
import { supabase, isSupabaseMode } from './supabase';
import { getDefaultPermissions } from './permissions';

// ===== Constants =====

export const ALL_ADMIN_TABS = ['dashboard', 'products', 'expenses', 'transactions', 'staff', 'users', 'settings'] as const;

export function getDefaultTabsForRole(role: StaffRole): string[] {
    switch (role) {
        case 'admin':
            return [...ALL_ADMIN_TABS];
        case 'editor':
            return ['dashboard', 'products', 'expenses', 'transactions', 'users'];
        case 'viewer':
            return ['dashboard', 'transactions'];
        default:
            return ['dashboard'];
    }
}

// ===== Staff CRUD =====

/** Parse permissions from stored JSON string or object */
function parsePermissions(raw: unknown, role: StaffRole): StaffPermissions {
    if (!raw) return getDefaultPermissions(role);
    if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch { return getDefaultPermissions(role); }
    }
    if (typeof raw === 'object') return raw as StaffPermissions;
    return getDefaultPermissions(role);
}

export async function getStaff(): Promise<Staff[]> {
    if (isSupabaseMode()) {
        try {
            const { data, error } = await supabase!.from('staff').select('*');
            if (!error && data) {
                const list: Staff[] = data.map((s: Record<string, unknown>) => {
                    const role = (s.role as StaffRole) || 'viewer';
                    return {
                        ...s,
                        role,
                        password: (s.password as string) || '1234',
                        permissions: parsePermissions(s.permissions, role),
                    } as Staff;
                });
                // Ensure admin exists
                if (!list.find((s) => s.employee_id === 'admin')) {
                    list.unshift({ employee_id: 'admin', employee_name: 'ผู้ดูแลระบบ', role: 'admin', password: '1234', permissions: getDefaultPermissions('admin') });
                }
                return list;
            }
        } catch {
            console.warn('Supabase failed, falling back to localStorage');
        }
    }

    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STAFF_KEY);
    if (!stored) {
        const defaultStaff: Staff[] = [
            { employee_id: 'admin', employee_name: 'ผู้ดูแลระบบ', role: 'admin', password: '1234', permissions: getDefaultPermissions('admin') },
        ];
        localStorage.setItem(STAFF_KEY, JSON.stringify(defaultStaff));
        return defaultStaff;
    }
    const list: Staff[] = JSON.parse(stored).map((s: Record<string, unknown>) => {
        const role = (s.role as StaffRole) || 'viewer';
        return {
            ...s,
            role,
            password: (s.password as string) || '1234',
            permissions: parsePermissions(s.permissions, role),
        } as Staff;
    });
    if (!list.find((s) => s.employee_id === 'admin')) {
        list.unshift({ employee_id: 'admin', employee_name: 'ผู้ดูแลระบบ', role: 'admin', password: '1234', permissions: getDefaultPermissions('admin') });
        localStorage.setItem(STAFF_KEY, JSON.stringify(list));
    }
    return list;
}

export async function addStaff(staff: Staff & { password?: string }): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseMode()) {
        try {
            const { error } = await supabase!.from('staff').insert({
                employee_id: staff.employee_id,
                employee_name: staff.employee_name,
                role: staff.role || 'viewer',
                password: staff.password || '1234',
                permissions: staff.permissions || getDefaultPermissions(staff.role || 'viewer'),
            });
            if (!error) return { success: true };
            console.error('Supabase addStaff error:', error.message, error.code);
            if (error.code === '23505') return { success: false, error: 'เบอร์โทรซ้ำ' };
            if (error.code === '42501') return { success: false, error: 'ไม่มีสิทธิ์เพิ่มข้อมูล (RLS Policy)' };
            return { success: false, error: error.message };
        } catch (e) {
            console.warn('Supabase failed, falling back to localStorage', e);
        }
    }

    const list = await getStaff();
    if (list.find((s) => s.employee_id === staff.employee_id)) {
        return { success: false, error: 'เบอร์โทรซ้ำ' };
    }
    list.push({ ...staff, role: staff.role || 'viewer', password: staff.password || '1234' });
    localStorage.setItem(STAFF_KEY, JSON.stringify(list));
    return { success: true };
}

export async function updateStaff(employeeId: string, updates: Partial<Omit<Staff, 'employee_id'>>): Promise<{ success: boolean }> {
    if (isSupabaseMode()) {
        try {
            const updateData: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(updates)) {
                updateData[key] = value;
            }
            const { error } = await supabase!.from('staff').update(updateData).eq('employee_id', employeeId);
            if (!error) return { success: true };
        } catch {
            console.warn('Supabase failed, falling back to localStorage');
        }
    }

    const list = await getStaff();
    const idx = list.findIndex((s) => s.employee_id === employeeId);
    if (idx === -1) return { success: false };
    list[idx] = { ...list[idx], ...updates };
    localStorage.setItem(STAFF_KEY, JSON.stringify(list));
    return { success: true };
}

export async function deleteStaff(employeeId: string): Promise<{ success: boolean }> {
    if (isSupabaseMode()) {
        try {
            const { error } = await supabase!.from('staff').delete().eq('employee_id', employeeId);
            if (!error) return { success: true };
        } catch {
            console.warn('Supabase failed, falling back to localStorage');
        }
    }

    const list = (await getStaff()).filter((s) => s.employee_id !== employeeId);
    localStorage.setItem(STAFF_KEY, JSON.stringify(list));
    return { success: true };
}

export async function registerStaff(phone: string, name: string): Promise<{ success: boolean; staff?: Staff; error?: string }> {
    const defaultPerms = getDefaultPermissions('viewer');
    if (isSupabaseMode()) {
        try {
            const { error } = await supabase!.from('staff').insert({
                employee_id: phone,
                employee_name: name,
                role: 'viewer',
                password: '1234',
                permissions: defaultPerms,
            });
            if (!error) {
                return { success: true, staff: { employee_id: phone, employee_name: name, role: 'viewer', password: '1234', permissions: defaultPerms } };
            }
            return { success: false, error: 'เบอร์โทรนี้ลงทะเบียนแล้ว' };
        } catch {
            console.warn('Supabase failed, falling back to localStorage');
        }
    }

    const list = await getStaff();
    if (list.find((s) => s.employee_id === phone)) {
        return { success: false, error: 'เบอร์โทรนี้ลงทะเบียนแล้ว' };
    }
    const newStaff: Staff = {
        employee_id: phone,
        employee_name: name,
        role: 'viewer',
        password: '1234',
    };
    list.push(newStaff);
    localStorage.setItem(STAFF_KEY, JSON.stringify(list));
    return { success: true, staff: newStaff };
}
