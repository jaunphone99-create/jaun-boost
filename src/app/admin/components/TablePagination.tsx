'use client';

import { useMemo } from 'react';

interface TablePaginationProps {
    totalItems: number;
    currentPage: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rows: number) => void;
    rowOptions?: number[];
}

export default function TablePagination({
    totalItems,
    currentPage,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    rowOptions = [10, 25, 50, 100],
}: TablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

    const pageNumbers = useMemo(() => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    }, [totalPages, currentPage]);

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endItem = Math.min(currentPage * rowsPerPage, totalItems);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
            fontSize: '13px',
            color: '#64748b',
            flexWrap: 'wrap',
            gap: '10px',
        }}>
            {/* Left: Rows per page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>แสดง</span>
                <select
                    value={rowsPerPage}
                    onChange={(e) => {
                        onRowsPerPageChange(Number(e.target.value));
                        onPageChange(1);
                    }}
                    style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '13px',
                        background: '#fff',
                        cursor: 'pointer',
                    }}
                >
                    {rowOptions.map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
                <span>รายการ</span>
                <span style={{ color: '#94a3b8' }}>({startItem}-{endItem} จาก {totalItems})</span>
            </div>

            {/* Right: Page numbers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        background: currentPage <= 1 ? '#f1f5f9' : '#fff',
                        color: currentPage <= 1 ? '#cbd5e1' : '#374151',
                        cursor: currentPage <= 1 ? 'default' : 'pointer',
                        fontSize: '13px',
                    }}
                >‹</button>

                {pageNumbers.map((p, i) =>
                    p === '...' ? (
                        <span key={`dot-${i}`} style={{ padding: '0 4px' }}>…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: p === currentPage ? 'none' : '1px solid #d1d5db',
                                background: p === currentPage ? '#1e3a5f' : '#fff',
                                color: p === currentPage ? '#fff' : '#374151',
                                fontWeight: p === currentPage ? 600 : 400,
                                cursor: 'pointer',
                                fontSize: '13px',
                                minWidth: '32px',
                            }}
                        >{p}</button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        background: currentPage >= totalPages ? '#f1f5f9' : '#fff',
                        color: currentPage >= totalPages ? '#cbd5e1' : '#374151',
                        cursor: currentPage >= totalPages ? 'default' : 'pointer',
                        fontSize: '13px',
                    }}
                >›</button>
            </div>
        </div>
    );
}

// Helper hook for pagination
export function usePagination<T>(items: T[], currentPage: number, rowsPerPage: number): T[] {
    return useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return items.slice(start, start + rowsPerPage);
    }, [items, currentPage, rowsPerPage]);
}
