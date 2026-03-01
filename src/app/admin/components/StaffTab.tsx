'use client';

import { useState } from 'react';
import { StaffPermissions } from '@/lib/types';
import { getStaff, addStaff, updateStaff, deleteStaff, type Staff, type StaffRole } from '@/lib/sheets-api';
import { getDefaultPermissions } from '@/lib/permissions';
import TablePagination, { usePagination } from './TablePagination';
import PermissionsEditor from './PermissionsEditor';
import ConfirmModal, { useConfirmModal } from './ConfirmModal';

interface StaffTabProps {
    staffList: Staff[];
    setStaffList: (s: Staff[]) => void;
    adminRole: string;
    canEdit: boolean;
    canDelete: boolean;
    showToastMsg: (msg: string) => void;
}

export default function StaffTab({ staffList, setStaffList, adminRole, canEdit, canDelete, showToastMsg }: StaffTabProps) {
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [staffId, setStaffId] = useState('');
    const [staffName, setStaffName] = useState('');
    const [staffRole, setStaffRole] = useState<StaffRole>('viewer');
    const [staffPassword, setStaffPassword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const paginatedStaff = usePagination(staffList, currentPage, rowsPerPage);
    const [staffPermissions, setStaffPermissions] = useState<StaffPermissions>(getDefaultPermissions('viewer'));
    const { confirmModal, showConfirm, closeConfirm } = useConfirmModal();

    function closeStaffForm() {
        setShowStaffForm(false); setEditingStaff(null);
        setStaffId(''); setStaffName(''); setStaffRole('viewer'); setStaffPassword('');
        setStaffPermissions(getDefaultPermissions('viewer'));
    }

    function openEditStaff(s: Staff) {
        setEditingStaff(s); setStaffId(s.employee_id); setStaffName(s.employee_name);
        setStaffRole(s.role); setStaffPassword('');
        setStaffPermissions(s.permissions || getDefaultPermissions(s.role));
        setShowStaffForm(true);
    }

    async function handleAddStaff() {
        if (!staffId.trim() || !staffName.trim()) { showToastMsg('⚠️ กรุณากรอกเบอร์โทรและชื่อพนักงาน'); return; }
        if (editingStaff) {
            await updateStaff(editingStaff.employee_id, {
                employee_name: staffName.trim(), role: staffRole,
                password: staffPassword.trim() || editingStaff.password || '1234',
                permissions: staffPermissions,
            });
            setStaffList(await getStaff()); closeStaffForm(); showToastMsg('✅ บันทึกแล้ว');
            return;
        }
        const result = await addStaff({ employee_id: staffId.trim(), employee_name: staffName.trim(), role: staffRole, password: staffPassword.trim() || '1234', permissions: staffPermissions });
        if (!result.success) { showToastMsg('⚠️ เบอร์โทรซ้ำ'); return; }
        setStaffList(await getStaff()); closeStaffForm(); showToastMsg('✅ เพิ่มพนักงานเรียบร้อย');
    }

    function handleDeleteStaff(id: string) {
        showConfirm('ต้องการลบพนักงานนี้ใช่ไหม?', async () => {
            await deleteStaff(id); setStaffList(await getStaff()); showToastMsg('🗑️ ลบพนักงานแล้ว');
        });
    }

    // Summary of permissions for display in table
    function getPermSummary(s: Staff): string {
        const perms = s.permissions || getDefaultPermissions(s.role);
        const pageCount = Object.keys(perms).filter(k => perms[k]?.includes('view')).length;
        return `${pageCount} หน้า`;
    }

    return (
        <>
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">พนักงานหลังบ้าน</h1>
                    <p className="adm-page-subtitle">แอดมินระบบ {staffList.length} คน</p>
                </div>
                {canEdit && <button onClick={() => setShowStaffForm(true)} className="adm-btn adm-btn-primary">＋ เพิ่มพนักงาน</button>}
            </div>

            <div className="adm-card">
                {staffList.length > 0 ? (
                    <>
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead><tr><th>เบอร์โทร</th><th>ชื่อพนักงาน</th><th>สิทธิ์</th><th>จัดการ</th></tr></thead>
                                <tbody>
                                    {paginatedStaff.map((s, i) => (
                                        <tr key={s.employee_id} className={i % 2 === 0 ? '' : 'adm-row-alt'}>
                                            <td className="adm-td-barcode">{s.employee_id}</td>
                                            <td className="adm-td-name">{s.employee_name}</td>
                                            <td>
                                                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                                                    🔐 {getPermSummary(s)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="adm-action-btns">
                                                    {canEdit && <button onClick={() => openEditStaff(s)} className="adm-icon-btn edit" title="แก้ไข">✏️</button>}
                                                    {canDelete && <button onClick={() => handleDeleteStaff(s.employee_id)} className="adm-icon-btn delete" title="ลบ">🗑️</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <TablePagination
                            totalItems={staffList.length}
                            currentPage={currentPage}
                            rowsPerPage={rowsPerPage}
                            onPageChange={setCurrentPage}
                            onRowsPerPageChange={setRowsPerPage}
                        />
                    </>
                ) : (
                    <div className="adm-empty-small">👥 ยังไม่มีรายชื่อพนักงาน</div>
                )}
            </div>

            {/* Staff Form Modal */}
            {showStaffForm && (
                <div className="adm-modal-overlay" onClick={() => closeStaffForm()}>
                    <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="adm-modal-header">
                            <h3>{editingStaff ? '✏️ แก้ไขพนักงาน' : '＋ เพิ่มพนักงาน'}</h3>
                            <button onClick={() => closeStaffForm()} className="adm-modal-close">✕</button>
                        </div>
                        <div className="adm-form">
                            <label className="adm-form-label">เบอร์โทร *</label>
                            <input type="tel" className="adm-input" placeholder="เช่น 0812345678" value={staffId} onChange={(e) => setStaffId(e.target.value)} inputMode="numeric" disabled={!!editingStaff} style={editingStaff ? { opacity: 0.6, cursor: 'not-allowed' } : {}} />
                            <label className="adm-form-label">ชื่อพนักงาน *</label>
                            <input type="text" className="adm-input" placeholder="เช่น สมชาย ใจดี" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
                            <label className="adm-form-label">รหัสผ่าน</label>
                            <input type="text" className="adm-input" placeholder={editingStaff ? 'เว้นว่าง = ไม่เปลี่ยน' : 'ค่าเริ่มต้น: 1234'} value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} />

                            <label className="adm-form-label" style={{ marginTop: '8px' }}>🔐 สิทธิ์การเข้าถึง</label>
                            <PermissionsEditor permissions={staffPermissions} onChange={setStaffPermissions} />

                            <div className="adm-form-actions">
                                {editingStaff && canDelete && (
                                    <button onClick={() => { handleDeleteStaff(editingStaff.employee_id); closeStaffForm(); }}
                                        className="adm-btn" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>🗑️ ลบพนักงาน</button>
                                )}
                                <div style={{ flex: 1 }} />
                                <button onClick={() => closeStaffForm()} className="adm-btn adm-btn-ghost">ยกเลิก</button>
                                <button onClick={handleAddStaff} className="adm-btn adm-btn-primary">
                                    {editingStaff ? '💾 บันทึก' : '＋ เพิ่มพนักงาน'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal modal={confirmModal} onClose={closeConfirm} />
        </>
    );
}
