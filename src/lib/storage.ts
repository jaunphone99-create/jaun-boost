'use client';

import { Product, Transaction } from './types';
import { SAMPLE_PRODUCTS } from './sample-data';

// ===== Storage Keys =====
export const PRODUCTS_KEY = 'pantry_products';
export const TRANSACTIONS_KEY = 'pantry_transactions';
export const STAFF_KEY = 'pantry_staff';
export const USERS_KEY = 'pantry_users';
export const SESSION_KEY = 'smart_pantry_session';

// ===== Local Storage Helpers =====
export function getLocalProducts(): Product[] {
    if (typeof window === 'undefined') return SAMPLE_PRODUCTS;
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (!stored) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(SAMPLE_PRODUCTS));
        return SAMPLE_PRODUCTS;
    }
    let products: Product[] = JSON.parse(stored);

    // Auto-merge barcodes from sample data if missing
    let updated = false;
    for (const product of products) {
        if (!product.barcode) {
            const sample = SAMPLE_PRODUCTS.find(s => s.id === product.id);
            if (sample?.barcode) {
                product.barcode = sample.barcode;
                updated = true;
            }
        }
    }
    if (updated) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    }

    return products;
}

export function saveLocalProducts(products: Product[]): void {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getLocalTransactions(): Transaction[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
}

export function saveLocalTransactions(transactions: Transaction[]): void {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}
