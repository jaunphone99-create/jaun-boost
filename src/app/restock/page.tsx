'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { getProducts, getProductByBarcode, restockProduct, getCurrentUser } from '@/lib/sheets-api';
import BarcodeScanner from '@/components/BarcodeScanner';
import ProductCard from '@/components/ProductCard';
import HonorModal from '@/components/HonorModal';

export default function RestockPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState('');
    const [userName, setUserName] = useState('');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [showHonor, setShowHonor] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
        // Auto-fill name from session (employee or admin)
        const session = getCurrentUser();
        if (session) {
            setUserName(session.employee_name || session.name || '');
            setIsAuthed(true);
        }
        loadProducts();
    }, []);

    async function loadProducts() {
        try {
            const prods = await getProducts();
            setProducts(prods);
        } catch (err) {
            console.error('Failed to load products:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleScan = useCallback(async (barcode: string) => {
        setScannerOpen(false);
        const product = await getProductByBarcode(barcode);
        if (product) {
            setSelectedProduct(product);
            showToast(`✅ พบสินค้า: ${product.name}`);
        } else {
            showToast(`❌ ไม่พบสินค้าบาร์โค้ด: ${barcode}`);
        }
    }, []);

    function selectProduct(product: Product) {
        setSelectedProduct(product);
    }

    async function handleSubmit() {
        if (!userName.trim()) {
            showToast('⚠️ กรุณาใส่ชื่อก่อนครับ');
            return;
        }
        if (!selectedProduct) {
            showToast('⚠️ กรุณาเลือกสินค้าก่อนครับ');
            return;
        }
        const qty = parseInt(quantity);
        if (!qty || qty <= 0) {
            showToast('⚠️ กรุณาใส่จำนวนที่ถูกต้อง');
            return;
        }

        setIsSubmitting(true);
        try {
            await restockProduct(userName.trim(), selectedProduct.id, qty);
            setShowHonor(true);
            setSelectedProduct(null);
            setQuantity('');
            loadProducts(); // refresh stock
        } catch (err) {
            console.error('Restock failed:', err);
            showToast('❌ เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    }

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    }

    if (loading) {
        return (
            <div className="app-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">กำลังโหลดสินค้า...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Header */}
            <div className="page-header">
                <Link href="/" className="back-btn">←</Link>
                <h1 className="page-title">📦 เติมสินค้าเข้าสต๊อก</h1>
            </div>

            {/* Username */}
            <div className="username-section">
                <label className="username-label">👤 ชื่อผู้เติม</label>
                {isAuthed ? (
                    <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', fontSize: '15px', fontWeight: 600, color: '#166534' }}>
                        ✅ {userName}
                    </div>
                ) : (
                    <input
                        type="text"
                        className="username-input"
                        placeholder="พิมพ์ชื่อของคุณ เช่น สมหญิง"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        autoComplete="off"
                    />
                )}
            </div>

            {/* Scanner Button */}
            <button onClick={() => setScannerOpen(true)} className="scan-btn">
                📷 สแกนบาร์โค้ดสินค้าที่จะเติม
            </button>

            {/* Scanner */}
            <BarcodeScanner
                isActive={scannerOpen}
                onScan={handleScan}
                onClose={() => setScannerOpen(false)}
            />

            <div className="divider-or">หรือเลือกจากรายการ</div>

            {/* Product Selection Grid */}
            <h3 className="section-title">👆 เลือกสินค้าที่จะเติม</h3>
            <div className="products-grid">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onClick={selectProduct}
                        mode="restock"
                    />
                ))}
            </div>

            {/* Selected Product + Quantity Form */}
            {selectedProduct && (
                <div className="restock-form" style={{ marginTop: '20px' }}>
                    <div className="restock-selected-product">
                        <div className="restock-selected-emoji">{selectedProduct.image_url}</div>
                        <div className="restock-selected-name">{selectedProduct.name}</div>
                        <div className="restock-selected-stock">
                            คงเหลือปัจจุบัน: {selectedProduct.stock_quantity} {selectedProduct.unit}
                        </div>
                    </div>

                    <label className="restock-label">จำนวนที่นำมาเติม</label>
                    <input
                        type="number"
                        className="restock-qty-input"
                        placeholder="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        inputMode="numeric"
                    />
                    <div className="restock-qty-unit">{selectedProduct.unit}</div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !quantity || parseInt(quantity) <= 0}
                        className="restock-submit-btn"
                    >
                        {isSubmitting ? '⏳ กำลังบันทึก...' : '✅ บันทึกการเติมของ'}
                    </button>
                </div>
            )}

            {/* Honor Modal */}
            <HonorModal
                isOpen={showHonor}
                onClose={() => setShowHonor(false)}
                type="restock"
                userName={userName}
            />

            {/* Toast */}
            {toast && <div className="scanned-toast">{toast}</div>}
        </div>
    );
}
