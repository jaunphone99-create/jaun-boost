'use client';

import { useState, useCallback } from 'react';

interface ConfirmModalState {
    message: string;
    onConfirm: () => void;
}

/** Hook to replace native confirm() with a React modal */
export function useConfirmModal() {
    const [modal, setModal] = useState<ConfirmModalState | null>(null);

    const showConfirm = useCallback((message: string, onConfirm: () => void) => {
        setModal({ message, onConfirm });
    }, []);

    const closeConfirm = useCallback(() => {
        setModal(null);
    }, []);

    return { confirmModal: modal, showConfirm, closeConfirm };
}

/** Shared confirm modal UI component */
export default function ConfirmModal({ modal, onClose }: { modal: ConfirmModalState | null; onClose: () => void }) {
    if (!modal) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000,
        }} onClick={onClose}>
            <div style={{
                background: '#fff', borderRadius: '16px', padding: '28px 32px', maxWidth: '380px', width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center',
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '24px', lineHeight: 1.5 }}>
                    {modal.message}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '12px 20px', borderRadius: '10px', border: '1px solid #e2e8f0',
                            background: '#f8fafc', color: '#64748b', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={() => { modal.onConfirm(); onClose(); }}
                        style={{
                            flex: 1, padding: '12px 20px', borderRadius: '10px', border: 'none',
                            background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
    );
}
