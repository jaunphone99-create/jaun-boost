'use client';

import { getProducts, getAllTransactions } from './products-api';
import { getStaff } from './staff-api';
import { getServiceUsers } from './users-api';
import { getExpenses } from './expenses-api';

function downloadCSV(filename: string, csvContent: string) {
    const BOM = '\uFEFF'; // UTF-8 BOM for Thai characters in Excel
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function escapeCSV(val: unknown): string {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

export async function exportProductsCSV() {
    const products = await getProducts();
    const header = 'รหัส,บาร์โค้ด,ชื่อสินค้า,หมวดหมู่,จำนวนคงเหลือ,หน่วย,รูปภาพ,โหมดติดตาม,จำนวนการใช้,สถานะ,ราคาต้นทุน,ที่มาสินค้า';
    const rows = products.map(p =>
        [p.id, p.barcode, p.name, p.category, p.stock_quantity, p.unit, p.image_url, p.tracking_mode, p.usage_count || 0, p.status || 'available', p.cost_price || 0, p.source || ''].map(escapeCSV).join(',')
    );
    downloadCSV('products.csv', [header, ...rows].join('\n'));
}

export async function exportTransactionsCSV() {
    const txns = await getAllTransactions();
    const header = 'รหัส,ชื่อผู้ใช้,ชื่อสินค้า,จำนวน,หน่วย,ประเภท,วันที่';
    const rows = txns.map(t =>
        [t.id, t.user_name, t.item_name || t.product_id, t.amount, 'ชิ้น', t.type, t.created_at].map(escapeCSV).join(',')
    );
    downloadCSV('transactions.csv', [header, ...rows].join('\n'));
}

export async function exportStaffCSV() {
    const staff = await getStaff();
    const header = 'รหัสพนักงาน,ชื่อพนักงาน,ตำแหน่ง,รหัสผ่าน';
    const rows = staff.map(s =>
        [s.employee_id, s.employee_name, s.role, s.password || '1234'].map(escapeCSV).join(',')
    );
    downloadCSV('staff.csv', [header, ...rows].join('\n'));
}

export async function exportUsersCSV() {
    const users = await getServiceUsers();
    const header = 'รหัส,เบอร์โทร,ชื่อ,วันที่ลงทะเบียน,จำนวนการเบิก,เข้าสู่ระบบล่าสุด';
    const rows = users.map(u =>
        [u.id, u.phone, u.name, u.registered_at, u.total_withdrawals, u.last_login || ''].map(escapeCSV).join(',')
    );
    downloadCSV('users.csv', [header, ...rows].join('\n'));
}

export async function exportExpensesCSV() {
    const expenses = await getExpenses();
    const header = 'รหัส,วันที่,ชื่อสินค้า,รหัสสินค้า,จำนวน,หน่วย,ราคาต่อหน่วย,ราคารวม,หมายเหตุ';
    const rows = expenses.map(e =>
        [e.id, e.date, e.product_name, e.product_id, e.quantity, e.unit, e.unit_cost, e.total_cost, e.note || ''].map(escapeCSV).join(',')
    );
    downloadCSV('expenses.csv', [header, ...rows].join('\n'));
}

export async function exportAllCSV() {
    await exportProductsCSV();
    await exportTransactionsCSV();
    await exportStaffCSV();
    await exportUsersCSV();
    await exportExpensesCSV();
}
