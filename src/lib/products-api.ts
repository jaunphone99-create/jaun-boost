'use client';

import { Product, CartItem, Transaction } from './types';
import { supabase, isSupabaseMode } from './supabase';
import { uploadPhoto } from './photo-upload';
import {
    getLocalProducts, saveLocalProducts,
    getLocalTransactions, saveLocalTransactions,
    PRODUCTS_KEY,
} from './storage';

// ===== Products API =====

export async function getProducts(): Promise<Product[]> {
    if (isSupabaseMode()) {
        try {
            const { data, error } = await supabase!.from('products').select('*').order('created_at', { ascending: true });
            if (!error && data) return data as Product[];
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }
    return getLocalProducts();
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
    const products = await getProducts();
    return products.find((p) => p.barcode === barcode) || null;
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<{ success: boolean; product: Product }> {
    const id = `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newProduct: Product = { ...product, id };

    if (isSupabaseMode()) {
        try {
            const { error } = await supabase!.from('products').insert({
                id, barcode: product.barcode || '', name: product.name,
                category: product.category, stock_quantity: product.stock_quantity || 0,
                unit: product.unit || 'ชิ้น', image_url: product.image_url || '',
                tracking_mode: product.tracking_mode || 'quantity',
                usage_count: 0, status: 'available',
                cost_price: product.cost_price || 0, source: product.source || '',
            });
            if (!error) return { success: true, product: newProduct };
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }

    const products = getLocalProducts();
    products.push(newProduct);
    saveLocalProducts(products);
    return { success: true, product: newProduct };
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<{ success: boolean }> {
    if (isSupabaseMode()) {
        try {
            const { error } = await supabase!.from('products').update(updates).eq('id', id);
            if (!error) return { success: true };
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }

    const products = getLocalProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false };
    products[idx] = { ...products[idx], ...updates };
    saveLocalProducts(products);
    return { success: true };
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
    if (isSupabaseMode()) {
        try {
            const { error } = await supabase!.from('products').delete().eq('id', id);
            if (!error) return { success: true };
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }

    const products = getLocalProducts().filter((p) => p.id !== id);
    saveLocalProducts(products);
    return { success: true };
}

export function resetProducts(): void {
    localStorage.removeItem(PRODUCTS_KEY);
}

// ===== Transactions API =====

export async function withdrawProducts(
    userName: string,
    items: CartItem[],
    photo?: string | null
): Promise<{ success: boolean; message: string }> {
    if (isSupabaseMode()) {
        try {
            // Upload photo to Supabase Storage if provided
            let photoUrl: string | null = null;
            if (photo) {
                photoUrl = await uploadPhoto(photo);
            }

            for (const item of items) {
                const p = item.product;
                const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

                if (p.tracking_mode === 'usage') {
                    await supabase!.from('products').update({
                        usage_count: (p.usage_count || 0) + 1,
                    }).eq('id', p.id);
                    await supabase!.from('transactions').insert({
                        id: txId, user_name: userName, product_name: p.name,
                        quantity: 1, unit: p.unit, type: 'usage',
                        photo: photoUrl,
                    });
                } else {
                    const newStock = Math.max(0, p.stock_quantity - item.quantity);
                    await supabase!.from('products').update({
                        stock_quantity: newStock,
                    }).eq('id', p.id);
                    await supabase!.from('transactions').insert({
                        id: txId, user_name: userName, product_name: p.name,
                        quantity: item.quantity, unit: p.unit, type: 'withdraw',
                        photo: photoUrl,
                    });
                }
            }
            return { success: true, message: 'เบิกสำเร็จ' };
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }

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

// ===== Usage Tracking (ชงใช้/ตักใช้) =====

export async function recordUsage(
    userName: string,
    productId: string
): Promise<{ success: boolean; message: string }> {
    if (isSupabaseMode()) {
        try {
            const { data: product } = await supabase!.from('products').select('*').eq('id', productId).single();
            if (!product) return { success: false, message: 'ไม่พบสินค้า' };
            await supabase!.from('products').update({ usage_count: (product.usage_count || 0) + 1 }).eq('id', productId);
            await supabase!.from('transactions').insert({
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                user_name: userName, product_name: product.name,
                quantity: 1, unit: product.unit, type: 'usage',
            });
            return { success: true, message: `บันทึกการใช้ ${product.name} สำเร็จ` };
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }

    const products = getLocalProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return { success: false, message: 'ไม่พบสินค้า' };
    const p = products[idx];
    p.usage_count = (p.usage_count || 0) + 1;
    saveLocalProducts(products);
    const transactions = getLocalTransactions();
    transactions.unshift({ id: `tx_${Date.now()}`, product_id: p.id, item_name: p.name, user_name: userName, type: 'WITHDRAW', amount: 1, created_at: new Date().toISOString() });
    saveLocalTransactions(transactions);
    return { success: true, message: `บันทึกการใช้ ${p.name} สำเร็จ` };
}

export async function restockProduct(
    userName: string,
    productId: string,
    amount: number
): Promise<{ success: boolean; message: string }> {
    if (isSupabaseMode()) {
        try {
            const { data: product } = await supabase!.from('products').select('*').eq('id', productId).single();
            if (!product) return { success: false, message: 'ไม่พบสินค้า' };
            const newStock = (product.stock_quantity || 0) + amount;
            await supabase!.from('products').update({ stock_quantity: newStock }).eq('id', productId);
            await supabase!.from('transactions').insert({
                id: `tx_${Date.now()}`,
                user_name: userName, product_name: product.name,
                quantity: amount, unit: product.unit, type: 'restock',
            });
            return { success: true, message: 'เติมสต๊อกสำเร็จ' };
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }

    const products = getLocalProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return { success: false, message: 'ไม่พบสินค้า' };
    products[idx].stock_quantity += amount;
    saveLocalProducts(products);
    const transactions = getLocalTransactions();
    transactions.unshift({ id: `tx_${Date.now()}`, product_id: products[idx].id, item_name: products[idx].name, user_name: userName, type: 'RESTOCK', amount, created_at: new Date().toISOString() });
    saveLocalTransactions(transactions);
    return { success: true, message: 'เติมสต๊อกสำเร็จ' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseTx(row: any): Transaction {
    return {
        id: row.id,
        product_id: row.product_id || '',
        item_name: row.product_name || row.item_name || '',
        user_name: row.user_name || '',
        type: (row.type || '').toUpperCase() === 'WITHDRAW' || (row.type || '').toLowerCase() === 'withdraw' ? 'WITHDRAW' : 'RESTOCK',
        amount: row.quantity ?? row.amount ?? 0,
        created_at: row.created_at || '',
        photo: row.photo || undefined,
    };
}

export async function getTransactions(limit: number = 20): Promise<Transaction[]> {
    if (isSupabaseMode()) {
        try {
            const { data, error } = await supabase!.from('transactions').select('*').order('created_at', { ascending: false }).limit(limit);
            if (!error && data) return data.map(mapSupabaseTx);
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }
    return getLocalTransactions().slice(0, limit);
}

export async function getAllTransactions(): Promise<Transaction[]> {
    if (isSupabaseMode()) {
        try {
            const { data, error } = await supabase!.from('transactions').select('*').order('created_at', { ascending: false });
            if (!error && data) return data.map(mapSupabaseTx);
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }
    return getLocalTransactions();
}

export async function deleteTransaction(id: string): Promise<{ success: boolean }> {
    if (isSupabaseMode()) {
        try {
            // Fetch the transaction first to get user_name
            const { data: txData } = await supabase!.from('transactions').select('user_name').eq('id', id).single();

            const { error } = await supabase!.from('transactions').delete().eq('id', id);
            if (!error) {
                // Decrement user withdrawal count
                if (txData?.user_name) {
                    const { data: userData } = await supabase!.from('service_users')
                        .select('total_withdrawals')
                        .eq('name', txData.user_name)
                        .single();
                    if (userData) {
                        await supabase!.from('service_users').update({
                            total_withdrawals: Math.max(0, (userData.total_withdrawals || 1) - 1),
                        }).eq('name', txData.user_name);
                    }
                }
                return { success: true };
            }
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }
    const txns = getLocalTransactions();
    const txToDelete = txns.find((t) => t.id === id);
    const filtered = txns.filter((t) => t.id !== id);
    saveLocalTransactions(filtered);
    // Decrement user withdrawal count in localStorage
    if (txToDelete) {
        const usersStr = localStorage.getItem('kiattisakUsers');
        if (usersStr) {
            const users = JSON.parse(usersStr);
            const user = users.find((u: { name: string }) => u.name === txToDelete.item_name);
            if (user) {
                user.total_withdrawals = Math.max(0, (user.total_withdrawals || 1) - 1);
                localStorage.setItem('kiattisakUsers', JSON.stringify(users));
            }
        }
    }
    return { success: true };
}

export async function clearAllTransactions(): Promise<{ success: boolean }> {
    if (isSupabaseMode()) {
        try {
            const { error } = await supabase!.from('transactions').delete().neq('id', '');
            if (!error) return { success: true };
        } catch { console.warn('Supabase failed, falling back to localStorage'); }
    }
    saveLocalTransactions([]);
    return { success: true };
}

export async function getTodayUserCount(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const txns = await getAllTransactions();
    const uniqueUsers = new Set(
        txns.filter((t) => t.created_at?.startsWith(today)).map((t) => t.user_name)
    );
    return uniqueUsers.size;
}

export function isDemo(): boolean {
    return !isSupabaseMode();
}
