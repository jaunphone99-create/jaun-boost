'use client';

import { StaffRole, PermissionAction, StaffPermissions } from './types';

// ===== Permission Page Definitions =====

export interface PermissionPage {
    id: string;
    label: string;
    icon: string;
    actions: PermissionAction[];
}

export interface PermissionGroup {
    id: string;
    label: string;
    pages: PermissionPage[];
}

// All permission pages in the system, organized by group
export const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        id: 'dashboard_group',
        label: '📊 แดชบอร์ด',
        pages: [
            { id: 'dashboard', label: 'แดชบอร์ด', icon: '📊', actions: ['view'] },
        ],
    },
    {
        id: 'products_group',
        label: '📦 จัดการสินค้า',
        pages: [
            { id: 'products', label: 'สินค้า', icon: '📦', actions: ['view', 'edit', 'delete'] },
        ],
    },
    {
        id: 'finance_group',
        label: '💰 การเงิน',
        pages: [
            { id: 'expenses', label: 'ค่าใช้จ่าย', icon: '💰', actions: ['view', 'edit', 'delete'] },
        ],
    },
    {
        id: 'history_group',
        label: '📋 ประวัติ',
        pages: [
            { id: 'transactions', label: 'ประวัติการเบิก', icon: '📋', actions: ['view', 'delete'] },
        ],
    },
    {
        id: 'people_group',
        label: '👥 จัดการบุคคล',
        pages: [
            { id: 'staff', label: 'พนักงานหลังบ้าน', icon: '👥', actions: ['view', 'edit', 'delete'] },
            { id: 'users', label: 'ผู้ใช้บริการ', icon: '👤', actions: ['view', 'delete'] },
        ],
    },
    {
        id: 'settings_group',
        label: '⚙️ ตั้งค่า กฎ-ระเบียบ',
        pages: [
            { id: 'settings_rules', label: 'กฎ-ระเบียบสวัสดิการ', icon: '📋', actions: ['view', 'edit', 'delete'] },
        ],
    },
];

// All permission page IDs
export const ALL_PERMISSION_PAGES = PERMISSION_GROUPS.flatMap(g => g.pages.map(p => p.id));

// Action labels in Thai
export const ACTION_LABELS: Record<PermissionAction, string> = {
    view: 'ดู',
    edit: 'แก้ไข',
    delete: 'ลบ',
};

// ===== Default Permissions by Role =====

export function getDefaultPermissions(role: StaffRole): StaffPermissions {
    switch (role) {
        case 'admin':
            // Admin gets all permissions on all pages
            return Object.fromEntries(
                PERMISSION_GROUPS.flatMap(g => g.pages).map(p => [p.id, [...p.actions]])
            );
        case 'editor':
            return {
                dashboard: ['view'],
                products: ['view', 'edit'],
                expenses: ['view', 'edit'],
                transactions: ['view'],
                users: ['view'],
            };
        case 'viewer':
            return {
                dashboard: ['view'],
                transactions: ['view'],
            };
        default:
            return { dashboard: ['view'] };
    }
}

// ===== Permission Check Helpers =====

/** Check if staff has a specific permission on a page */
export function hasPermission(
    permissions: StaffPermissions | undefined,
    page: string,
    action: PermissionAction
): boolean {
    if (!permissions) return false;
    const pagePerms = permissions[page];
    if (!pagePerms) return false;
    return pagePerms.includes(action);
}

/** Get all tab IDs that have 'view' permission (mapped to sidebar tab names) */
export function getVisibleTabs(permissions: StaffPermissions | undefined): string[] {
    if (!permissions) return ['dashboard'];
    const tabs: string[] = [];

    // Map permission page IDs back to sidebar tab IDs
    for (const [pageId, actions] of Object.entries(permissions)) {
        if (!actions.includes('view')) continue;

        // Settings sub-pages map to the 'settings' tab
        if (pageId.startsWith('settings_')) {
            if (!tabs.includes('settings')) tabs.push('settings');
        } else {
            if (!tabs.includes(pageId)) tabs.push(pageId);
        }
    }

    return tabs;
}

/** Get visible settings sub-tabs */
export function getVisibleSettingsSubTabs(permissions: StaffPermissions | undefined): string[] {
    if (!permissions) return [];
    const subTabs: string[] = [];
    if (permissions['settings_rules']?.includes('view')) subTabs.push('rules');
    return subTabs;
}
