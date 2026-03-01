'use client';

import { useState, useMemo, useEffect } from 'react';
import { Expense, Product } from '@/lib/types';
import { addExpense, deleteExpense, updateExpense, getExpenses, addExpenseLog, getExpenseLogs, clearExpenseLogs, ExpenseLog } from '@/lib/expenses-api';
import TablePagination, { usePagination } from './TablePagination';
import ConfirmModal, { useConfirmModal } from './ConfirmModal';

interface ExpensesTabProps {
    products: Product[];
    expenses: Expense[];
    setExpenses: (e: Expense[]) => void;
    adminRole: string;
    adminName: string;
    canEdit: boolean;
    canDelete: boolean;
    showToastMsg: (msg: string) => void;
}

type PeriodType = 'day' | 'month' | 'quarter' | 'year' | 'custom';

function getDateRange(period: PeriodType, year: number, value: number, customStart?: string, customEnd?: string): { start: Date; end: Date; label: string } {
    const thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    if (period === 'day' && customStart) {
        const d = new Date(customStart);
        return {
            start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
            end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
            label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
        };
    } else if (period === 'custom' && customStart && customEnd) {
        const s = new Date(customStart);
        const e = new Date(customEnd);
        return {
            start: new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0),
            end: new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59),
            label: `${s.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}`,
        };
    } else if (period === 'month') {
        return {
            start: new Date(year, value - 1, 1),
            end: new Date(year, value, 0, 23, 59, 59),
            label: `${thaiMonths[value]} ${year + 543}`,
        };
    } else if (period === 'quarter') {
        const startMonth = (value - 1) * 3;
        return {
            start: new Date(year, startMonth, 1),
            end: new Date(year, startMonth + 3, 0, 23, 59, 59),
            label: `ไตรมาส ${value} (${thaiMonths[startMonth + 1]}-${thaiMonths[startMonth + 3]}) ${year + 543}`,
        };
    } else {
        return {
            start: new Date(year, 0, 1),
            end: new Date(year, 11, 31, 23, 59, 59),
            label: `ปี ${year + 543}`,
        };
    }
}

export default function ExpensesTab({ products, expenses, setExpenses, adminRole, adminName, canEdit, canDelete, showToastMsg }: ExpensesTabProps) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const [showAddForm, setShowAddForm] = useState(false);
    const [periodType, setPeriodType] = useState<PeriodType>('month');
    const [periodYear, setPeriodYear] = useState(now.getFullYear());
    const [periodValue, setPeriodValue] = useState(now.getMonth() + 1);
    const [dayDate, setDayDate] = useState(todayStr);
    const [customStart, setCustomStart] = useState(todayStr);
    const [customEnd, setCustomEnd] = useState(todayStr);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Form state
    const [formItemName, setFormItemName] = useState('');
    const [formItemUnit, setFormItemUnit] = useState('ชิ้น');
    const [formQty, setFormQty] = useState('');
    const [formTotalCost, setFormTotalCost] = useState('');
    const [formNote, setFormNote] = useState('');
    const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Detail & Edit state
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [editQty, setEditQty] = useState('');
    const [editTotalCost, setEditTotalCost] = useState('');
    const [editNote, setEditNote] = useState('');
    const { confirmModal, showConfirm, closeConfirm } = useConfirmModal();

    // Activity Log
    const [activityLogs, setActivityLogs] = useState<ExpenseLog[]>([]);
    const [showLogs, setShowLogs] = useState(false);

    useEffect(() => {
        getExpenseLogs().then(setActivityLogs);
    }, []);

    const { start, end, label: periodLabel } = getDateRange(periodType, periodYear, periodValue, periodType === 'day' ? dayDate : customStart, customEnd);
    const filteredExpenses = useMemo(() =>
        expenses.filter(e => {
            const d = new Date(e.date);
            return d >= start && d <= end;
        }),
        [expenses, start.getTime(), end.getTime()]
    );

    const periodTotal = filteredExpenses.reduce((sum, e) => sum + e.total_cost, 0);
    const paginatedExpenses = usePagination(filteredExpenses, currentPage, rowsPerPage);

    async function handleAddExpense() {
        if (!formItemName.trim()) { showToastMsg('⚠️ กรุณากรอกชื่อรายการ'); return; }
        const qty = parseFloat(formQty);
        const totalCost = parseFloat(formTotalCost);
        if (!qty || qty <= 0) { showToastMsg('⚠️ กรุณากรอกจำนวน'); return; }
        if (!totalCost || totalCost <= 0) { showToastMsg('⚠️ กรุณากรอกยอดรวมตามบิล'); return; }

        await addExpense({
            date: formDate || new Date().toISOString().split('T')[0],
            product_name: formItemName.trim(),
            product_id: `misc_${Date.now()}`,
            quantity: qty,
            unit: formItemUnit.trim() || 'ชิ้น',
            unit_cost: Math.round((totalCost / qty) * 100) / 100,
            total_cost: totalCost,
            note: formNote.trim() || undefined,
        });

        setExpenses(await getExpenses());
        setShowAddForm(false);
        await addExpenseLog('เพิ่ม', `เพิ่มรายการ "${formItemName.trim()}" ${qty} ${formItemUnit} ยอด ฿${totalCost.toLocaleString()}`, adminName);
        setActivityLogs(await getExpenseLogs());
        setFormItemName(''); setFormItemUnit('ชิ้น'); setFormQty(''); setFormTotalCost(''); setFormNote('');
        showToastMsg(`✅ บันทึกค่าใช้จ่าย ฿${totalCost.toLocaleString()} เรียบร้อย`);
    }

    function handleDelete(id: string) {
        const exp = expenses.find(e => e.id === id);
        showConfirm('ต้องการลบรายการนี้?', async () => {
            await deleteExpense(id);
            setExpenses(await getExpenses());
            if (exp) {
                await addExpenseLog('ลบ', `ลบรายการ "${exp.product_name}" ยอด ฿${exp.total_cost.toLocaleString()}`, adminName);
                setActivityLogs(await getExpenseLogs());
            }
            showToastMsg('🗑️ ลบรายการเรียบร้อย');
        });
    }

    function openManage(exp: Expense) {
        setSelectedExpense(exp);
        setEditQty(String(exp.quantity));
        setEditTotalCost(String(exp.total_cost));
        setEditNote(exp.note || '');
    }

    async function handleSaveEdit() {
        if (!selectedExpense) return;
        const qty = parseFloat(editQty);
        const totalCost = parseFloat(editTotalCost);
        if (!qty || qty <= 0) { showToastMsg('⚠️ กรุณากรอกจำนวน'); return; }
        if (!totalCost || totalCost <= 0) { showToastMsg('⚠️ กรุณากรอกยอดรวม'); return; }
        const oldTotal = selectedExpense.total_cost;
        const oldQty = selectedExpense.quantity;
        await updateExpense(selectedExpense.id, {
            quantity: qty,
            total_cost: totalCost,
            unit_cost: Math.round((totalCost / qty) * 100) / 100,
            note: editNote.trim() || undefined,
        });
        setExpenses(await getExpenses());
        // Log changes
        const changes: string[] = [];
        if (oldQty !== qty) changes.push(`จำนวน ${oldQty}→${qty}`);
        if (oldTotal !== totalCost) changes.push(`ยอด ฿${oldTotal.toLocaleString()}→฿${totalCost.toLocaleString()}`);
        if (changes.length > 0) {
            await addExpenseLog('แก้ไข', `แก้ไข "${selectedExpense.product_name}" ${changes.join(', ')}`, adminName);
            setActivityLogs(await getExpenseLogs());
        }
        setSelectedExpense(null);
        showToastMsg(`✅ แก้ไขค่าใช้จ่ายเป็น ฿${totalCost.toLocaleString()} เรียบร้อย`);
    }

    function handleDeleteFromModal() {
        if (!selectedExpense) return;
        const expName = selectedExpense.product_name;
        const expTotal = selectedExpense.total_cost;
        showConfirm('ต้องการลบรายการนี้?', async () => {
            await deleteExpense(selectedExpense.id);
            setExpenses(await getExpenses());
            await addExpenseLog('ลบ', `ลบรายการ "${expName}" ยอด ฿${expTotal.toLocaleString()}`, adminName);
            setActivityLogs(await getExpenseLogs());
            setSelectedExpense(null);
            showToastMsg('🗑️ ลบรายการเรียบร้อย');
        });
    }

    function handleExportCSV() {
        const header = 'วันที่,สินค้า,จำนวน,หน่วย,ยอดตามบิล,หมายเหตุ';
        const rows = filteredExpenses.map(e =>
            `"${e.date}","${e.product_name}",${e.quantity},"${e.unit}",${e.total_cost},"${e.note || ''}"`
        );
        const footer = `"","รวมทั้งหมด","","",${periodTotal},""`;
        const csv = '\uFEFF' + [header, ...rows, footer].join('\n');
        const a = document.createElement('a');
        a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        a.download = `expenses_${periodLabel.replace(/ /g, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToastMsg('✅ ดาวน์โหลดไฟล์ CSV เรียบร้อย');
    }

    function handlePeriodTypeChange(type: PeriodType) {
        setPeriodType(type);
        if (type === 'month') setPeriodValue(now.getMonth() + 1);
        else if (type === 'quarter') setPeriodValue(Math.ceil((now.getMonth() + 1) / 3));
        else if (type === 'day') setDayDate(todayStr);
        else if (type === 'custom') { setCustomStart(todayStr); setCustomEnd(todayStr); }
        else setPeriodValue(1);
    }

    const yearOptions = [];
    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) yearOptions.push(y);

    return (
        <>
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">ค่าใช้จ่ายสวัสดิการ</h1>
                    <p className="adm-page-subtitle">ติดตามต้นทุนการจัดซื้ออาหารและของใช้</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleExportCSV} className="adm-btn adm-btn-ghost" disabled={filteredExpenses.length === 0}>
                        📥 ดาวน์โหลด CSV
                    </button>
                    {canEdit && <button onClick={() => setShowAddForm(true)} className="adm-btn adm-btn-primary">
                        ＋ บันทึกค่าใช้จ่าย
                    </button>}
                </div>
            </div>

            {/* Period Selector */}
            <div className="adm-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
                    {([['day', 'รายวัน'], ['month', 'เดือน'], ['quarter', 'ไตรมาส'], ['year', 'ปี'], ['custom', 'กำหนดเอง']] as [PeriodType, string][]).map(([type, label]) => (
                        <button key={type} onClick={() => handlePeriodTypeChange(type)}
                            style={{
                                padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 600,
                                background: periodType === type ? '#ea580c' : 'transparent',
                                color: periodType === type ? '#fff' : '#64748b',
                                transition: 'all 0.2s',
                            }}>
                            {label}
                        </button>
                    ))}
                </div>
                {periodType === 'day' && (
                    <input type="date" value={dayDate} onChange={(e) => setDayDate(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#f8fafc' }} />
                )}
                {(periodType === 'month' || periodType === 'quarter' || periodType === 'year') && (
                    <select value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#f8fafc' }}>
                        {yearOptions.map(y => <option key={y} value={y}>ปี {y + 543}</option>)}
                    </select>
                )}
                {periodType === 'month' && (
                    <select value={periodValue} onChange={(e) => setPeriodValue(Number(e.target.value))}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#f8fafc' }}>
                        {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                )}
                {periodType === 'quarter' && (
                    <select value={periodValue} onChange={(e) => setPeriodValue(Number(e.target.value))}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#f8fafc' }}>
                        <option value={1}>Q1 (ม.ค.-มี.ค.)</option>
                        <option value={2}>Q2 (เม.ย.-มิ.ย.)</option>
                        <option value={3}>Q3 (ก.ค.-ก.ย.)</option>
                        <option value={4}>Q4 (ต.ค.-ธ.ค.)</option>
                    </select>
                )}
                {periodType === 'custom' && (
                    <>
                        <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#f8fafc' }} />
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>ถึง</span>
                        <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#f8fafc' }} />
                    </>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>{periodLabel}</span>
            </div>

            {/* Summary Cards */}
            <div className="adm-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="adm-stat-card">
                    <div className="adm-stat-header">
                        <span className="adm-stat-icon" style={{ background: '#fff7ed' }}>💰</span>
                        <span className="adm-stat-label">ค่าใช้จ่าย ({periodLabel})</span>
                    </div>
                    <div className="adm-stat-value" style={{ color: '#ea580c' }}>฿{periodTotal.toLocaleString()}</div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-header">
                        <span className="adm-stat-icon" style={{ background: '#eff6ff' }}>📋</span>
                        <span className="adm-stat-label">จำนวนรายการ</span>
                    </div>
                    <div className="adm-stat-value">{filteredExpenses.length}</div>
                    <div className="adm-stat-sub">{periodLabel}</div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-header">
                        <span className="adm-stat-icon" style={{ background: '#f0fdf4' }}>📊</span>
                        <span className="adm-stat-label">เฉลี่ย/รายการ</span>
                    </div>
                    <div className="adm-stat-value">
                        ฿{filteredExpenses.length > 0 ? Math.round(periodTotal / filteredExpenses.length).toLocaleString() : '0'}
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="adm-card">
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>วันที่</th>
                                <th>สินค้า</th>
                                <th>จำนวน</th>
                                <th>ยอดตามบิล</th>
                                <th>หมายเหตุ</th>
                                {(canEdit || canDelete) && <th>จัดการ</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={(canEdit || canDelete) ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        ไม่มีรายการค่าใช้จ่ายในช่วงนี้
                                    </td>
                                </tr>
                            ) : (
                                paginatedExpenses.map((exp, i) => (
                                    <tr key={exp.id} className={i % 2 === 0 ? '' : 'adm-row-alt'}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                            {new Date(exp.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </td>
                                        <td><strong>{exp.product_name}</strong></td>
                                        <td>{exp.quantity} {exp.unit}</td>
                                        <td style={{ fontWeight: 600, color: '#ea580c' }}>฿{exp.total_cost.toLocaleString()}</td>
                                        <td style={{ fontSize: '13px', color: '#6b7280' }}>{exp.note || '—'}</td>
                                        {(canEdit || canDelete) && (
                                            <td>
                                                <button onClick={() => openManage(exp)} title="จัดการ" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '17px', padding: '2px 6px' }}>📝</button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {filteredExpenses.length > 0 && (
                            <tfoot>
                                <tr style={{ background: '#fff7ed', fontWeight: 700 }}>
                                    <td colSpan={3} style={{ textAlign: 'left', padding: '12px 14px' }}>รวม ({periodLabel})</td>
                                    <td style={{ color: '#ea580c', fontSize: '16px', padding: '12px 14px' }}>฿{periodTotal.toLocaleString()}</td>
                                    <td colSpan={(canEdit || canDelete) ? 2 : 1}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
                <TablePagination
                    totalItems={filteredExpenses.length}
                    currentPage={currentPage}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={setRowsPerPage}
                />
            </div>

            {/* Add Expense Modal */}
            {showAddForm && (
                <div className="adm-modal-overlay" onClick={() => setShowAddForm(false)}>
                    <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="adm-modal-header">
                            <h3>📝 บันทึกค่าใช้จ่ายอื่นๆ</h3>
                            <button onClick={() => setShowAddForm(false)} className="adm-modal-close">✕</button>
                        </div>
                        <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '10px 16px', margin: '16px 20px 0', fontSize: '13px', color: '#1d4ed8' }}>
                            💡 ค่าใช้จ่ายสินค้าจะบันทึกอัตโนมัติเมื่อเพิ่มสินค้า หน้านี้สำหรับรายการอื่นๆ ที่ไม่ใช่สินค้า
                        </div>
                        <div className="adm-form">
                            <label className="adm-form-label">วันที่ซื้อ</label>
                            <input type="date" className="adm-input" value={formDate} onChange={(e) => setFormDate(e.target.value)} />

                            <label className="adm-form-label">🏷️ รายการ *</label>
                            <input type="text" className="adm-input" list="misc-expense-items" placeholder="เช่น ถุงหิ้ว, กล่องโฟม, ช้อนส้อม" value={formItemName} onChange={(e) => setFormItemName(e.target.value)} />
                            <datalist id="misc-expense-items">
                                <option value="ถุงหิ้ว" />
                                <option value="กล่องโฟม" />
                                <option value="ช้อนส้อม" />
                                <option value="จานกระดาษ" />
                                <option value="ผ้าเช็ดมือ" />
                                <option value="น้ำยาล้างจาน" />
                                <option value="ค่าขนส่ง" />
                                <option value="ค่าน้ำมัน" />
                                <option value="อื่นๆ" />
                            </datalist>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label className="adm-form-label">จำนวน *</label>
                                    <input type="number" className="adm-input" placeholder="เช่น 10" value={formQty} onChange={(e) => setFormQty(e.target.value)} min="0" step="1" />
                                </div>
                                <div>
                                    <label className="adm-form-label">หน่วย</label>
                                    <input type="text" className="adm-input" placeholder="เช่น ใบ, ชิ้น" value={formItemUnit} onChange={(e) => setFormItemUnit(e.target.value)} />
                                </div>
                            </div>

                            <label className="adm-form-label">ยอดรวมตามบิล (บาท) *</label>
                            <input type="number" className="adm-input" placeholder="เช่น 350" value={formTotalCost} onChange={(e) => setFormTotalCost(e.target.value)} min="0" step="0.01" />

                            {formQty && formTotalCost && parseFloat(formQty) > 0 && (
                                <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <span style={{ color: '#166534', fontWeight: 600, fontSize: '13px' }}>📊 ต้นทุน/หน่วย</span>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>
                                        ฿{(parseFloat(formTotalCost) / parseFloat(formQty)).toFixed(2)}
                                    </span>
                                </div>
                            )}

                            <label className="adm-form-label">🏪 ซื้อจากที่ไหน</label>
                            <input type="text" className="adm-input" list="expense-source-list" placeholder="เช่น แม็คโคร, โลตัส, ตลาดสด" value={formNote} onChange={(e) => setFormNote(e.target.value)} />
                            <datalist id="expense-source-list">
                                <option value="แม็คโคร" />
                                <option value="โลตัส" />
                                <option value="Big C" />
                                <option value="7-Eleven" />
                                <option value="ตลาดสด" />
                                <option value="Shopee" />
                                <option value="Lazada" />
                                <option value="อื่นๆ" />
                            </datalist>
                        </div>
                        <div className="adm-modal-footer" style={{ marginTop: '8px' }}>
                            <button onClick={() => setShowAddForm(false)} className="adm-btn adm-btn-ghost">ยกเลิก</button>
                            <button onClick={handleAddExpense} className="adm-btn adm-btn-primary">💾 บันทึก</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Combined Detail + Edit Modal */}
            {selectedExpense && (
                <div className="adm-modal-overlay" onClick={() => setSelectedExpense(null)}>
                    <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="adm-modal-header">
                            <h3>📝 รายละเอียด & แก้ไข</h3>
                            <button onClick={() => setSelectedExpense(null)} className="adm-modal-close">✕</button>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Info Section */}
                            <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#0369a1' }}>📦 {selectedExpense.product_name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                                    <span>📅 {new Date(selectedExpense.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>

                            {/* Editable Fields */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label className="adm-form-label">🔢 จำนวน ({selectedExpense.unit})</label>
                                    <input type="number" className="adm-input" value={editQty} onChange={(e) => setEditQty(e.target.value)} min="0" step="1" />
                                </div>
                                <div>
                                    <label className="adm-form-label">💵 ยอดรวมตามบิล (บาท)</label>
                                    <input type="number" className="adm-input" value={editTotalCost} onChange={(e) => setEditTotalCost(e.target.value)} min="0" step="0.01" />
                                </div>
                                {editQty && editTotalCost && parseFloat(editQty) > 0 && (
                                    <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#166534', fontWeight: 600, fontSize: '13px' }}>📊 ต้นทุน/หน่วย</span>
                                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>
                                            ฿{(parseFloat(editTotalCost) / parseFloat(editQty)).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <label className="adm-form-label">📝 หมายเหตุ</label>
                                    <input type="text" className="adm-input" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="เช่น ซื้อจาก Makro" />
                                </div>
                            </div>
                        </div>
                        <div className="adm-modal-footer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {canDelete && <button onClick={handleDeleteFromModal} style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                🗑️ ลบรายการ
                            </button>}
                            <div style={{ flex: 1 }}></div>
                            <button onClick={() => setSelectedExpense(null)} className="adm-btn adm-btn-ghost">ยกเลิก</button>
                            <button onClick={handleSaveEdit} className="adm-btn adm-btn-primary">💾 บันทึก</button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal modal={confirmModal} onClose={closeConfirm} />

            {/* Activity Log Section */}
            <div className="adm-card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '16px 20px' }} onClick={() => setShowLogs(!showLogs)}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                        📋 ประวัติการใช้งาน <span style={{ fontSize: '13px', fontWeight: 400, color: '#94a3b8' }}>({activityLogs.length} รายการ)</span>
                    </h3>
                    <span style={{ fontSize: '18px', color: '#94a3b8', transition: 'transform 0.2s', transform: showLogs ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </div>
                {showLogs && (
                    <div style={{ padding: '0 20px 16px' }}>
                        {activityLogs.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>ยังไม่มีประวัติการใช้งาน</p>
                        ) : (
                            <>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {activityLogs.map(log => (
                                        <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                                                background: log.action === 'เพิ่ม' ? '#dcfce7' : log.action === 'แก้ไข' ? '#fef3c7' : '#fee2e2',
                                                color: log.action === 'เพิ่ม' ? '#16a34a' : log.action === 'แก้ไข' ? '#d97706' : '#dc2626',
                                                minWidth: '42px', textAlign: 'center',
                                            }}>{log.action}</span>
                                            <span style={{ flex: 1, fontSize: '13px', color: '#334155' }}>{log.description}</span>
                                            <span style={{ fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>โดย {log.admin_name}</span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                {new Date(log.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}{' '}
                                                {new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {canDelete && (
                                    <button onClick={() => showConfirm('ล้างประวัติทั้งหมด?', async () => {
                                        await clearExpenseLogs();
                                        setActivityLogs([]);
                                        showToastMsg('ล้างประวัติเรียบร้อย');
                                    })} style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}>
                                        🗑️ ล้างประวัติทั้งหมด
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
