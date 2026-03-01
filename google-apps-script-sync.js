// ============================================
// JAUN BOOST — Google Sheets Auto-Sync
// ดึงข้อมูลจาก Supabase → เขียนลง Google Sheet อัตโนมัติ
// ============================================

// === ตั้งค่า Supabase ===
const SUPABASE_URL = 'https://ntjwilnydjabdcagcjvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50andpbG55ZGphYmRjYWdjanZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzAxNDMsImV4cCI6MjA4Nzk0NjE0M30.ETNc9qM9km63p6J5xb20biSKKyOemSCUjy888BYKQ1E';

// === Helper: ดึงข้อมูลจาก Supabase ===
function fetchSupabase(table) {
    const url = SUPABASE_URL + '/rest/v1/' + table + '?select=*';
    const options = {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
        },
        muteHttpExceptions: true,
    };
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
}

// === Sync Products ===
function syncProducts() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Products');
    if (!sheet) return;

    const data = fetchSupabase('products');
    if (!data || data.length === 0) return;

    // เคลียร์ข้อมูลเก่า (เก็บ header ไว้)
    if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }

    // เขียนข้อมูลใหม่
    const rows = data.map(p => [
        p.id || '',
        p.barcode || '',
        p.name || '',
        p.category || '',
        p.stock_quantity || 0,
        p.unit || 'ชิ้น',
        p.image_url || '',
        p.tracking_mode || 'quantity',
        p.usage_count || 0,
        p.status || 'available',
        p.cost_price || 0,
        p.source || '',
    ]);

    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
}

// === Sync Transactions ===
function syncTransactions() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Transactions');
    if (!sheet) return;

    const data = fetchSupabase('transactions');
    if (!data || data.length === 0) return;

    if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }

    const rows = data.map(t => [
        t.id || '',
        t.user_name || '',
        t.product_name || '',
        t.quantity || 0,
        t.unit || 'ชิ้น',
        t.type || '',
        t.created_at || '',
    ]);

    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
}

// === Sync Staff ===
function syncStaff() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Staff');
    if (!sheet) return;

    const data = fetchSupabase('staff');
    if (!data || data.length === 0) return;

    if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }

    const rows = data.map(s => [
        String(s.employee_id || ''),
        s.employee_name || '',
        s.role || 'viewer',
        s.password || '1234',
        s.allowed_tabs || '',
        typeof s.permissions === 'object' ? JSON.stringify(s.permissions) : (s.permissions || '{}'),
    ]);

    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
        // ตั้ง format เป็น text สำหรับ employee_id (เบอร์โทร) เพื่อรักษาเลข 0 นำหน้า
        sheet.getRange(2, 1, rows.length, 1).setNumberFormat('@');
    }
}

// === Sync Users ===
function syncUsers() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Users');
    if (!sheet) return;

    const data = fetchSupabase('service_users');
    if (!data || data.length === 0) return;

    if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }

    const rows = data.map(u => [
        u.id || '',
        String(u.phone || ''),
        u.name || '',
        u.registered_at || '',
        u.total_withdrawals || 0,
        u.last_login || '',
    ]);

    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
        // ตั้ง format เป็น text สำหรับเบอร์โทร เพื่อรักษาเลข 0 นำหน้า
        sheet.getRange(2, 2, rows.length, 1).setNumberFormat('@');
    }
}

// === Sync Expenses ===
function syncExpenses() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Expenses');
    if (!sheet) return;

    const data = fetchSupabase('expenses');
    if (!data || data.length === 0) return;

    if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }

    const rows = data.map(e => [
        e.id || '',
        e.date || '',
        e.product_name || '',
        e.product_id || '',
        e.quantity || 0,
        e.unit || 'ชิ้น',
        e.unit_cost || 0,
        e.total_cost || 0,
        e.note || '',
    ]);

    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
}

// ============================================
// ฟังก์ชันหลัก — Sync ทุกตาราง
// ============================================
function syncAllFromSupabase() {
    syncProducts();
    syncTransactions();
    syncStaff();
    syncUsers();
    syncExpenses();
    Logger.log('✅ Sync เสร็จแล้ว: ' + new Date().toLocaleString('th-TH'));
}

// ============================================
// ตั้ง Timer อัตโนมัติ (เรียกครั้งเดียว)
// ============================================
function setupAutoSync() {
    // ลบ trigger เก่าทั้งหมดก่อน
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
        if (trigger.getHandlerFunction() === 'syncAllFromSupabase') {
            ScriptApp.deleteTrigger(trigger);
        }
    }

    // ตั้ง trigger ใหม่ — ทำงานทุก 5 นาที
    ScriptApp.newTrigger('syncAllFromSupabase')
        .timeBased()
        .everyMinutes(5)
        .create();

    Logger.log('✅ ตั้ง Auto-Sync ทุก 5 นาทีเรียบร้อยแล้ว');
}

// ============================================
// เมนูใน Google Sheet
// ============================================
function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('🔄 JAUN BOOST')
        .addItem('Sync ตอนนี้เลย', 'syncAllFromSupabase')
        .addItem('ตั้ง Auto-Sync ทุก 5 นาที', 'setupAutoSync')
        .addToUi();
}
