'use client';

import { Product, CartItem, Transaction } from './types';
import { getLocalProducts, saveLocalProducts, getLocalTransactions, saveLocalTransactions } from './storage';

// ===== Products API (via API Routes → Turso) =====

export async function getProducts(): Promise<Product[]> {
    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('API error');
        return await res.json();
    } catch {
        return getLocalProducts();
    }
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
    const products = await getProducts();
    return products.find((p) => p.barcode === barcode) || null;
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<{ success: boolean; product: Product }> {
    const id = `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newProduct: Product = { ...product, id };
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct),
        });
        if (!res.ok) throw new Error('API error');
        return { success: true, product: newProduct };
    } catch {
        const products = getLocalProducts();
        products.push(newProduct);
        saveLocalProducts(products);
        return { success: true, product: newProduct };
    }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<{ success: boolean }> {
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        return { success: res.ok };
    } catch {
        const products = getLocalProducts();
        const idx = products.findIndex((p) => p.id === id);
        if (idx === -1) return { success: false };
        products[idx] = { ...products[idx], ...updates };
        saveLocalProducts(products);
        return { success: true };
    }
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        return { success: res.ok };
    } catch {
        saveLocalProducts(getLocalProducts().filter((p) => p.id !== id));
        return { success: true };
    }
}

export function resetProducts(): void {
    localStorage.removeItem('pantry_products');
}

// ===== Transactions API =====

export async function withdrawProducts(
    userName: string,
    items: CartItem[],
    photo?: string | null
): Promise<{ success: boolean; message: string }> {
    try {
        // Upload photo if any
        let photoUrl = '';
        if (photo) {
            try {
                const uploadRes = await fetch('/api/photos/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ photo }),
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    photoUrl = uploadData.url || photo;
                } else {
                    photoUrl = photo; // fallback: store base64
                }
            } catch {
                photoUrl = photo; // fallback: store base64
            }
        }

        for (const item of items) {
            const p = item.product;
            if (p.tracking_mode === 'usage') {
                await fetch(`/api/products/${p.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usage_count: (p.usage_count || 0) + 1 }),
                });
                await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: p.id, product_name: p.name, user_name: userName, quantity: 1, unit: p.unit, type: 'withdraw', photo: photoUrl }),
                });
            } else {
                const newStock = Math.max(0, p.stock_quantity - item.quantity);
                await fetch(`/api/products/${p.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stock_quantity: newStock }),
                });
                await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: p.id, product_name: p.name, user_name: userName, quantity: item.quantity, unit: p.unit, type: 'withdraw', photo: photoUrl }),
                });
            }
        }

        // Fire-and-forget LINE Notify
        try {
            const notifyItems = items.map((item) => ({
                name: item.product.name,
                quantity: item.quantity,
                remaining: Math.max(0, item.product.stock_quantity - item.quantity),
            }));
            fetch('/api/line-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, items: notifyItems, timestamp: Date.now() }),
            }).catch(() => { });
        } catch { }

        return { success: true, message: 'เบิกสำเร็จ' };
    } catch {
        // localStorage fallback
        const products = getLocalProducts();
        const transactions = getLocalTransactions();
        for (const item of items) {
            const idx = products.findIndex((p) => p.id === item.product.id);
            if (idx === -1) continue;
            const p = products[idx];
            const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            if (p.tracking_mode === 'usage') {
                p.usage_count = (p.usage_count || 0) + 1;
                transactions.unshift({ id: txId, product_id: p.id, item_name: p.name, user_name: userName, type: 'WITHDRAW', amount: 1, created_at: new Date().toISOString(), photo: photo || undefined });
            } else {
                p.stock_quantity = Math.max(0, p.stock_quantity - item.quantity);
                transactions.unshift({ id: txId, product_id: p.id, item_name: p.name, user_name: userName, type: 'WITHDRAW', amount: item.quantity, created_at: new Date().toISOString(), photo: photo || undefined });
            }
        }
        saveLocalProducts(products);
        saveLocalTransactions(transactions);
        return { success: true, message: 'เบิกสำเร็จ' };
    }
}

export async function recordUsage(userName: string, productId: string): Promise<{ success: boolean; message: string }> {
    try {
        const products = await getProducts();
        const product = products.find((p) => p.id === productId);
        if (!product) return { success: false, message: 'ไม่พบสินค้า' };
        await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usage_count: (product.usage_count || 0) + 1 }),
        });
        await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, product_name: product.name, user_name: userName, quantity: 1, unit: product.unit, type: 'usage' }),
        });
        return { success: true, message: `บันทึกการใช้ ${product.name} สำเร็จ` };
    } catch {
        return { success: false, message: 'เกิดข้อผิดพลาด' };
    }
}

export async function restockProduct(userName: string, productId: string, amount: number): Promise<{ success: boolean; message: string }> {
    try {
        const products = await getProducts();
        const product = products.find((p) => p.id === productId);
        if (!product) return { success: false, message: 'ไม่พบสินค้า' };
        await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock_quantity: product.stock_quantity + amount }),
        });
        await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, product_name: product.name, user_name: userName, quantity: amount, unit: product.unit, type: 'restock' }),
        });
        return { success: true, message: 'เติมสต๊อกสำเร็จ' };
    } catch {
        return { success: false, message: 'เกิดข้อผิดพลาด' };
    }
}

export async function getTransactions(limit: number = 20): Promise<Transaction[]> {
    try {
        const res = await fetch(`/api/transactions?limit=${limit}`);
        if (!res.ok) throw new Error('API error');
        return await res.json();
    } catch {
        return getLocalTransactions().slice(0, limit);
    }
}

export async function getAllTransactions(): Promise<Transaction[]> {
    try {
        const res = await fetch('/api/transactions?all=true');
        if (!res.ok) throw new Error('API error');
        return await res.json();
    } catch {
        return getLocalTransactions();
    }
}

export async function deleteTransaction(id: string): Promise<{ success: boolean }> {
    try {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        return { success: res.ok };
    } catch {
        const txns = getLocalTransactions();
        const tx = txns.find((t) => t.id === id);
        saveLocalTransactions(txns.filter((t) => t.id !== id));
        if (tx?.type === 'WITHDRAW') {
            const products = getLocalProducts();
            const pIdx = products.findIndex((p) => p.id === tx.product_id || p.name === tx.item_name);
            if (pIdx !== -1) { products[pIdx].stock_quantity += tx.amount || 1; saveLocalProducts(products); }
        }
        return { success: true };
    }
}

export async function clearAllTransactions(): Promise<{ success: boolean }> {
    try {
        const res = await fetch('/api/transactions?all=true', { method: 'DELETE' });
        return { success: res.ok };
    } catch {
        saveLocalTransactions([]);
        return { success: true };
    }
}

export async function getTodayUserCount(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const txns = await getAllTransactions();
    const uniqueUsers = new Set(txns.filter((t) => t.created_at?.startsWith(today)).map((t) => t.user_name));
    return uniqueUsers.size;
}

export function isDemo(): boolean {
    return false; // Always Turso mode now
}
