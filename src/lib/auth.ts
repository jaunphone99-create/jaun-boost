'use client';

import { Staff, StaffRole } from './types';
import { SESSION_KEY } from './storage';
import { getStaff } from './staff-api';

// ===== Auth Functions =====

export async function loginStaff(employeeId: string): Promise<{ success: boolean; staff?: Staff; error?: string }> {
    const list = await getStaff();
    const staff = list.find((s) => s.employee_id === employeeId);
    if (!staff) {
        return { success: false, error: 'ไม่พบเบอร์โทรนี้ในระบบ กรุณาลงทะเบียนก่อน' };
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        employee_id: staff.employee_id,
        employee_name: staff.employee_name,
        role: staff.role,
        logged_in_at: new Date().toISOString(),
    }));
    return { success: true, staff };
}

export function getCurrentUser(): { employee_id?: string; employee_name?: string; role?: StaffRole; user_id?: string; phone?: string; name?: string } | null {
    if (typeof window === 'undefined') return null;
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return null;
    return JSON.parse(session);
}

export function logoutUser(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SESSION_KEY);
}
