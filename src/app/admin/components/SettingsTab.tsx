'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import { RuleSection, DEFAULT_RULES, RULES_STORAGE_KEY, RULE_COLORS } from '../types';
import { exportProductsCSV, exportTransactionsCSV, exportStaffCSV, exportUsersCSV, exportExpensesCSV, exportAllCSV } from '@/lib/export-csv';

interface SettingsTabProps {
    settingsSubTab: 'rules';
    products: Product[];
    setProducts: (p: Product[]) => void;
    setTransactions: (t: never[]) => void;
    canEdit: boolean;
    canDelete: boolean;
    showToastMsg: (msg: string) => void;
}

export default function SettingsTab({ settingsSubTab, products, setProducts, setTransactions, canEdit, canDelete, showToastMsg }: SettingsTabProps) {
    // Welfare rules state
    const [welfareRules, setWelfareRules] = useState<RuleSection[]>(() => {
        try {
            const saved = typeof window !== 'undefined' ? localStorage.getItem(RULES_STORAGE_KEY) : null;
            return saved ? JSON.parse(saved) : DEFAULT_RULES;
        } catch { return DEFAULT_RULES; }
    });
    const [editingRuleSection, setEditingRuleSection] = useState<string | null>(null);
    const [editingRuleItem, setEditingRuleItem] = useState<{ sectionId: string; index: number } | null>(null);
    const [editText, setEditText] = useState('');
    const [editSectionTitle, setEditSectionTitle] = useState('');
    const [editSectionIcon, setEditSectionIcon] = useState('');
    const [addingItemToSection, setAddingItemToSection] = useState<string | null>(null);
    const [newItemText, setNewItemText] = useState('');
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newSectionIcon, setNewSectionIcon] = useState('📌');
    const [newSectionColor, setNewSectionColor] = useState<RuleSection['color']>('blue');

    // Custom confirm modal state (replaces native confirm())
    const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

    function saveRules(updated: RuleSection[]) {
        setWelfareRules(updated);
        localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(updated));
    }

    function handleUpdateRuleItem(sectionId: string, index: number, newText: string) {
        if (!newText.trim()) return;
        const updated = welfareRules.map(s => s.id === sectionId ? { ...s, items: s.items.map((it, i) => i === index ? newText.trim() : it) } : s);
        saveRules(updated); setEditingRuleItem(null); setEditText(''); showToastMsg('✅ บันทึกแล้ว');
    }

    function handleDeleteRuleItem(sectionId: string, index: number) {
        setConfirmModal({
            message: 'ต้องการลบข้อนี้ใช่ไหม?',
            onConfirm: () => {
                const updated = welfareRules.map(s => s.id === sectionId ? { ...s, items: s.items.filter((_, i) => i !== index) } : s);
                saveRules(updated); showToastMsg('🗑️ ลบแล้ว');
                setConfirmModal(null);
            },
        });
    }

    function handleAddRuleItem(sectionId: string) {
        if (!newItemText.trim()) return;
        const updated = welfareRules.map(s => s.id === sectionId ? { ...s, items: [...s.items, newItemText.trim()] } : s);
        saveRules(updated); setAddingItemToSection(null); setNewItemText(''); showToastMsg('➕ เพิ่มแล้ว');
    }

    function handleStartEditSection(section: RuleSection) {
        setEditingRuleSection(section.id); setEditSectionTitle(section.title); setEditSectionIcon(section.icon);
    }

    function handleSaveSection(sectionId: string) {
        if (!editSectionTitle.trim()) return;
        const updated = welfareRules.map(s => s.id === sectionId ? { ...s, title: editSectionTitle.trim(), icon: editSectionIcon } : s);
        saveRules(updated); setEditingRuleSection(null); showToastMsg('✅ บันทึกแล้ว');
    }

    function handleDeleteSection(sectionId: string) {
        setConfirmModal({
            message: 'ต้องการลบหมวดนี้ทั้งหมดใช่ไหม?',
            onConfirm: () => {
                const updated = welfareRules.filter(s => s.id !== sectionId);
                saveRules(updated); showToastMsg('🗑️ ลบหมวดแล้ว');
                setConfirmModal(null);
            },
        });
    }

    function handleAddNewSection() {
        if (!newSectionTitle.trim()) return;
        const newSection: RuleSection = { id: `section_${Date.now()}`, icon: newSectionIcon, title: newSectionTitle.trim(), color: newSectionColor, items: [] };
        saveRules([...welfareRules, newSection]);
        setShowAddSection(false); setNewSectionTitle(''); setNewSectionIcon('📌'); setNewSectionColor('blue');
        showToastMsg('➕ เพิ่มหมวดแล้ว');
    }

    return (
        <>
            <div className="stg-header">
                <div className="stg-header-icon">⚙️</div>
                <div>
                    <h1 className="stg-header-title">ตั้งค่าระบบ</h1>
                    <p className="stg-header-sub">กฎระเบียบสวัสดิการอาหาร</p>
                </div>
            </div>

            {settingsSubTab === 'rules' && (
                <div className="stg-card">
                    <div className="stg-card-top stg-card-top-orange">
                        <span className="stg-card-badge">📋</span>
                        <div>
                            <h3 className="stg-card-title">กฎ-ระเบียบสวัสดิการอาหาร</h3>
                            <p className="stg-card-desc">กฎระเบียบที่พนักงานต้องยอมรับก่อนเบิกอาหาร (แก้ไขได้)</p>
                        </div>
                    </div>
                    <div className="stg-card-body">
                        {welfareRules.map((section) => (
                            <div key={section.id} className={`stg-rule-section stg-rule-${section.color}`}>
                                <div className="stg-rule-header">
                                    {editingRuleSection === section.id ? (
                                        <div className="stg-edit-section-form">
                                            <input type="text" value={editSectionIcon} onChange={(e) => setEditSectionIcon(e.target.value)} className="stg-edit-icon-input" placeholder="Icon" />
                                            <input type="text" value={editSectionTitle} onChange={(e) => setEditSectionTitle(e.target.value)} className="stg-edit-title-input" placeholder="ชื่อหมวด" autoFocus />
                                            <button onClick={() => handleSaveSection(section.id)} className="stg-action-btn stg-action-save" title="บันทึก">✓</button>
                                            <button onClick={() => setEditingRuleSection(null)} className="stg-action-btn stg-action-cancel" title="ยกเลิก">✕</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="stg-rule-icon">{section.icon}</span>
                                            <h4>{section.title}</h4>
                                            <div className="stg-section-actions">
                                                {canEdit && <button onClick={() => handleStartEditSection(section)} className="stg-action-btn stg-action-edit" title="แก้ไขหมวด">✏️</button>}
                                                {canDelete && <button onClick={() => handleDeleteSection(section.id)} className="stg-action-btn stg-action-delete" title="ลบหมวด">🗑️</button>}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <ul className="stg-rule-list">
                                    {section.items.map((item, idx) => (
                                        <li key={idx}>
                                            {editingRuleItem?.sectionId === section.id && editingRuleItem?.index === idx ? (
                                                <div className="stg-edit-item-form">
                                                    <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="stg-edit-item-input" autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleUpdateRuleItem(section.id, idx, editText);
                                                            if (e.key === 'Escape') { setEditingRuleItem(null); setEditText(''); }
                                                        }} />
                                                    <button onClick={() => handleUpdateRuleItem(section.id, idx, editText)} className="stg-action-btn stg-action-save" title="บันทึก">✓</button>
                                                    <button onClick={() => { setEditingRuleItem(null); setEditText(''); }} className="stg-action-btn stg-action-cancel" title="ยกเลิก">✕</button>
                                                </div>
                                            ) : (
                                                <div className="stg-rule-item-row">
                                                    <span className="stg-rule-item-text">{item}</span>
                                                    <div className="stg-item-actions">
                                                        {canEdit && <button onClick={() => { setEditingRuleItem({ sectionId: section.id, index: idx }); setEditText(item); }} className="stg-action-btn stg-action-edit" title="แก้ไข">✏️</button>}
                                                        {canDelete && <button onClick={() => handleDeleteRuleItem(section.id, idx)} className="stg-action-btn stg-action-delete" title="ลบ">🗑️</button>}
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                {addingItemToSection === section.id ? (
                                    <div className="stg-add-item-form">
                                        <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} className="stg-edit-item-input" placeholder="พิมพ์กฎ/ระเบียบใหม่..." autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddRuleItem(section.id);
                                                if (e.key === 'Escape') { setAddingItemToSection(null); setNewItemText(''); }
                                            }} />
                                        <button onClick={() => handleAddRuleItem(section.id)} className="stg-action-btn stg-action-save" title="เพิ่ม">✓</button>
                                        <button onClick={() => { setAddingItemToSection(null); setNewItemText(''); }} className="stg-action-btn stg-action-cancel" title="ยกเลิก">✕</button>
                                    </div>
                                ) : canEdit ? (
                                    <button onClick={() => { setAddingItemToSection(section.id); setNewItemText(''); }} className="stg-add-item-btn">＋ เพิ่มข้อ</button>
                                ) : null}
                            </div>
                        ))}

                        {showAddSection ? (
                            <div className="stg-add-section-form">
                                <h4 className="stg-add-section-title">เพิ่มหมวดใหม่</h4>
                                <div className="stg-add-section-row">
                                    <input type="text" value={newSectionIcon} onChange={(e) => setNewSectionIcon(e.target.value)} className="stg-edit-icon-input" placeholder="Icon" />
                                    <input type="text" value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} className="stg-edit-title-input" placeholder="ชื่อหมวด" autoFocus />
                                </div>
                                <div className="stg-color-picker">
                                    {RULE_COLORS.map((c) => (
                                        <button key={c} className={`stg-color-btn stg-color-${c} ${newSectionColor === c ? 'active' : ''}`} onClick={() => setNewSectionColor(c)} title={c} />
                                    ))}
                                </div>
                                <div className="stg-add-section-actions">
                                    <button onClick={handleAddNewSection} className="stg-btn stg-btn-save">เพิ่มหมวด</button>
                                    <button onClick={() => setShowAddSection(false)} className="stg-btn stg-btn-cancel">ยกเลิก</button>
                                </div>
                            </div>
                        ) : canEdit ? (
                            <button onClick={() => setShowAddSection(true)} className="stg-add-section-btn">＋ เพิ่มหมวดใหม่</button>
                        ) : null}
                    </div>
                </div>
            )}

            {/* === Export Section === */}
            <div className="stg-card" style={{ marginTop: '24px' }}>
                <div className="stg-card-top" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <span className="stg-card-badge">📊</span>
                    <div>
                        <h3 className="stg-card-title" style={{ color: '#fff' }}>ส่งออกข้อมูล (CSV)</h3>
                        <p className="stg-card-desc" style={{ color: 'rgba(255,255,255,0.85)' }}>ดาวน์โหลดข้อมูลเป็นไฟล์ CSV สำหรับเปิดใน Excel / Google Sheets</p>
                    </div>
                </div>
                <div className="stg-card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '20px' }}>
                    <button onClick={() => { exportProductsCSV(); showToastMsg('📦 ดาวน์โหลด Products.csv แล้ว'); }} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>📦 สินค้า</button>
                    <button onClick={() => { exportTransactionsCSV(); showToastMsg('📋 ดาวน์โหลด Transactions.csv แล้ว'); }} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>📋 ประวัติการเบิก</button>
                    <button onClick={() => { exportStaffCSV(); showToastMsg('👥 ดาวน์โหลด Staff.csv แล้ว'); }} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>👥 พนักงาน</button>
                    <button onClick={() => { exportUsersCSV(); showToastMsg('👤 ดาวน์โหลด Users.csv แล้ว'); }} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>👤 ผู้ใช้บริการ</button>
                    <button onClick={() => { exportExpensesCSV(); showToastMsg('💰 ดาวน์โหลด Expenses.csv แล้ว'); }} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>💰 ค่าใช้จ่าย</button>
                    <button onClick={() => { exportAllCSV(); showToastMsg('✅ ดาวน์โหลดทั้งหมดแล้ว'); }} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>📊 ส่งออกทั้งหมด</button>
                </div>
            </div>

            {/* Custom Confirm Modal */}
            {confirmModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10000,
                }} onClick={() => setConfirmModal(null)}>
                    <div style={{
                        background: '#fff', borderRadius: '16px', padding: '28px 32px', maxWidth: '380px', width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center',
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '24px', lineHeight: 1.5 }}>
                            {confirmModal.message}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmModal(null)}
                                style={{
                                    flex: 1, padding: '12px 20px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                    background: '#f8fafc', color: '#64748b', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                style={{
                                    flex: 1, padding: '12px 20px', borderRadius: '10px', border: 'none',
                                    background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                ลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
