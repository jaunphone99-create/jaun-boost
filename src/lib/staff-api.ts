'use client';

import { Staff, StaffRole, StaffPermissions } from './types';
import { SESSION_KEY } from './storage';
import { getDefaultPermissions } from './permissions';

// ===== Helpers =====

function parsePermissions(raw: unknown, role: StaffRole): StaffPermissions {
    if (!raw) return getDefaultPermissions(role);
    if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch { return getDefaultPermissions(role); }
    }
    if (typeof raw === 'object') return raw as StaffPermissions;
    return getDefaultPermissions(role);
}

export const ALL_ADMIN_TABS = ['dashboard', 'products', 'expenses', 'transactions', 'staff', 'users', 'settings'] as const;

export function getDefaultTabsForRole(role: StaffRole): string[] {
    switch (role) {
        case 'admin': return [...ALL_ADMIN_TABS];
        case 'editor': return ['dashboard', 'products', 'expenses', 'transactions', 'users'];
        case 'viewer': return ['dashboard', 'transactions'];
        default: return ['dashboard'];
    }
}

// ===== Staff CRUD (via API Routes) =====

export async function getStaff(): Promise<Staff[]> {
    try {
        const res = await fetch('/api/staff');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        return data.map((s: Record<string, unknown>) => {
            const role = (s.role as StaffRole) || 'viewer';
            return { ...s, role, password: (s.password as string) || '1234', permissions: parsePermissions(s.permissions, role) } as Staff;
        });
    } catch {
        // LocalStorage fallback
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem('pantry_staff');
        if (!stored) return [{ employee_id: 'admin', employee_name: 'ผู้ดูแลระบบ', role: 'admin', password: '1234', permissions: getDefaultPermissions('admin') }];
        return JSON.parse(stored);
    }
}

export async function addStaff(staff: Staff & { password?: string }): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...staff, permissions: staff.permissions || getDefaultPermissions(staff.role || 'viewer') }),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error };
        return { success: true };
    } catch {
        return { success: false, error: 'เกิดข้อผิดพลาด' };
    }
}

export async function updateStaff(employeeId: string, updates: Partial<Omit<Staff, 'employee_id'>>): Promise<{ success: boolean }> {
    try {
        const res = await fetch(`/api/staff/${employeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        return { success: res.ok };
    } catch {
        return { success: false };
    }
}

export async function deleteStaff(employeeId: string): Promise<{ success: boolean }> {
    try {
        const res = await fetch(`/api/staff/${employeeId}`, { method: 'DELETE' });
        return { success: res.ok };
    } catch {
        return { success: false };
    }
}

export async function registerStaff(phone: string, name: string): Promise<{ success: boolean; staff?: Staff; error?: string }> {
    const defaultPerms = getDefaultPermissions('viewer');
    const newStaff: Staff = { employee_id: phone, employee_name: name, role: 'viewer', password: '1234', permissions: defaultPerms };
    const result = await addStaff(newStaff);
    if (result.success) return { success: true, staff: newStaff };
    return { success: false, error: result.error || 'เบอร์โทรนี้ลงทะเบียนแล้ว' };
}

// ===== Auth =====

export async function loginStaff(employeeId: string): Promise<{ success: boolean; staff?: Staff; error?: string }> {
    const list = await getStaff();
    const staff = list.find((s) => s.employee_id === employeeId);
    if (!staff) return { success: false, error: 'ไม่พบเบอร์โทรนี้ในระบบ กรุณาลงทะเบียนก่อน' };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        employee_id: staff.employee_id,
        employee_name: staff.employee_name,
        role: staff.role,
        logged_in_at: new Date().toISOString(),
    }));
    return { success: true, staff };
}
