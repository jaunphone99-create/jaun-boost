'use client';

import { Expense } from './types';

const EXPENSES_KEY = 'pantry_expenses';
const EXPENSE_LOGS_KEY = 'pantry_expense_logs';

// ===== Expenses API (via API Routes) =====

export async function getExpenses(): Promise<Expense[]> {
    try {
        const res = await fetch('/api/expenses');
        if (!res.ok) throw new Error('API error');
        return await res.json();
    } catch {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(EXPENSES_KEY);
        return data ? JSON.parse(data) : [];
    }
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const fallbackId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
        const res = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense),
        });
        const data = await res.json();
        return { ...expense, id: data.id || fallbackId };
    } catch {
        const newExpense: Expense = { ...expense, id: fallbackId };
        const expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
        expenses.unshift(newExpense);
        localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
        return newExpense;
    }
}

export async function deleteExpense(id: string): Promise<void> {
    try {
        await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    } catch {
        const expenses = (JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]') as Expense[]).filter(e => e.id !== id);
        localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    }
}

export async function updateExpense(id: string, updates: Partial<Omit<Expense, 'id'>>): Promise<void> {
    try {
        await fetch(`/api/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
    } catch {
        const expenses = (JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]') as Expense[]).map(e => e.id === id ? { ...e, ...updates } : e);
        localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    }
}

export async function getMonthlyExpenseTotal(year: number, month: number): Promise<number> {
    const expenses = await getExpenses();
    return expenses.filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() + 1 === month; }).reduce((sum, e) => sum + e.total_cost, 0);
}

export async function getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
    const expenses = await getExpenses();
    return expenses.filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() + 1 === month; });
}

// ===== Expense Logs =====

export interface ExpenseLog {
    id: string;
    action: 'เพิ่ม' | 'แก้ไข' | 'ลบ';
    description: string;
    admin_name: string;
    created_at: string;
}

export async function addExpenseLog(action: ExpenseLog['action'], description: string, adminName: string = 'admin'): Promise<void> {
    try {
        await fetch('/api/expense-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, description, admin_name: adminName }),
        });
    } catch {
        const log: ExpenseLog = { id: `elog_${Date.now()}`, action, description, admin_name: adminName, created_at: new Date().toISOString() };
        const logs = JSON.parse(localStorage.getItem(EXPENSE_LOGS_KEY) || '[]');
        logs.unshift(log);
        localStorage.setItem(EXPENSE_LOGS_KEY, JSON.stringify(logs));
    }
}

export async function getExpenseLogs(): Promise<ExpenseLog[]> {
    try {
        const res = await fetch('/api/expense-logs');
        if (!res.ok) throw new Error('API error');
        return await res.json();
    } catch {
        const data = localStorage.getItem(EXPENSE_LOGS_KEY);
        return data ? JSON.parse(data) : [];
    }
}

export async function clearExpenseLogs(): Promise<void> {
    try {
        await fetch('/api/expense-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clear: true }),
        });
    } catch {
        localStorage.setItem(EXPENSE_LOGS_KEY, JSON.stringify([]));
    }
}
