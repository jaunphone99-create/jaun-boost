'use client';

import { Expense } from './types';
import { supabase, isSupabaseMode } from './supabase';

const EXPENSES_KEY = 'pantry_expenses';

// ===== Local Storage Helpers =====
function getLocalExpenses(): Expense[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
}

function saveLocalExpenses(expenses: Expense[]): void {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

// ===== Expenses API (Supabase + localStorage fallback) =====

export async function getExpenses(): Promise<Expense[]> {
    if (isSupabaseMode()) {
        try {
            const { data, error } = await supabase!.from('expenses').select('*').order('date', { ascending: false });
            if (!error && data) return data as Expense[];
        } catch {
            console.warn('Supabase failed for getExpenses, falling back to localStorage');
        }
    }
    return getLocalExpenses();
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const newExpense: Expense = {
        ...expense,
        id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    if (isSupabaseMode()) {
        try {
            const { error } = await supabase!.from('expenses').insert({
                id: newExpense.id,
                date: newExpense.date,
                product_name: newExpense.product_name,
                product_id: newExpense.product_id,
                quantity: newExpense.quantity,
                unit: newExpense.unit,
                unit_cost: newExpense.unit_cost,
                total_cost: newExpense.total_cost,
                note: newExpense.note || '',
            });
            if (!error) return newExpense;
        } catch {
            console.warn('Supabase failed for addExpense, falling back to localStorage');
        }
    }

    const expenses = getLocalExpenses();
    expenses.unshift(newExpense);
    saveLocalExpenses(expenses);
    return newExpense;
}

export async function deleteExpense(id: string): Promise<void> {
    if (isSupabaseMode()) {
        try {
            await supabase!.from('expenses').delete().eq('id', id);
            return;
        } catch {
            console.warn('Supabase failed for deleteExpense, falling back to localStorage');
        }
    }

    const expenses = getLocalExpenses().filter(e => e.id !== id);
    saveLocalExpenses(expenses);
}

export async function updateExpense(id: string, updates: Partial<Omit<Expense, 'id'>>): Promise<void> {
    if (isSupabaseMode()) {
        try {
            await supabase!.from('expenses').update(updates).eq('id', id);
            return;
        } catch {
            console.warn('Supabase failed for updateExpense, falling back to localStorage');
        }
    }

    const expenses = getLocalExpenses().map(e => e.id === id ? { ...e, ...updates } : e);
    saveLocalExpenses(expenses);
}

export async function getMonthlyExpenseTotal(year: number, month: number): Promise<number> {
    const expenses = await getExpenses();
    return expenses
        .filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() + 1 === month;
        })
        .reduce((sum, e) => sum + e.total_cost, 0);
}

export async function getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
    const expenses = await getExpenses();
    return expenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
}

// ===== Expense Activity Logs =====

export interface ExpenseLog {
    id: string;
    action: 'เพิ่ม' | 'แก้ไข' | 'ลบ';
    description: string;
    admin_name: string;
    created_at: string;
}

const EXPENSE_LOGS_KEY = 'pantry_expense_logs';

function getLocalExpenseLogs(): ExpenseLog[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(EXPENSE_LOGS_KEY);
    return data ? JSON.parse(data) : [];
}

export async function addExpenseLog(action: ExpenseLog['action'], description: string, adminName: string = 'admin'): Promise<void> {
    const log: ExpenseLog = {
        id: `elog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        action,
        description,
        admin_name: adminName,
        created_at: new Date().toISOString(),
    };

    if (isSupabaseMode()) {
        try {
            await supabase!.from('expense_logs').insert(log);
            return;
        } catch {
            console.warn('Supabase failed for addExpenseLog, falling back to localStorage');
        }
    }

    const logs = getLocalExpenseLogs();
    logs.unshift(log);
    localStorage.setItem(EXPENSE_LOGS_KEY, JSON.stringify(logs));
}

export async function getExpenseLogs(): Promise<ExpenseLog[]> {
    if (isSupabaseMode()) {
        try {
            const { data, error } = await supabase!.from('expense_logs').select('*').order('created_at', { ascending: false }).limit(100);
            if (!error && data) return data as ExpenseLog[];
        } catch {
            console.warn('Supabase failed for getExpenseLogs, falling back to localStorage');
        }
    }
    return getLocalExpenseLogs();
}

export async function clearExpenseLogs(): Promise<void> {
    if (isSupabaseMode()) {
        try {
            await supabase!.from('expense_logs').delete().neq('id', '');
            return;
        } catch {
            console.warn('Supabase failed for clearExpenseLogs');
        }
    }
    localStorage.setItem(EXPENSE_LOGS_KEY, JSON.stringify([]));
}
