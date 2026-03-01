'use client';

import { CartItem } from '@/lib/types';

interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (productId: string, delta: number) => void;
    onRemove: (productId: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export default function Cart({ items, onUpdateQuantity, onRemove, onSubmit, isSubmitting }: CartProps) {
    if (items.length === 0) return null;

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="cart-container">
            <div className="cart-header">
                <h3>🛒 รายการที่เลือก ({totalItems} รายการ)</h3>
            </div>
            <div className="cart-items">
                {items.map((item) => (
                    <div key={item.product.id} className="cart-item">
                        <span className="cart-item-emoji">{item.product.image_url}</span>
                        <span className="cart-item-name">{item.product.name}</span>
                        <div className="cart-item-controls">
                            <button
                                onClick={() => onUpdateQuantity(item.product.id, -1)}
                                className="cart-btn cart-btn-minus"
                            >
                                −
                            </button>
                            <span className="cart-item-qty">{item.quantity}</span>
                            <button
                                onClick={() => onUpdateQuantity(item.product.id, 1)}
                                className="cart-btn cart-btn-plus"
                            >
                                +
                            </button>
                            <span className="cart-item-unit">{item.product.unit}</span>
                            <button
                                onClick={() => onRemove(item.product.id)}
                                className="cart-btn cart-btn-remove"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={onSubmit}
                disabled={isSubmitting || items.length === 0}
                className="cart-submit-btn"
            >
                {isSubmitting ? '⏳ กำลังบันทึก...' : '✅ ยืนยันการเบิก (ใช้เกียรติศักดิ์)'}
            </button>
        </div>
    );
}
