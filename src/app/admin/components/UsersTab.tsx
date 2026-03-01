'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { getServiceUsers, deleteServiceUser, type ServiceUser } from '@/lib/sheets-api';
import TablePagination, { usePagination } from './TablePagination';
import ConfirmModal, { useConfirmModal } from './ConfirmModal';

interface UsersTabProps {
    serviceUsers: ServiceUser[];
    setServiceUsers: (u: ServiceUser[]) => void;
    transactions: Transaction[];
    adminRole: string;
    canDelete: boolean;
    showToastMsg: (msg: string) => void;
    formatDate: (dateStr: string) => string;
}

export default function UsersTab({ serviceUsers, setServiceUsers, transactions, adminRole, canDelete, showToastMsg, formatDate }: UsersTabProps) {
    const [viewingUser, setViewingUser] = useState<ServiceUser | null>(null);
    const now = new Date();
    const [filterMonth, setFilterMonth] = useState<string>(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    const thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const paginatedUsers = usePagination(serviceUsers, currentPage, rowsPerPage);
    const { confirmModal, showConfirm, closeConfirm } = useConfirmModal();

    return (
        <>
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">ผู้ใช้บริการ</h1>
                    <p className="adm-page-subtitle">พนักงานที่ลงทะเบียนเบิกอาหาร {serviceUsers.length} คน</p>
                </div>
            </div>

            <div className="adm-card">
                {serviceUsers.length === 0 ? (
                    <div className="adm-empty-state"><p>ยังไม่มีผู้ใช้บริการลงทะเบียน</p></div>
                ) : (
                    <>
                        <div className="adm-table-wrapper">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>เบอร์โทร</th><th>ชื่อ</th><th>วันที่ลงทะเบียน</th>
                                        <th>เข้าใช้ล่าสุด</th><th>จำนวนครั้งเบิก</th><th>ดูรายละเอียด</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td><strong>{user.phone}</strong></td>
                                            <td>{user.name}</td>
                                            <td>{new Date(user.registered_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>{user.last_login ? new Date(user.last_login).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td style={{ textAlign: 'center' }}><span className="adm-badge adm-badge-blue">{user.total_withdrawals || 0} ครั้ง</span></td>
                                            <td>
                                                <div className="adm-action-btns">
                                                    <button onClick={() => setViewingUser(user)} className="adm-icon-btn edit" title="ดูข้อมูล">👁️</button>
                                                    {canDelete && <button
                                                        className="adm-icon-btn delete" title="ลบ"
                                                        onClick={() => {
                                                            showConfirm(`ลบผู้ใช้ ${user.name} ออกจากระบบ?`, async () => {
                                                                await deleteServiceUser(user.id);
                                                                setServiceUsers(await getServiceUsers());
                                                                showToastMsg('ลบผู้ใช้แล้ว');
                                                            });
                                                        }}
                                                    >🗑️</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <TablePagination
                            totalItems={serviceUsers.length}
                            currentPage={currentPage}
                            rowsPerPage={rowsPerPage}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={setRowsPerPage}
                        />
                    </>
                )}
            </div>

            {/* Service User Detail Modal */}
            {viewingUser && (() => {
                const allUserTx = transactions.filter(tx => tx.user_name === viewingUser.name || tx.user_name === viewingUser.phone);
                const userTx = filterMonth === 'all' ? allUserTx : allUserTx.filter(tx => {
                    const d = new Date(tx.created_at);
                    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    return ym === filterMonth;
                });
                return (
                    <div className="adm-modal-overlay" onClick={() => setViewingUser(null)}>
                        <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                            <div className="adm-modal-header">
                                <h3>👤 ข้อมูลผู้ใช้บริการ</h3>
                                <button onClick={() => setViewingUser(null)} className="adm-modal-close">✕</button>
                            </div>
                            <div className="adm-form" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>ชื่อ</div>
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{viewingUser.name}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>เบอร์โทร</div>
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{viewingUser.phone}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>ลงทะเบียนเมื่อ</div>
                                        <div style={{ fontSize: '13px' }}>{new Date(viewingUser.registered_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>เข้าใช้ล่าสุด</div>
                                        <div style={{ fontSize: '13px' }}>{viewingUser.last_login ? new Date(viewingUser.last_login).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '24px', fontWeight: 700, color: '#1e3a5f' }}>{viewingUser.total_withdrawals || 0}</span>
                                        <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '6px' }}>ครั้งที่เบิก</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label className="adm-form-label" style={{ marginBottom: 0 }}>📋 ประวัติการเบิก/เติม</label>
                                    <select className="adm-input" style={{ width: 'auto', fontSize: '13px', padding: '4px 8px' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                                        <option value="all">ทั้งหมด</option>
                                        {(() => {
                                            const months: string[] = [];
                                            for (let i = 0; i < 6; i++) {
                                                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                                const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                                months.push(val);
                                            }
                                            return months.map(m => {
                                                const [y, mo] = m.split('-');
                                                return <option key={m} value={m}>{thaiMonths[parseInt(mo)]} {parseInt(y) + 543}</option>;
                                            });
                                        })()}
                                    </select>
                                </div>
                                {userTx.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px' }}>ยังไม่มีประวัติการใช้งาน</div>
                                ) : (
                                    <div className="adm-table-wrap" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <table className="adm-table">
                                            <thead><tr><th>รายการ</th><th>ประเภท</th><th>จำนวน</th><th>วันที่</th></tr></thead>
                                            <tbody>
                                                {userTx.map(tx => (
                                                    <tr key={tx.id}>
                                                        <td>{tx.item_name}</td>
                                                        <td>
                                                            <span className={`adm-badge ${tx.type === 'WITHDRAW' ? 'adm-badge-orange' : 'adm-badge-green'}`}>
                                                                {tx.type === 'WITHDRAW' ? '📤 เบิก' : '📥 เติม'}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>{tx.amount}</td>
                                                        <td style={{ fontSize: '12px' }}>{formatDate(tx.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="adm-form-actions" style={{ marginTop: '16px' }}>
                                    {canDelete && <button
                                        onClick={() => {
                                            showConfirm(`ลบผู้ใช้ ${viewingUser.name} ออกจากระบบ?`, async () => {
                                                await deleteServiceUser(viewingUser.id);
                                                setServiceUsers(await getServiceUsers());
                                                setViewingUser(null);
                                                showToastMsg('🗑️ ลบผู้ใช้แล้ว');
                                            });
                                        }}
                                        className="adm-btn"
                                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                                    >🗑️ ลบผู้ใช้บริการ</button>}
                                    <div style={{ flex: 1 }} />
                                    <button onClick={() => setViewingUser(null)} className="adm-btn adm-btn-ghost">ปิด</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
            <ConfirmModal modal={confirmModal} onClose={closeConfirm} />
        </>
    );
}
