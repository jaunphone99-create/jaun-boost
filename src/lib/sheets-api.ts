'use client';

// ============================================
// Barrel re-export file
// All functions are now in separate modules.
// This file re-exports everything so existing 
// imports from '@/lib/sheets-api' still work.
// ============================================

// Types (re-exported from types.ts)
export type { Staff, StaffRole, ServiceUser } from './types';

// Products & Transactions API
export {
    getProducts,
    getProductByBarcode,
    addProduct,
    updateProduct,
    deleteProduct,
    resetProducts,
    withdrawProducts,
    recordUsage,
    restockProduct,
    getTransactions,
    getAllTransactions,
    deleteTransaction,
    clearAllTransactions,
    getTodayUserCount,
    isDemo,
} from './products-api';

// Staff API
export {
    ALL_ADMIN_TABS,
    getDefaultTabsForRole,
    getStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    registerStaff,
} from './staff-api';

// Service Users API
export {
    getServiceUsers,
    registerServiceUser,
    loginServiceUser,
    incrementUserWithdrawals,
    deleteServiceUser,
} from './users-api';

// Auth
export {
    loginStaff,
    getCurrentUser,
    logoutUser,
} from './auth';

// Permissions
export {
    PERMISSION_GROUPS,
    ALL_PERMISSION_PAGES,
    ACTION_LABELS,
    getDefaultPermissions,
    hasPermission,
    getVisibleTabs,
    getVisibleSettingsSubTabs,
} from './permissions';
