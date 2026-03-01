'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product, StaffPermissions } from '@/lib/types';
import './settings.css';
import { Transaction } from '@/lib/types';
import {
    getProducts,
    getAllTransactions,
    getStaff,
    getServiceUsers,
    type Staff,
    type ServiceUser,
} from '@/lib/sheets-api';
import { getDefaultPermissions, getVisibleTabs, getVisibleSettingsSubTabs, hasPermission } from '@/lib/permissions';
import { getExpenses } from '@/lib/expenses-api';
import { Expense } from '@/lib/types';
import { Tab } from './types';

// Tab Components
import DashboardTab from './components/DashboardTab';
import ProductsTab from './components/ProductsTab';
import ExpensesTab from './components/ExpensesTab';
import TransactionsTab from './components/TransactionsTab';
import UsersTab from './components/UsersTab';
import StaffTab from './components/StaffTab';
import SettingsTab from './components/SettingsTab';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        if (typeof window !== 'undefined') {
            return (sessionStorage.getItem('adminActiveTab') as Tab) || 'dashboard';
        }
        return 'dashboard';
    });
    const [products, setProducts] = useState<Product[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const settingsSubTab = 'rules' as const;

    // Toast
    const [toast, setToast] = useState<string | null>(null);

    // Admin login state
    const [adminLoggedIn, setAdminLoggedIn] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [adminLoginId, setAdminLoginId] = useState('');
    const [adminLoginPassword, setAdminLoginPassword] = useState('');
    const [adminLoginError, setAdminLoginError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [adminUser, setAdminUser] = useState<Staff | null>(null);

    // Check if admin session exists on mount
    useEffect(() => {
        const session = sessionStorage.getItem('admin_session');
        if (session) {
            try {
                const data = JSON.parse(session);
                setAdminUser(data);
                setAdminLoggedIn(true);
            } catch { /* ignore */ }
        }
        setCheckingAuth(false);
    }, []);

    useEffect(() => {
        if (adminLoggedIn) loadAll();
    }, [adminLoggedIn]);

    // Sync adminUser when staffList changes (e.g. after saving permissions)
    useEffect(() => {
        if (!adminUser || staffList.length === 0) return;
        const updated = staffList.find(s => s.employee_id === adminUser.employee_id);
        if (updated && JSON.stringify(updated) !== JSON.stringify(adminUser)) {
            setAdminUser(updated);
            sessionStorage.setItem('admin_session', JSON.stringify(updated));
        }
    }, [staffList]);

    async function handleAdminLogin() {
        if (!adminLoginId.trim()) { setAdminLoginError('กรุณากรอกเบอร์โทร'); return; }
        if (!adminLoginPassword.trim()) { setAdminLoginError('กรุณากรอกรหัสผ่าน'); return; }
        const list = await getStaff();
        const staff = list.find((s) => s.employee_id === adminLoginId.trim());
        if (!staff) { setAdminLoginError('ไม่พบเบอร์โทรนี้ในระบบ'); return; }
        if ((staff.password || '1234') !== adminLoginPassword.trim()) { setAdminLoginError('รหัสผ่านไม่ถูกต้อง'); return; }
        setAdminLoginError('');
        setAdminUser(staff);
        setAdminLoggedIn(true);
        sessionStorage.setItem('admin_session', JSON.stringify(staff));
    }

    function handleAdminLogout() {
        setAdminLoggedIn(false);
        setAdminUser(null);
        setAdminLoginId('');
        setAdminLoginPassword('');
        setAdminLoginError('');
        sessionStorage.removeItem('admin_session');
    }

    async function loadAll() {
        setLoading(true);
        try {
            const [prods, txns] = await Promise.all([getProducts(), getAllTransactions()]);
            setProducts(prods);
            setTransactions(txns);
            setExpenses(await getExpenses());
            setStaffList(await getStaff());
            setServiceUsers(await getServiceUsers());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Silent background refresh (no loading spinner)
    async function silentRefresh() {
        try {
            const [prods, txns, exps, staff, users] = await Promise.all([
                getProducts(), getAllTransactions(), getExpenses(), getStaff(), getServiceUsers(),
            ]);
            setProducts(prods);
            setTransactions(txns);
            setExpenses(exps);
            setStaffList(staff);
            setServiceUsers(users);
        } catch { /* silent fail */ }
    }

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!adminLoggedIn) return;
        const interval = setInterval(silentRefresh, 30000);
        return () => clearInterval(interval);
    }, [adminLoggedIn]);

    function showToastMsg(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('th-TH', {
            day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
        });
    }

    // Permission helpers
    const rawPerms = adminUser?.permissions;
    const adminPerms: StaffPermissions = (rawPerms && Object.keys(rawPerms).length > 0) ? rawPerms : getDefaultPermissions(adminUser?.role || 'viewer');
    const adminTabs = getVisibleTabs(adminPerms);
    const visibleSettingsSubTabs = getVisibleSettingsSubTabs(adminPerms);

    const allNavItems = [
        { id: 'dashboard' as Tab, icon: '📊', label: 'แดชบอร์ด' },
        { id: 'products' as Tab, icon: '📦', label: 'สินค้า' },
        { id: 'expenses' as Tab, icon: '💰', label: 'ค่าใช้จ่าย' },
        { id: 'transactions' as Tab, icon: '📋', label: 'ประวัติการเบิก' },
        { id: 'staff' as Tab, icon: '👥', label: 'พนักงานหลังบ้าน' },
        { id: 'users' as Tab, icon: '👤', label: 'ผู้ใช้บริการ' },
        { id: 'settings' as Tab, icon: '⚙️', label: 'ตั้งค่า กฎ-ระเบียบ' },
    ];
    const navItems = allNavItems.filter(item => adminTabs.includes(item.id));

    // ===== LOADING AUTH CHECK =====
    if (checkingAuth) {
        return (
            <div className="adm-login-bg">
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '16px' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
                    กำลังตรวจสอบ...
                </div>
            </div>
        );
    }

    // ===== ADMIN LOGIN SCREEN =====
    if (!adminLoggedIn) {
        return (
            <div className="adm-login-bg">
                <div className="adm-login-card">
                    <div className="adm-login-logo">
                        <div className="adm-login-logo-icon">☕</div>
                    </div>
                    <h1 className="adm-login-brand">
                        <span className="adm-login-brand-j">JAUN</span>{' '}
                        <span className="adm-login-brand-b">BOOST</span>
                    </h1>
                    <p className="adm-login-subtitle">ระบบจัดการหลังบ้าน</p>

                    <div className="adm-login-form">
                        <label className="adm-login-label">เบอร์โทร</label>
                        <div className="adm-login-input-wrap">
                            <span className="adm-login-input-icon">👤</span>
                            <input type="tel" className="adm-login-input" placeholder="เช่น 0812345678"
                                value={adminLoginId}
                                onChange={(e) => { setAdminLoginId(e.target.value); setAdminLoginError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                                inputMode="numeric" />
                        </div>
                        <label className="adm-login-label">รหัสผ่าน</label>
                        <div className="adm-login-input-wrap">
                            <span className="adm-login-input-icon">🔒</span>
                            <input type={showPassword ? 'text' : 'password'} className="adm-login-input" placeholder="กรอกรหัสผ่าน"
                                value={adminLoginPassword}
                                onChange={(e) => { setAdminLoginPassword(e.target.value); setAdminLoginError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} />
                            <button type="button" className="adm-login-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? '🙈' : '👁'}
                            </button>
                        </div>
                        {adminLoginError && (<div className="adm-login-error">⚠️ {adminLoginError}</div>)}
                        <button className="adm-login-btn" onClick={handleAdminLogin}>เข้าสู่ระบบ</button>
                        <Link href="/" className="adm-login-back">← กลับหน้าพนักงาน</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="adm-layout">
                <div className="adm-loading"><div className="loading-spinner"></div><p>กำลังโหลดข้อมูล...</p></div>
            </div>
        );
    }

    return (
        <div className="adm-layout">
            {/* Mobile header */}
            <div className="adm-mobile-header">
                <button className="adm-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
                <h1 className="adm-mobile-title">JAUN BOOST</h1>
                <div className="adm-avatar">☕</div>
            </div>

            {/* Sidebar */}
            <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="adm-sidebar-brand" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}>☕</div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                        <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.5px' }}><span style={{ color: '#1e3a5f' }}>JAUN</span> <span style={{ color: '#ea580c' }}>BOOST</span></span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>ระบบจัดการหลังบ้าน</span>
                    </div>
                </div>
                <nav className="adm-nav">
                    {navItems.map(item => (
                        <div key={item.id}>
                            <button
                                className={`adm-nav-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    sessionStorage.setItem('adminActiveTab', item.id);
                                    if (item.id === 'settings') {
                                        sessionStorage.setItem('adminSettingsSubTab', 'rules');
                                    }
                                    setSidebarOpen(false);
                                }}
                            >
                                <span className="adm-nav-icon">{item.icon}</span>
                                <span className="adm-nav-label">{item.label}</span>
                            </button>
                        </div>
                    ))}
                </nav>
                <div className="adm-sidebar-footer">
                    <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                            {(adminUser?.employee_name || 'U').charAt(0)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, overflow: 'hidden' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminUser?.employee_name || 'ผู้ดูแลระบบ'}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{adminUser?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}</span>
                        </div>
                    </div>
                    <button onClick={() => { handleAdminLogout(); window.location.href = '/'; }} className="adm-nav-item adm-nav-back" style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <span className="adm-nav-icon">🚪</span>
                        <span className="adm-nav-label">ออกจากระบบ</span>
                    </button>
                </div>
            </aside>

            {sidebarOpen && <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Main content — Each tab is its own component */}
            <main className="adm-main">
                {activeTab === 'dashboard' && (
                    <DashboardTab products={products} transactions={transactions} expenses={expenses} formatDate={formatDate} />
                )}
                {activeTab === 'products' && (
                    <ProductsTab products={products} setProducts={setProducts} canAdd={hasPermission(adminPerms, 'products', 'edit')} canDelete={hasPermission(adminPerms, 'products', 'delete')} adminRole={adminUser?.role || 'viewer'} showToastMsg={showToastMsg} onExpenseAdded={async () => setExpenses(await getExpenses())} />
                )}
                {activeTab === 'transactions' && (
                    <TransactionsTab transactions={transactions} products={products} setTransactions={setTransactions} adminRole={adminUser?.role || 'viewer'} canDelete={hasPermission(adminPerms, 'transactions', 'delete')} showToastMsg={showToastMsg} formatDate={formatDate} />
                )}
                {activeTab === 'expenses' && (
                    <ExpensesTab products={products} expenses={expenses} setExpenses={setExpenses} adminRole={adminUser?.role || 'viewer'} adminName={adminUser?.employee_name || 'ผู้ดูแลระบบ'} canEdit={hasPermission(adminPerms, 'expenses', 'edit')} canDelete={hasPermission(adminPerms, 'expenses', 'delete')} showToastMsg={showToastMsg} />
                )}
                {activeTab === 'users' && (
                    <UsersTab serviceUsers={serviceUsers} setServiceUsers={setServiceUsers} transactions={transactions} adminRole={adminUser?.role || 'viewer'} canDelete={hasPermission(adminPerms, 'users', 'delete')} showToastMsg={showToastMsg} formatDate={formatDate} />
                )}
                {activeTab === 'staff' && (
                    <StaffTab staffList={staffList} setStaffList={setStaffList} adminRole={adminUser?.role || 'viewer'} canEdit={hasPermission(adminPerms, 'staff', 'edit')} canDelete={hasPermission(adminPerms, 'staff', 'delete')} showToastMsg={showToastMsg} />
                )}
                {activeTab === 'settings' && (
                    <SettingsTab settingsSubTab={settingsSubTab} products={products} setProducts={setProducts} setTransactions={setTransactions} canEdit={hasPermission(adminPerms, 'settings_rules', 'edit')} canDelete={hasPermission(adminPerms, 'settings_rules', 'delete')} showToastMsg={showToastMsg} />
                )}
            </main>

            {/* Toast */}
            {toast && <div className="scanned-toast">{toast}</div>}
        </div>
    );
}
