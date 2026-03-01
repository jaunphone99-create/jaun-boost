'use client';

import { useState, useMemo } from 'react';
import { Transaction, Product } from '@/lib/types';
import { getAllTransactions, deleteTransaction, clearAllTransactions } from '@/lib/sheets-api';
import TablePagination, { usePagination } from './TablePagination';

interface TransactionsTabProps {
    transactions: Transaction[];
    products: Product[];
    setTransactions: (t: Transaction[]) => void;
    adminRole: string;
    canDelete: boolean;
    showToastMsg: (msg: string) => void;
    formatDate: (dateStr: string) => string;
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

export default function TransactionsTab({ transactions, products, setTransactions, adminRole, canDelete, showToastMsg, formatDate }: TransactionsTabProps) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const [periodType, setPeriodType] = useState<PeriodType>('month');
    const [periodYear, setPeriodYear] = useState(now.getFullYear());
    const [periodValue, setPeriodValue] = useState(now.getMonth() + 1);
    const [dayDate, setDayDate] = useState(todayStr);
    const [customStart, setCustomStart] = useState(todayStr);
    const [customEnd, setCustomEnd] = useState(todayStr);
    const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const { start, end, label: periodLabel } = getDateRange(periodType, periodYear, periodValue, periodType === 'day' ? dayDate : customStart, customEnd);
    const filteredTransactions = useMemo(() =>
        transactions.filter(t => {
            const d = new Date(t.created_at);
            return d >= start && d <= end;
        }),
        [transactions, start.getTime(), end.getTime()]
    );

    const totalWithdraw = filteredTransactions.filter(t => t.type === 'WITHDRAW').length;
    const totalRestock = filteredTransactions.filter(t => t.type === 'RESTOCK').length;
    const uniqueUsers = new Set(filteredTransactions.map(t => t.user_name)).size;
    const usePaginatedTx = usePagination(filteredTransactions, currentPage, rowsPerPage);

    // Build product image lookup
    const productImageMap = useMemo(() => {
        const map: Record<string, string> = {};
        products.forEach(p => { map[p.id] = p.image_url; });
        return map;
    }, [products]);

    async function handleDeleteTransaction(id: string) {
        await deleteTransaction(id);
        showToastMsg('🗑️ ลบรายการแล้ว');
        setTransactions(await getAllTransactions());
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
                    <h1 className="adm-page-title">ประวัติการเบิก</h1>
                    <p className="adm-page-subtitle">{filteredTransactions.length} รายการ ({periodLabel})</p>
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

            {/* Summary Stats */}
            <div className="adm-stats-grid adm-stats-grid-3">
                <div className="adm-stat-card">
                    <div className="adm-stat-header">
                        <span className="adm-stat-label">เบิก ({periodLabel})</span>
                        <span className="adm-stat-icon adm-stat-icon-orange">🍽️</span>
                    </div>
                    <div className="adm-stat-value">{totalWithdraw}</div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-header">
                        <span className="adm-stat-label">เติม ({periodLabel})</span>
                        <span className="adm-stat-icon adm-stat-icon-green">📦</span>
                    </div>
                    <div className="adm-stat-value">{totalRestock}</div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-header">
                        <span className="adm-stat-label">ผู้ใช้</span>
                        <span className="adm-stat-icon adm-stat-icon-purple">👥</span>
                    </div>
                    <div className="adm-stat-value">{uniqueUsers}</div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="adm-card">
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>ผู้ใช้</th>
                                <th>ประเภท</th>
                                <th>สินค้า</th>
                                <th>จำนวน</th>
                                <th>เวลา</th>
                                <th>รูปภาพการเบิก</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        📋 ไม่มีรายการในช่วงนี้
                                    </td>
                                </tr>
                            ) : (
                                usePaginatedTx.map((tx, i) => {
                                    const img = productImageMap[tx.product_id] || '';
                                    const isEmoji = img && !img.startsWith('http') && !img.startsWith('data:');
                                    return (
                                        <tr key={tx.id} className={i % 2 === 0 ? '' : 'adm-row-alt'}>
                                            <td><span className="adm-user-badge">{tx.user_name}</span></td>
                                            <td>
                                                <span className={`adm-type-badge ${tx.type === 'WITHDRAW' ? 'withdraw' : 'restock'}`}>
                                                    {tx.type === 'WITHDRAW' ? 'เบิก' : 'เติม'}
                                                </span>
                                            </td>
                                            <td>{tx.item_name}</td>
                                            <td className="adm-td-number">{tx.amount}</td>
                                            <td className="adm-td-time">{formatDate(tx.created_at)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                {tx.photo ? (
                                                    <img
                                                        src={tx.photo}
                                                        alt="หลักฐาน"
                                                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #e2e8f0' }}
                                                        onClick={() => setViewingPhoto(tx.photo || null)}
                                                    />
                                                ) : (
                                                    <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                {canDelete && <button onClick={() => handleDeleteTransaction(tx.id)} className="adm-icon-btn delete">🗑️</button>}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <TablePagination
                    totalItems={filteredTransactions.length}
                    currentPage={currentPage}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={setRowsPerPage}
                />
            </div>

            {/* Photo Viewing Modal */}
            {viewingPhoto && (
                <div
                    onClick={() => setViewingPhoto(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'zoom-out' }}
                >
                    <button
                        onClick={() => setViewingPhoto(null)}
                        style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer' }}
                    >✕</button>
                    <img src={viewingPhoto} alt="หลักฐานการเบิก" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }} />
                </div>
            )}
        </>
    );
}
