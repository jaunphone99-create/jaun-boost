'use client';

import { useState, useRef } from 'react';
import { Product } from '@/lib/types';
import { getProducts, addProduct, updateProduct, deleteProduct, resetProducts } from '@/lib/sheets-api';
import { addExpense } from '@/lib/expenses-api';
import { ProductCategory, DEFAULT_PRODUCT_IMG, DEFAULT_CATEGORIES, CATEGORY_EMOJI, CUSTOM_CATEGORIES_KEY } from '../types';
import TablePagination, { usePagination } from './TablePagination';
import ConfirmModal, { useConfirmModal } from './ConfirmModal';

function isCustomImage(val: string | null | undefined): boolean {
    if (!val) return false;
    return val.startsWith('data:') || val.startsWith('http') || val.startsWith('/') || val.startsWith('blob:');
}

function ProductIcon({ src, size = 32 }: { src: string | null | undefined; size?: number }) {
    const value = src || '📦';
    if (isCustomImage(value)) {
        return <img src={value} alt="" style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover' }} />;
    }
    return <span style={{ fontSize: size * 0.75 }}>{value}</span>;
}

interface ProductsTabProps {
    products: Product[];
    setProducts: (p: Product[]) => void;
    canAdd: boolean;
    canDelete: boolean;
    adminRole: string;
    showToastMsg: (msg: string) => void;
    onExpenseAdded?: () => void;
}

export default function ProductsTab({ products, setProducts, canAdd, canDelete, adminRole, showToastMsg, onExpenseAdded }: ProductsTabProps) {
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formName, setFormName] = useState('');
    const [formBarcode, setFormBarcode] = useState('');
    const [formCategory, setFormCategory] = useState<ProductCategory>('อาหาร');
    const [formStock, setFormStock] = useState('');
    const [formUnit, setFormUnit] = useState('');
    const [formImage, setFormImage] = useState('');
    const [formTrackingMode, setFormTrackingMode] = useState<'quantity' | 'usage'>('quantity');
    const [formCostPrice, setFormCostPrice] = useState('');
    const [formSource, setFormSource] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageUploadRef = useRef<HTMLInputElement>(null);

    // Custom categories
    const [customCategories, setCustomCategories] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
        return stored ? JSON.parse(stored) : [];
    });
    const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
    const { confirmModal, showConfirm, closeConfirm } = useConfirmModal();
    const [showCategoryInput, setShowCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryEmoji, setNewCategoryEmoji] = useState('');

    function handleAddCategory() {
        setShowCategoryInput(true);
        setNewCategoryName('');
        setNewCategoryEmoji('');
    }

    function confirmAddCategory() {
        if (!newCategoryName.trim()) return;
        const trimmed = newCategoryName.trim();
        if (allCategories.includes(trimmed)) {
            showToastMsg('⚠️ หมวดหมู่นี้มีอยู่แล้ว');
            return;
        }
        const emoji = newCategoryEmoji.trim() || '📁';
        const newCustom = [...customCategories, trimmed];
        setCustomCategories(newCustom);
        localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(newCustom));
        CATEGORY_EMOJI[trimmed] = emoji;
        setFormCategory(trimmed);
        setShowCategoryInput(false);
        showToastMsg(`✅ เพิ่มหมวดหมู่ "${trimmed}" แล้ว`);
    }


    function openAddProduct() {
        setEditingProduct(null);
        setFormName(''); setFormBarcode(''); setFormCategory('อาหาร'); setFormStock(''); setFormUnit('ชิ้น'); setFormImage(''); setFormTrackingMode('quantity'); setFormCostPrice(''); setFormSource('');
        setShowProductForm(true);
    }

    function openEditProduct(product: Product) {
        setEditingProduct(product);
        setFormName(product.name); setFormBarcode(product.barcode || ''); setFormCategory(product.category); setFormStock(String(product.stock_quantity));
        setFormUnit(product.unit); setFormImage(product.image_url || ''); setFormTrackingMode(product.tracking_mode || 'quantity'); setFormCostPrice(product.cost_price ? String(product.cost_price) : ''); setFormSource(product.source || '');
        setShowProductForm(true);
    }

    async function handleSaveProduct() {
        if (!formName.trim() || !formUnit.trim()) { showToastMsg('⚠️ กรุณากรอกชื่อและหน่วยสินค้า'); return; }
        if (!formBarcode.trim()) { showToastMsg('⚠️ กรุณากรอกรหัสสินค้า'); return; }
        const isUsageMode = formTrackingMode === 'usage';
        const productData = {
            name: formName.trim(), barcode: formBarcode.trim() || null, category: formCategory,
            stock_quantity: parseInt(formStock) || (isUsageMode ? 1 : 0),
            unit: isUsageMode ? formUnit.trim() || 'กระปุก' : formUnit.trim(),
            image_url: formImage || DEFAULT_PRODUCT_IMG,
            tracking_mode: formTrackingMode,
            cost_price: parseFloat(formCostPrice) || undefined,
            source: formSource.trim() || undefined,
            ...(isUsageMode ? { usage_count: editingProduct?.usage_count || 0, status: 'available' as const } : {}),
        };
        if (editingProduct) {
            await updateProduct(editingProduct.id, productData);
            showToastMsg('✅ แก้ไขสินค้าเรียบร้อย');
        } else {
            const result = await addProduct(productData);
            // Auto-create expense if cost_price > 0
            const costPrice = parseFloat(formCostPrice) || 0;
            if (costPrice > 0) {
                const qty = parseInt(formStock) || 1;
                await addExpense({
                    date: new Date().toISOString(),
                    product_name: formName.trim(),
                    product_id: result?.product?.id || `p_${Date.now()}`,
                    quantity: qty,
                    unit: formUnit.trim() || 'ชิ้น',
                    unit_cost: costPrice / qty,
                    total_cost: costPrice,
                    note: `เพิ่มสินค้าใหม่: ${formName.trim()}${formSource.trim() ? ` (จาก${formSource.trim()})` : ''}`,
                });
                onExpenseAdded?.();
            }
            showToastMsg('✅ เพิ่มสินค้าใหม่เรียบร้อย' + (costPrice > 0 ? ` (บันทึกค่าใช้จ่าย ${costPrice.toLocaleString()} บาท)` : ''));
        }
        setShowProductForm(false);
        setProducts(await getProducts());
    }

    async function handleDeleteProduct(id: string) {
        await deleteProduct(id);
        showToastMsg('🗑️ ลบสินค้าแล้ว');
        setProducts(await getProducts());
    }

    function handleResetProducts() {
        showConfirm('ต้องการรีเซ็ตสินค้ากลับเป็นค่าเริ่มต้นใช่ไหม?', async () => {
            resetProducts();
            setProducts(await getProducts());
            showToastMsg('🔄 รีเซ็ตสินค้าเรียบร้อย');
        });
    }

    function handleExport() {
        setShowExportModal(true);
    }

    function handleDownloadCSV() {
        const header = 'รหัสสินค้า,ชื่อสินค้า,หมวดหมู่,โหมด,คงเหลือ,หน่วย,อิโมจิ,สถานะ,จำนวนใช้,ราคาต้นทุน,ที่มาสินค้า';
        const rows = products.map(p =>
            `"${p.barcode || ''}","${p.name}","${p.category}","${p.tracking_mode || 'quantity'}",${p.stock_quantity},"${p.unit}","${p.image_url || ''}","${p.status || ''}",${p.usage_count || 0},${p.cost_price || 0},"${p.source || ''}"`
        );
        const csv = '\uFEFF' + [header, ...rows].join('\n');
        const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToastMsg('✅ ดาวน์โหลดไฟล์ CSV เรียบร้อย');
        setShowExportModal(false);
    }

    async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const lines = text.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim());
            if (lines.length < 2) { showToastMsg('❌ ไฟล์ว่างหรือไม่มีข้อมูล'); return; }

            const parsed = lines.slice(1).map((line) => {
                const cols = line.match(/(\".*?\"|[^,]+)/g)?.map(c => c.replace(/^\"|\"$/g, '')) || [];
                const mode = (cols[3] || 'quantity') as 'quantity' | 'usage';
                return {
                    barcode: cols[0] || null,
                    name: cols[1] || '',
                    category: cols[2] || 'อาหาร',
                    tracking_mode: mode,
                    stock_quantity: parseFloat(cols[4]) || 0,
                    unit: cols[5] || 'ชิ้น',
                    image_url: cols[6] || '📦',
                    ...(mode === 'usage' ? { status: (cols[7] || 'available') as 'available' | 'empty', usage_count: parseInt(cols[8]) || 0 } : {}),
                    cost_price: parseFloat(cols[9]) || undefined,
                    source: cols[10] || undefined,
                };
            });

            showToastMsg(`⏳ กำลังนำเข้า ${parsed.length} รายการ...`);
            let successCount = 0;
            for (const prod of parsed) {
                const result = await addProduct(prod);
                if (result.success) successCount++;
            }
            setProducts(await getProducts());
            showToastMsg(`✅ นำเข้า ${successCount} รายการเรียบร้อย`);
        } catch {
            showToastMsg('❌ ไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ CSV ที่นำออกจากระบบ');
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.includes(searchTerm)
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const paginatedProducts = usePagination(filteredProducts, currentPage, rowsPerPage);


    return (
        <>
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">จัดการสินค้า</h1>
                    <p className="adm-page-subtitle">{products.length} รายการ</p>
                </div>
                <div className="adm-header-actions">
                    {canAdd && <button onClick={openAddProduct} className="adm-btn adm-btn-primary">＋ เพิ่มสินค้า</button>}
                </div>
            </div>
            <div className="adm-toolbar" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        type="text"
                        className="adm-input"
                        placeholder="🔍 ค้นหาสินค้า..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', paddingLeft: '14px' }}
                    />
                </div>
                <input type="file" ref={fileInputRef} accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()} className="adm-btn adm-btn-ghost" style={{ whiteSpace: 'nowrap' }}>
                    📥 นำเข้าไฟล์ CSV
                </button>
                <button onClick={handleExport} className="adm-btn adm-btn-ghost" style={{ whiteSpace: 'nowrap' }}>
                    📤 นำออกไฟล์ CSV
                </button>
            </div>

            <div className="adm-card">
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr><th></th><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>หมวดหมู่</th><th>โหมด</th><th>คงเหลือ</th><th>หน่วย</th><th>จัดการ</th></tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map((product, i) => (
                                <tr key={product.id} className={i % 2 === 0 ? '' : 'adm-row-alt'}>
                                    <td className="adm-td-emoji">
                                        <ProductIcon src={product.image_url} size={32} />
                                    </td>
                                    <td className="adm-td-barcode">{product.barcode || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                                    <td className="adm-td-name">
                                        {product.name}
                                        {product.tracking_mode === 'usage' && product.status === 'empty' && <span className="adm-badge-empty">หมด</span>}
                                    </td>
                                    <td><span className="adm-cat-badge">{product.category}</span></td>
                                    <td>
                                        {product.tracking_mode === 'usage'
                                            ? <span className="adm-mode-badge usage">☕ ชงใช้ (นับครั้ง)</span>
                                            : <span className="adm-mode-badge quantity">📦 ปกติ (นับจำนวน)</span>
                                        }
                                    </td>
                                    <td>
                                        <span className={`adm-stock-badge ${product.tracking_mode === 'usage'
                                            ? (product.status === 'empty' ? 'low' : 'ok')
                                            : (product.stock_quantity <= 5 ? 'low' : product.stock_quantity <= 15 ? 'mid' : 'ok')
                                            }`}>
                                            {product.stock_quantity}
                                        </span>
                                    </td>
                                    <td>{product.tracking_mode === 'usage' ? product.unit : product.unit}</td>
                                    <td>
                                        <div className="adm-action-btns">
                                            {canAdd && <button onClick={() => openEditProduct(product)} className="adm-icon-btn edit" title="แก้ไข">✏️</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <TablePagination
                    totalItems={filteredProducts.length}
                    currentPage={currentPage}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={setRowsPerPage}
                />
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
                <div className="adm-modal-overlay" onClick={() => setShowProductForm(false)}>
                    <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="adm-modal-header">
                            <h3>{editingProduct ? '✏️ แก้ไขสินค้า' : '＋ เพิ่มสินค้า'}</h3>
                            <button onClick={() => setShowProductForm(false)} className="adm-modal-close">✕</button>
                        </div>
                        <div className="adm-form">
                            <label className="adm-form-label">เลือกรูปสินค้า</label>
                            {/* Image Upload Section */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ width: 64, height: 64, borderRadius: 12, background: '#fff', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                    {isCustomImage(formImage) ? (
                                        <img src={formImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: 36 }}>{formImage || '📦'}</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input
                                        ref={imageUploadRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                const img = new window.Image();
                                                img.onload = () => {
                                                    const canvas = document.createElement('canvas');
                                                    const maxW = 200;
                                                    const scale = Math.min(1, maxW / img.width);
                                                    canvas.width = img.width * scale;
                                                    canvas.height = img.height * scale;
                                                    const ctx = canvas.getContext('2d')!;
                                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                                    setFormImage(canvas.toDataURL('image/jpeg', 0.7));
                                                };
                                                img.src = ev.target?.result as string;
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => imageUploadRef.current?.click()}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: 600, width: '100%', justifyContent: 'center' }}
                                    >
                                        📷 อัปโหลดรูปภาพ
                                    </button>
                                    {isCustomImage(formImage) && (
                                        <button
                                            type="button"
                                            onClick={() => { setFormImage(''); if (imageUploadRef.current) imageUploadRef.current.value = ''; }}
                                            style={{ marginTop: 6, fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >✕ ลบรูปภาพ</button>
                                    )}
                                </div>
                            </div>

                            <label className="adm-form-label" style={{ fontSize: '13px', color: '#94a3b8' }}>หรือเลือก Emoji</label>
                            <div className="adm-emoji-picker-area">
                                <div className="adm-emoji-grid-scroll">
                                    <div className="adm-emoji-cat-label">🍽️ อาหาร</div>
                                    <div className="adm-emoji-grid">
                                        {['🍜', '🍚', '🍛', '🍲', '🍱', '🥘', '🥗', '🍳', '🍕', '🍔', '🌮', '🌯', '🥟', '🍝', '🍣', '🍤', '🥪', '🫔', '🧆', '🥙'].map((emoji) => (
                                            <button key={emoji} type="button" className={`adm-emoji-btn ${formImage === emoji ? 'active' : ''}`} onClick={() => setFormImage(emoji)}>{emoji}</button>
                                        ))}
                                    </div>
                                    <div className="adm-emoji-cat-label">🥬 ของสด / วัตถุดิบ</div>
                                    <div className="adm-emoji-grid">
                                        {['🥚', '🐟', '🐔', '🍖', '🥩', '🦐', '🦑', '🌽', '🥬', '🥕', '🧅', '🍅', '🥒', '🥦', '🫑', '🌶️', '🧄', '🥔', '🍄', '🫘'].map((emoji) => (
                                            <button key={emoji} type="button" className={`adm-emoji-btn ${formImage === emoji ? 'active' : ''}`} onClick={() => setFormImage(emoji)}>{emoji}</button>
                                        ))}
                                    </div>
                                    <div className="adm-emoji-cat-label">🍰 ขนม / ของหวาน</div>
                                    <div className="adm-emoji-grid">
                                        {['🍪', '🍩', '🎂', '🍰', '🍫', '🍬', '🍭', '🧁', '🥧', '🍡', '🍮', '🍦'].map((emoji) => (
                                            <button key={emoji} type="button" className={`adm-emoji-btn ${formImage === emoji ? 'active' : ''}`} onClick={() => setFormImage(emoji)}>{emoji}</button>
                                        ))}
                                    </div>
                                    <div className="adm-emoji-cat-label">🥤 เครื่องดื่ม</div>
                                    <div className="adm-emoji-grid">
                                        {['☕', '🥤', '🧃', '💧', '🍶', '🥛', '🫖', '🍵', '🧊', '🍺', '🍷', '🧋', '🥂', '🍹'].map((emoji) => (
                                            <button key={emoji} type="button" className={`adm-emoji-btn ${formImage === emoji ? 'active' : ''}`} onClick={() => setFormImage(emoji)}>{emoji}</button>
                                        ))}
                                    </div>
                                    <div className="adm-emoji-cat-label">🍎 ผลไม้</div>
                                    <div className="adm-emoji-grid">
                                        {['🍎', '🍌', '🍊', '🍇', '🍉', '🍓', '🥭', '🍑', '🍍', '🥝', '🫐', '🍋'].map((emoji) => (
                                            <button key={emoji} type="button" className={`adm-emoji-btn ${formImage === emoji ? 'active' : ''}`} onClick={() => setFormImage(emoji)}>{emoji}</button>
                                        ))}
                                    </div>
                                    <div className="adm-emoji-cat-label">📦 ของใช้ / อื่นๆ</div>
                                    <div className="adm-emoji-grid">
                                        {['📦', '🥫', '🧴', '🧂', '🫙', '🍯', '🧈', '🫒', '🧻', '🧹', '🧤', '🪣', '🧽', '🫧'].map((emoji) => (
                                            <button key={emoji} type="button" className={`adm-emoji-btn ${formImage === emoji ? 'active' : ''}`} onClick={() => setFormImage(emoji)}>{emoji}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <label className="adm-form-label">ชื่อสินค้า *</label>
                            <input type="text" className="adm-input" placeholder="เช่น มาม่าต้มยำกุ้ง" value={formName} onChange={(e) => setFormName(e.target.value)} />
                            <label className="adm-form-label">รหัสสินค้า *</label>
                            <input type="text" className="adm-input" placeholder="เช่น SKU001, A-001" value={formBarcode} onChange={(e) => setFormBarcode(e.target.value)} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label className="adm-form-label" style={{ margin: 0 }}>หมวดหมู่</label>
                                <button type="button" onClick={handleAddCategory} style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '6px', border: '1px solid #f97316', color: '#f97316', background: '#fff7ed', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>＋ เพิ่ม</button>
                            </div>
                            <select className="adm-input" value={formCategory} onChange={(e) => setFormCategory(e.target.value as ProductCategory)}>
                                {allCategories.map(cat => (
                                    <option key={cat} value={cat}>{CATEGORY_EMOJI[cat] || '📁'} {cat}</option>
                                ))}
                            </select>
                            {showCategoryInput && (
                                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input type="text" className="adm-input" placeholder="ชื่อหมวดหมู่ใหม่" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} autoFocus style={{ margin: 0 }} />
                                    <input type="text" className="adm-input" placeholder="อิโมจิ (เว้นว่างได้)" value={newCategoryEmoji} onChange={e => setNewCategoryEmoji(e.target.value)} style={{ margin: 0 }} />
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button type="button" onClick={() => setShowCategoryInput(false)} style={{ fontSize: '13px', padding: '4px 14px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>ยกเลิก</button>
                                        <button type="button" onClick={confirmAddCategory} style={{ fontSize: '13px', padding: '4px 14px', borderRadius: '6px', border: 'none', background: '#f97316', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>✓ เพิ่มหมวดหมู่</button>
                                    </div>
                                </div>
                            )}
                            <label className="adm-form-label">ประเภทการนับ</label>
                            <div className="adm-tracking-toggle">
                                <button type="button" className={`adm-toggle-btn ${formTrackingMode === 'quantity' ? 'active' : ''}`} onClick={() => setFormTrackingMode('quantity')}>
                                    📦 ปกติ (นับจำนวน)
                                </button>
                                <button type="button" className={`adm-toggle-btn ${formTrackingMode === 'usage' ? 'active' : ''}`} onClick={() => setFormTrackingMode('usage')}>
                                    ☕ ชงใช้ (นับครั้ง)
                                </button>
                            </div>
                            {formTrackingMode === 'usage' && (
                                <div className="adm-usage-hint">
                                    💡 สินค้าแบบนี้จะนับเป็น "ครั้ง" ที่ใช้งาน ไม่หักสต๊อก<br />เหมาะกับ: กาแฟกระปุก, โอวัลติน, ขนมปี๊บ
                                </div>
                            )}
                            <div className="adm-form-row">
                                <div className="adm-form-col">
                                    <label className="adm-form-label">{formTrackingMode === 'usage' ? 'จำนวนคงเหลือ' : 'จำนวนเริ่มต้น'}</label>
                                    <input type="number" className="adm-input" placeholder={formTrackingMode === 'usage' ? 'เช่น 2' : '0'} value={formStock} onChange={(e) => setFormStock(e.target.value)} />
                                </div>
                                <div className="adm-form-col">
                                    <label className="adm-form-label">{formTrackingMode === 'usage' ? 'หน่วยบรรจุ' : 'หน่วยนับ'}</label>
                                    <input type="text" className="adm-input" placeholder={formTrackingMode === 'usage' ? 'เช่น กระปุก' : 'เช่น ซอง'} value={formUnit} onChange={(e) => setFormUnit(e.target.value)} />
                                </div>
                            </div>
                            <label className="adm-form-label">ราคาต้นทุน (ตามบิล/บาท) *</label>
                            <input type="number" className="adm-input" placeholder="เช่น 350 (ใส่ 0 ได้)" value={formCostPrice} onChange={(e) => setFormCostPrice(e.target.value)} min="0" step="0.01" />

                            <label className="adm-form-label">🏪 ที่มาสินค้า</label>
                            <input type="text" className="adm-input" list="source-suggestions" placeholder="เช่น แม็คโคร, โลตัส, Big C" value={formSource} onChange={(e) => setFormSource(e.target.value)} />
                            <datalist id="source-suggestions">
                                <option value="แม็คโคร" />
                                <option value="โลตัส" />
                                <option value="Big C" />
                                <option value="7-Eleven" />
                                <option value="ตลาดสด" />
                                <option value="Shopee" />
                                <option value="Lazada" />
                                <option value="อื่นๆ" />
                            </datalist>
                            {/* สถานะสินค้า (เฉพาะ usage mode + แก้ไข) */}
                            {editingProduct && editingProduct.tracking_mode === 'usage' && (
                                <div className="adm-status-toggle">
                                    <label className="adm-form-label">สถานะสินค้า</label>
                                    <div className="adm-tracking-toggle">
                                        <button type="button" className={`adm-toggle-btn ${editingProduct.status !== 'empty' ? 'active' : ''}`}
                                            onClick={async () => {
                                                await updateProduct(editingProduct.id, { status: 'available' });
                                                setProducts(await getProducts());
                                                setEditingProduct({ ...editingProduct, status: 'available' });
                                                showToastMsg('✅ ตั้งเป็นพร้อมใช้');
                                            }}>
                                            🟢 พร้อมใช้งาน
                                        </button>
                                        <button type="button" className={`adm-toggle-btn ${editingProduct.status === 'empty' ? 'active' : ''}`}
                                            style={editingProduct.status === 'empty' ? { borderColor: '#dc2626', background: '#fef2f2', color: '#dc2626' } : {}}
                                            onClick={async () => {
                                                await updateProduct(editingProduct.id, { status: 'empty' });
                                                setProducts(await getProducts());
                                                setEditingProduct({ ...editingProduct, status: 'empty' });
                                                showToastMsg('⚠️ ตั้งเป็นหมดแล้ว');
                                            }}>
                                            🔴 สินค้าหมด
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="adm-form-actions">
                                {editingProduct && canDelete && (
                                    <button onClick={async () => {
                                        await deleteProduct(editingProduct.id);
                                        showToastMsg('🗑️ ลบสินค้าแล้ว');
                                        setShowProductForm(false);
                                        setProducts(await getProducts());
                                    }} className="adm-btn adm-btn-danger" style={{ marginRight: 'auto' }}>
                                        🗑️ ลบสินค้า
                                    </button>
                                )}
                                <button onClick={() => setShowProductForm(false)} className="adm-btn adm-btn-ghost">ยกเลิก</button>
                                <button onClick={handleSaveProduct} className="adm-btn adm-btn-primary">
                                    {editingProduct ? '💾 บันทึก' : '＋ เพิ่มสินค้า'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Preview Modal */}
            {showExportModal && (
                <div className="adm-modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="adm-modal-header">
                            <h3>📊 ดูข้อมูลสินค้า ({products.length} รายการ)</h3>
                            <button onClick={() => setShowExportModal(false)} className="adm-icon-btn" style={{ fontSize: '20px' }}>✕</button>
                        </div>
                        <div style={{ overflow: 'auto', flex: 1 }}>
                            <table className="adm-table">
                                <thead>
                                    <tr><th>#</th><th></th><th>ชื่อสินค้า</th><th>หมวดหมู่</th><th>โหมด</th><th>คงเหลือ</th><th>หน่วย</th></tr>
                                </thead>
                                <tbody>
                                    {products.map((p, i) => (
                                        <tr key={p.id} className={i % 2 === 0 ? '' : 'adm-row-alt'}>
                                            <td style={{ color: '#94a3b8', fontSize: '13px' }}>{i + 1}</td>
                                            <td className="adm-td-emoji"><ProductIcon src={p.image_url} size={28} /></td>
                                            <td><strong>{p.name}</strong></td>
                                            <td><span className="adm-cat-badge">{p.category}</span></td>
                                            <td>{p.tracking_mode === 'usage' ? '☕ ชงใช้' : '📦 ปกติ'}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.stock_quantity}</td>
                                            <td>{p.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="adm-form-actions" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                            <button onClick={() => setShowExportModal(false)} className="adm-btn adm-btn-ghost">ปิด</button>
                            <button onClick={handleDownloadCSV} className="adm-btn adm-btn-primary">⬇️ ดาวน์โหลด CSV</button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal modal={confirmModal} onClose={closeConfirm} />
        </>
    );
}
