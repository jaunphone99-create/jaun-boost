'use client';

import { useState, useMemo } from 'react';
import { Product, Transaction, Expense } from '@/lib/types';

interface DashboardTabProps {
    products: Product[];
    transactions: Transaction[];
    expenses: Expense[];
    formatDate: (dateStr: string) => string;
}

type PeriodType = 'month' | 'quarter' | 'year';

function getDateRange(period: PeriodType, year: number, value: number): { start: Date; end: Date; label: string } {
    const thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    if (period === 'month') {
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

function renderProductImage(imageUrl: string | undefined, size = 32) {
    if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('http'))) {
        return <img src={imageUrl} alt="" style={{ width: size, height: size, borderRadius: 6, objectFit: 'cover' }} />;
    }
    return <span style={{ fontSize: size * 0.7 }}>{imageUrl || '📦'}</span>;
}

export default function DashboardTab({ products, transactions, expenses, formatDate }: DashboardTabProps) {
    const now = new Date();
    const [periodType, setPeriodType] = useState<PeriodType>('month');
    const [periodYear, setPeriodYear] = useState(now.getFullYear());
    const [periodValue, setPeriodValue] = useState(now.getMonth() + 1);

    const totalProducts = products.length;
    const totalStock = products.reduce((s, p) => s + p.stock_quantity, 0);
    const lowStockItems = products.filter(p =>
        p.tracking_mode === 'usage' ? p.status === 'empty' : p.stock_quantity <= 5
    ).length;
    const uniqueUsers = new Set(transactions.map(t => t.user_name)).size;

    // Period filtering
    const { start, end, label: periodLabel } = getDateRange(periodType, periodYear, periodValue);
    const filteredExpenses = useMemo(() =>
        expenses.filter(e => { const d = new Date(e.date); return d >= start && d <= end; }),
        [expenses, start.getTime(), end.getTime()]
    );
    const periodExpenseTotal = filteredExpenses.reduce((sum, e) => sum + e.total_cost, 0);
    const periodExpenseCount = filteredExpenses.length;

    const filteredTransactions = useMemo(() =>
        transactions.filter(t => { const d = new Date(t.created_at); return d >= start && d <= end; }),
        [transactions, start.getTime(), end.getTime()]
    );
    const periodWithdraw = filteredTransactions.filter(t => t.type === 'WITHDRAW').length;
    const periodRestock = filteredTransactions.filter(t => t.type === 'RESTOCK').length;

    // ===== TODAY vs YESTERDAY =====
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayTxns = transactions.filter(t => t.created_at.startsWith(todayStr));
    const yesterdayTxns = transactions.filter(t => t.created_at.startsWith(yesterdayStr));
    const todayCount = todayTxns.filter(t => t.type === 'WITHDRAW').length;
    const yesterdayCount = yesterdayTxns.filter(t => t.type === 'WITHDRAW').length;
    const diff = todayCount - yesterdayCount;

    // ===== TOP 5 Products =====
    const topProducts = useMemo(() => {
        const map: Record<string, { name: string; count: number; image?: string }> = {};
        filteredTransactions.filter(t => t.type === 'WITHDRAW').forEach(t => {
            const key = t.item_name;
            if (!map[key]) {
                const p = products.find(pr => pr.name === key);
                map[key] = { name: key, count: 0, image: p?.image_url };
            }
            map[key].count += t.amount;
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [filteredTransactions, products]);

    // ===== TOP 5 Users =====
    const topUsers = useMemo(() => {
        const map: Record<string, number> = {};
        filteredTransactions.filter(t => t.type === 'WITHDRAW').forEach(t => {
            map[t.user_name] = (map[t.user_name] || 0) + t.amount;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
    }, [filteredTransactions]);

    // ===== Peak Hours =====
    const peakHours = useMemo(() => {
        const hours = Array(24).fill(0);
        filteredTransactions.forEach(t => {
            const h = new Date(t.created_at).getHours();
            hours[h]++;
        });
        return hours;
    }, [filteredTransactions]);
    const maxHourCount = Math.max(...peakHours, 1);

    // ===== Daily Chart (last 7 days) =====
    const dailyData = useMemo(() => {
        const days: { label: string; date: string; withdraw: number; restock: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dLabel = `${d.getDate()}/${d.getMonth() + 1}`;
            const dayTx = transactions.filter(t => t.created_at.startsWith(dateStr));
            days.push({
                label: dLabel,
                date: dateStr,
                withdraw: dayTx.filter(t => t.type === 'WITHDRAW').length,
                restock: dayTx.filter(t => t.type === 'RESTOCK').length,
            });
        }
        return days;
    }, [transactions]);
    const maxDailyCount = Math.max(...dailyData.map(d => Math.max(d.withdraw, d.restock)), 1);

    // ===== Cost by Category =====
    const costByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            const p = products.find(pr => pr.name === e.product_name);
            const cat = p?.category || 'อื่นๆ';
            map[cat] = (map[cat] || 0) + e.total_cost;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [filteredExpenses, products]);
    const totalCostAll = costByCategory.reduce((s, [, v]) => s + v, 0) || 1;

    // ===== Stock vs Withdrawal by Category =====
    const categories = useMemo(() => {
        return Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    }, [products]);
    const categoryData = categories.map(cat => ({
        name: cat,
        stock: products.filter(p => p.category === cat).reduce((s, p) => s + p.stock_quantity, 0),
        withdrawn: filteredTransactions.filter(t => {
            const p = products.find(pr => pr.name === t.item_name);
            return p?.category === cat && t.type === 'WITHDRAW';
        }).reduce((s, t) => s + t.amount, 0),
    }));

    // ===== Weekly Summary =====
    const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart); lastWeekEnd.setMilliseconds(-1);
    const thisWeekTx = transactions.filter(t => new Date(t.created_at) >= thisWeekStart);
    const lastWeekTx = transactions.filter(t => { const d = new Date(t.created_at); return d >= lastWeekStart && d <= lastWeekEnd; });
    const thisWeekW = thisWeekTx.filter(t => t.type === 'WITHDRAW').length;
    const lastWeekW = lastWeekTx.filter(t => t.type === 'WITHDRAW').length;
    const weekDiff = thisWeekW - lastWeekW;

    // ===== Inactive Products (no withdrawal in 7+ days) =====
    const inactiveProducts = useMemo(() => {
        const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return products.filter(p => {
            const lastTx = transactions.find(t => t.item_name === p.name && t.type === 'WITHDRAW');
            return !lastTx || new Date(lastTx.created_at) < sevenDaysAgo;
        }).slice(0, 5);
    }, [products, transactions]);

    // Category colors and emojis
    const catEmoji: Record<string, string> = { 'อาหาร': '🍽️', 'อาหารสด': '🥩', 'ขนม': '🍰', 'เครื่องดื่ม': '🥤', 'ผลไม้': '🍎', 'ของใช้': '📦', 'ของสด': '🥬' };
    const catColors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#eab308', '#06b6d4', '#ec4899'];

    function handlePeriodTypeChange(type: PeriodType) {
        setPeriodType(type);
        if (type === 'month') setPeriodValue(now.getMonth() + 1);
        else if (type === 'quarter') setPeriodValue(Math.ceil((now.getMonth() + 1) / 3));
        else setPeriodValue(1);
    }

    const yearOptions = [];
    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) yearOptions.push(y);

    const sectionStyle = { padding: '20px', borderRadius: '16px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' } as const;
    const sectionTitle = { fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' } as const;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">แดชบอร์ด</h1>
                    <p className="adm-page-subtitle">ภาพรวมระบบเบิกอาหาร JAUN BOOST</p>
                </div>
            </div>

            {/* Period Selector */}
            <div className="adm-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>📅 ช่วงเวลา:</span>
                <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
                    {([['month', 'เดือน'], ['quarter', 'ไตรมาส'], ['year', 'ปี']] as [PeriodType, string][]).map(([type, label]) => (
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
                <select value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#f8fafc' }}>
                    {yearOptions.map(y => <option key={y} value={y}>ปี {y + 543}</option>)}
                </select>
                {periodType === 'month' && (
                    <select value={periodValue} onChange={(e) => setPeriodValue(Number(e.target.value))}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#f8fafc' }}>
                        {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                )}
                {periodType === 'quarter' && (
                    <select value={periodValue} onChange={(e) => setPeriodValue(Number(e.target.value))}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#f8fafc' }}>
                        <option value={1}>Q1</option><option value={2}>Q2</option><option value={3}>Q3</option><option value={4}>Q4</option>
                    </select>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>{periodLabel}</span>
            </div>

            {/* ===== STAT CARDS ===== */}
            <div className="adm-stats-grid">
                <div className="adm-stat-card">
                    <div className="adm-stat-header"><span className="adm-stat-label">สินค้าทั้งหมด</span><span className="adm-stat-icon adm-stat-icon-blue">📦</span></div>
                    <div className="adm-stat-value">{totalProducts}</div>
                    <div className="adm-stat-sub">รายการ</div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-header"><span className="adm-stat-label">สต๊อกรวม</span><span className="adm-stat-icon adm-stat-icon-green">✅</span></div>
                    <div className="adm-stat-value">{totalStock}</div>
                    <div className="adm-stat-sub">ชิ้น</div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-header"><span className="adm-stat-label">สินค้าใกล้หมด</span><span className="adm-stat-icon adm-stat-icon-red">⚠️</span></div>
                    <div className="adm-stat-value">{lowStockItems}</div>
                    <div className="adm-stat-sub adm-stat-sub-warning">{lowStockItems > 0 ? 'ต้องเติม!' : 'ปกติ'}</div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-header"><span className="adm-stat-label">ผู้ใช้งาน</span><span className="adm-stat-icon adm-stat-icon-purple">👥</span></div>
                    <div className="adm-stat-value">{uniqueUsers}</div>
                    <div className="adm-stat-sub">คน</div>
                </div>
                {/* Today vs Yesterday */}
                <div className="adm-stat-card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #93c5fd' }}>
                    <div className="adm-stat-header"><span className="adm-stat-label" style={{ color: '#1e40af' }}>เบิกวันนี้</span><span className="adm-stat-icon" style={{ background: '#3b82f6' }}>📊</span></div>
                    <div className="adm-stat-value" style={{ color: '#1e40af' }}>{todayCount}</div>
                    <div className="adm-stat-sub" style={{ color: diff > 0 ? '#16a34a' : diff < 0 ? '#ef4444' : '#94a3b8' }}>
                        {diff > 0 ? `▲ +${diff}` : diff < 0 ? `▼ ${diff}` : '= เท่ากับ'} เมื่อวาน ({yesterdayCount})
                    </div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-header"><span className="adm-stat-label">เบิก ({periodLabel})</span><span className="adm-stat-icon adm-stat-icon-orange">🍽️</span></div>
                    <div className="adm-stat-value">{periodWithdraw}</div>
                    <div className="adm-stat-sub">ครั้ง</div>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-header"><span className="adm-stat-label">เติม ({periodLabel})</span><span className="adm-stat-icon adm-stat-icon-teal">📦</span></div>
                    <div className="adm-stat-value">{periodRestock}</div>
                    <div className="adm-stat-sub">ครั้ง</div>
                </div>
                <div className="adm-stat-card" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa' }}>
                    <div className="adm-stat-header"><span className="adm-stat-label" style={{ color: '#92400e' }}>ค่าใช้จ่าย ({periodLabel})</span><span className="adm-stat-icon" style={{ background: '#ea580c' }}>💰</span></div>
                    <div className="adm-stat-value" style={{ color: '#ea580c' }}>฿{periodExpenseTotal.toLocaleString()}</div>
                    <div className="adm-stat-sub">{periodExpenseCount} รายการ</div>
                </div>
            </div>

            {/* ===== DAILY CHART (7 Days) ===== */}
            <div style={sectionStyle}>
                <div style={sectionTitle}>📈 กราฟเบิก/เติม 7 วันล่าสุด</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', padding: '0 4px' }}>
                    {dailyData.map(d => (
                        <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '11px', color: '#1e293b', fontWeight: 700 }}>{d.withdraw || ''}</span>
                            <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', justifyContent: 'center', flex: 1 }}>
                                <div style={{ width: '40%', background: 'linear-gradient(180deg, #f97316, #fb923c)', borderRadius: '4px 4px 0 0', height: `${(d.withdraw / maxDailyCount) * 120}px`, minHeight: d.withdraw ? 4 : 0, transition: 'height 0.3s' }} />
                                <div style={{ width: '40%', background: 'linear-gradient(180deg, #3b82f6, #60a5fa)', borderRadius: '4px 4px 0 0', height: `${(d.restock / maxDailyCount) * 120}px`, minHeight: d.restock ? 4 : 0, transition: 'height 0.3s' }} />
                            </div>
                            <span style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{d.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, background: '#f97316', borderRadius: 2, display: 'inline-block' }} /> เบิก</span>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, background: '#3b82f6', borderRadius: 2, display: 'inline-block' }} /> เติม</span>
                </div>
            </div>

            <div className="adm-grid-2col">
                {/* ===== TOP 5 Products ===== */}
                <div style={sectionStyle}>
                    <div style={sectionTitle}>🏆 Top 5 สินค้ายอดนิยม</div>
                    {topProducts.length > 0 ? topProducts.map((p, i) => (
                        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ flexShrink: 0 }}>{renderProductImage(p.image, 28)}</span>
                            <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c' }}>{p.count} ชิ้น</span>
                        </div>
                    )) : <div className="adm-empty-small">📋 ยังไม่มีข้อมูลช่วงนี้</div>}
                </div>

                {/* ===== TOP 5 Users ===== */}
                <div style={sectionStyle}>
                    <div style={sectionTitle}>👤 Top 5 ผู้ใช้บริการ</div>
                    {topUsers.length > 0 ? topUsers.map((u, i) => (
                        <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>👤</span>
                            <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>{u.count} ชิ้น</span>
                        </div>
                    )) : <div className="adm-empty-small">📋 ยังไม่มีข้อมูลช่วงนี้</div>}
                </div>
            </div>

            {/* ===== PEAK HOURS ===== */}
            <div style={sectionStyle}>
                <div style={sectionTitle}>⏰ ช่วงเวลายอดนิยม ({periodLabel})</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100px', padding: '0 4px' }}>
                    {peakHours.map((count, h) => (
                        <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                            {count > 0 && <span style={{ fontSize: '9px', color: '#64748b', marginBottom: 2 }}>{count}</span>}
                            <div style={{
                                width: '100%', borderRadius: '3px 3px 0 0', transition: 'height 0.3s',
                                height: `${(count / maxHourCount) * 80}px`, minHeight: count ? 3 : 1,
                                background: h >= 11 && h < 20 ? 'linear-gradient(180deg, #f97316, #fb923c)' : '#e2e8f0',
                            }} />
                            {(h % 3 === 0) && <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: 2 }}>{String(h).padStart(2, '0')}</span>}
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                    🔶 ช่วงเปิดให้บริการ (11:00-20:00) | ⬜ นอกเวลาให้บริการ
                </div>
            </div>

            <div className="adm-grid-2col">
                {/* ===== COST BY CATEGORY (Pie) ===== */}
                <div style={sectionStyle}>
                    <div style={sectionTitle}>💰 ต้นทุนรายหมวด ({periodLabel})</div>
                    {costByCategory.length > 0 ? (
                        <>
                            {/* Simple horizontal bar chart as pie alternative */}
                            <div style={{ display: 'flex', height: '18px', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
                                {costByCategory.map(([cat, val], i) => (
                                    <div key={cat} style={{ width: `${(val / totalCostAll) * 100}%`, background: catColors[i % catColors.length], transition: 'width 0.3s' }}
                                        title={`${cat}: ฿${val.toLocaleString()}`} />
                                ))}
                            </div>
                            {costByCategory.map(([cat, val], i) => (
                                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '13px' }}>
                                    <span style={{ width: 12, height: 12, borderRadius: 3, background: catColors[i % catColors.length], flexShrink: 0 }} />
                                    <span style={{ flex: 1, color: '#475569' }}>{catEmoji[cat] || '📁'} {cat}</span>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>฿{val.toLocaleString()}</span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', width: '40px', textAlign: 'right' }}>{Math.round((val / totalCostAll) * 100)}%</span>
                                </div>
                            ))}
                        </>
                    ) : <div className="adm-empty-small">📋 ยังไม่มีข้อมูลค่าใช้จ่ายช่วงนี้</div>}
                </div>

                {/* ===== Stock vs Withdrawal ===== */}
                <div style={sectionStyle}>
                    <div style={sectionTitle}>📊 สต๊อก vs เบิก ตามหมวด</div>
                    {categoryData.filter(c => c.stock > 0 || c.withdrawn > 0).length > 0 ? categoryData.filter(c => c.stock > 0 || c.withdrawn > 0).map(cat => {
                        const maxVal = Math.max(cat.stock, cat.withdrawn, 1);
                        return (
                            <div key={cat.name} style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 4 }}>{catEmoji[cat.name] || '📁'} {cat.name}</div>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', width: '28px' }}>สต๊อก</span>
                                    <div style={{ flex: 1, height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', background: '#10b981', borderRadius: '5px', width: `${(cat.stock / maxVal) * 100}%`, transition: 'width 0.3s' }} />
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', width: '36px', textAlign: 'right' }}>{cat.stock}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: 2 }}>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', width: '28px' }}>เบิก</span>
                                    <div style={{ flex: 1, height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', background: '#f97316', borderRadius: '5px', width: `${(cat.withdrawn / maxVal) * 100}%`, transition: 'width 0.3s' }} />
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f97316', width: '36px', textAlign: 'right' }}>{cat.withdrawn}</span>
                                </div>
                            </div>
                        );
                    }) : <div className="adm-empty-small">📋 ยังไม่มีข้อมูล</div>}
                </div>
            </div>

            <div className="adm-grid-2col">
                {/* ===== Weekly Summary ===== */}
                <div style={sectionStyle}>
                    <div style={sectionTitle}>🗓️ สรุปรายสัปดาห์</div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '120px', background: '#f0fdf4', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>สัปดาห์นี้</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#15803d' }}>{thisWeekW}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>ครั้งเบิก</div>
                        </div>
                        <div style={{ flex: 1, minWidth: '120px', background: '#f1f5f9', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>สัปดาห์ที่แล้ว</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#475569' }}>{lastWeekW}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>ครั้งเบิก</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', fontWeight: 700, color: weekDiff > 0 ? '#16a34a' : weekDiff < 0 ? '#ef4444' : '#94a3b8' }}>
                        {weekDiff > 0 ? `▲ เพิ่มขึ้น ${weekDiff} ครั้ง` : weekDiff < 0 ? `▼ ลดลง ${Math.abs(weekDiff)} ครั้ง` : '= เท่าเดิม'}
                    </div>
                </div>

                {/* ===== Inactive Products ===== */}
                <div style={sectionStyle}>
                    <div style={sectionTitle}>💤 สินค้าไม่มีคนเบิก (7 วัน)</div>
                    {inactiveProducts.length > 0 ? inactiveProducts.map((p, i) => {
                        const lastTx = transactions.find(t => t.item_name === p.name && t.type === 'WITHDRAW');
                        const daysAgo = lastTx ? Math.floor((now.getTime() - new Date(lastTx.created_at).getTime()) / 86400000) : null;
                        return (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: i < inactiveProducts.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <span style={{ flexShrink: 0 }}>{renderProductImage(p.image_url, 26)}</span>
                                <span style={{ flex: 1, fontSize: '13px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {daysAgo !== null ? `${daysAgo} วันแล้ว` : 'ยังไม่เคยเบิก'}
                                </span>
                            </div>
                        );
                    }) : <div className="adm-empty-small">✅ สินค้าทุกชิ้นถูกเบิกเป็นประจำ</div>}
                </div>
            </div>

            {/* ===== LOW STOCK ===== */}
            <div className="adm-grid-2col">
                <div style={sectionStyle}>
                    <div style={sectionTitle}>📦 สต๊อกตามหมวดหมู่</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {categoryData.map(cat => (
                            <div key={cat.name} className="adm-cat-row" style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div className="adm-cat-label">
                                    <span>{catEmoji[cat.name] || '📁'}</span>
                                    <span>{cat.name}</span>
                                </div>
                                <div className="adm-cat-bar-wrap">
                                    <div className="adm-cat-bar" style={{ width: `${totalStock > 0 ? (cat.stock / totalStock) * 100 : 0}%` }} />
                                </div>
                                <span className="adm-cat-value">{cat.stock}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={sectionStyle}>
                    <div style={sectionTitle}>⚠️ สินค้าใกล้หมด</div>
                    {products.filter(p =>
                        p.tracking_mode === 'usage' ? p.status === 'empty' : p.stock_quantity <= 10
                    ).sort((a, b) => a.stock_quantity - b.stock_quantity).slice(0, 5).map(p => (
                        <div key={p.id} className="adm-alert-row">
                            <span className="adm-alert-emoji">
                                {renderProductImage(p.image_url, 28)}
                            </span>
                            <div className="adm-alert-info">
                                <span className="adm-alert-name">{p.name}</span>
                                <div className="adm-alert-bar-wrap">
                                    <div className={`adm-alert-bar ${p.tracking_mode === 'usage' ? (p.status === 'empty' ? 'danger' : 'warning') : (p.stock_quantity <= 5 ? 'danger' : 'warning')}`}
                                        style={{ width: p.tracking_mode === 'usage' ? (p.status === 'empty' ? '5%' : '80%') : `${Math.min(100, (p.stock_quantity / 50) * 100)}%` }} />
                                </div>
                            </div>
                            <span className={`adm-alert-qty ${p.tracking_mode === 'usage' ? (p.status === 'empty' ? 'danger' : '') : (p.stock_quantity <= 5 ? 'danger' : '')}`}>
                                {p.tracking_mode === 'usage' ? `หมดแล้ว` : `${p.stock_quantity} ${p.unit}`}
                            </span>
                        </div>
                    ))}
                    {products.filter(p =>
                        p.tracking_mode === 'usage' ? p.status === 'empty' : p.stock_quantity <= 10
                    ).length === 0 && (
                            <div className="adm-empty-small">✅ สินค้าทุกชิ้นมีเพียงพอ</div>
                        )}
                </div>
            </div>

            {/* ===== RECENT ACTIVITY ===== */}
            <div className="adm-card">
                <div className="adm-card-header">
                    <h3>กิจกรรมล่าสุด</h3>
                    <span className="adm-card-badge">{todayTxns.length} วันนี้</span>
                </div>
                {transactions.length > 0 ? (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr><th>ผู้ใช้</th><th>สินค้า</th><th>ประเภท</th><th>จำนวน</th><th>เวลา</th></tr>
                            </thead>
                            <tbody>
                                {transactions.slice(0, 8).map((tx, i) => (
                                    <tr key={tx.id} className={i % 2 === 0 ? '' : 'adm-row-alt'}>
                                        <td><span className="adm-user-badge">{tx.user_name}</span></td>
                                        <td>{tx.item_name}</td>
                                        <td>
                                            <span className={`adm-type-badge ${tx.type === 'WITHDRAW' ? 'withdraw' : 'restock'}`}>
                                                {tx.type === 'WITHDRAW' ? 'เบิก' : 'เติม'}
                                            </span>
                                        </td>
                                        <td className="adm-td-number">{tx.amount}</td>
                                        <td className="adm-td-time">{formatDate(tx.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="adm-empty-small">📋 ยังไม่มีกิจกรรม</div>
                )}
            </div>
        </div>
    );
}
