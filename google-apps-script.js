/**
 * JAUN BOOST — Google Apps Script Backend
 * ระบบสวัสดิการอาหาร (Smart Pantry)
 * 
 * วิธีใช้:
 * 1. สร้าง Google Sheet ใหม่
 * 2. สร้าง Tab: Products, Transactions, Staff, Users, Expenses
 * 3. ใส่ Header Row ให้แต่ละ Tab (ดูด้านล่าง)
 * 4. เปิด Apps Script Editor (Extensions > Apps Script)
 * 5. Paste โค้ดนี้ทั้งหมด
 * 6. Deploy เป็น Web App (Execute as: Me, Who has access: Anyone)
 * 7. นำ URL ไปใส่ในหน้า ตั้งค่า ของระบบ
 * 
 * Headers สำหรับแต่ละ Tab:
 * Products:     รหัส | บาร์โค้ด | ชื่อสินค้า | หมวดหมู่ | จำนวนคงเหลือ | หน่วย | รูปภาพ | โหมดติดตาม | จำนวนการใช้ | สถานะ | ราคาต้นทุน | ที่มาสินค้า
 * Transactions: รหัส | ชื่อผู้ใช้ | ชื่อสินค้า | จำนวน | หน่วย | ประเภท | วันที่
 * Staff:        รหัสพนักงาน | ชื่อพนักงาน | ตำแหน่ง | รหัสผ่าน | แท็บที่อนุญาต | สิทธิ์การใช้งาน
 * Users:        รหัส | เบอร์โทร | ชื่อ | วันที่ลงทะเบียน | จำนวนการเบิก | เข้าสู่ระบบล่าสุด
 * Expenses:     รหัส | วันที่ | ชื่อสินค้า | รหัสสินค้า | จำนวน | หน่วย | ราคาต่อหน่วย | ราคารวม | หมายเหตุ
 */

var SS = SpreadsheetApp.getActiveSpreadsheet();

// ========================================
// HEADER MAPPINGS (ภาษาไทย ↔ English)
// Sheet ใช้ภาษาไทย แต่โค้ดภายในใช้ English key
// ========================================
var MAPS = {
    Products: [
        ['รหัส', 'id'], ['บาร์โค้ด', 'barcode'], ['ชื่อสินค้า', 'name'],
        ['หมวดหมู่', 'category'], ['จำนวนคงเหลือ', 'stock_quantity'], ['หน่วย', 'unit'],
        ['รูปภาพ', 'image_url'], ['โหมดติดตาม', 'tracking_mode'], ['จำนวนการใช้', 'usage_count'],
        ['สถานะ', 'status'], ['ราคาต้นทุน', 'cost_price'], ['ที่มาสินค้า', 'source']
    ],
    Transactions: [
        ['รหัส', 'id'], ['ชื่อผู้ใช้', 'user_name'], ['ชื่อสินค้า', 'product_name'],
        ['จำนวน', 'quantity'], ['หน่วย', 'unit'], ['ประเภท', 'type'], ['วันที่', 'created_at']
    ],
    Staff: [
        ['รหัสพนักงาน', 'employee_id'], ['ชื่อพนักงาน', 'employee_name'],
        ['ตำแหน่ง', 'role'], ['รหัสผ่าน', 'password'],
        ['แท็บที่อนุญาต', 'allowed_tabs'], ['สิทธิ์การใช้งาน', 'permissions']
    ],
    Users: [
        ['รหัส', 'id'], ['เบอร์โทร', 'phone'], ['ชื่อ', 'name'],
        ['วันที่ลงทะเบียน', 'registered_at'], ['จำนวนการเบิก', 'total_withdrawals'],
        ['เข้าสู่ระบบล่าสุด', 'last_login']
    ],
    Expenses: [
        ['รหัส', 'id'], ['วันที่', 'date'], ['ชื่อสินค้า', 'product_name'],
        ['รหัสสินค้า', 'product_id'], ['จำนวน', 'quantity'], ['หน่วย', 'unit'],
        ['ราคาต่อหน่วย', 'unit_cost'], ['ราคารวม', 'total_cost'], ['หมายเหตุ', 'note']
    ]
};

// Helper: สร้าง { englishKey: columnIndex } จาก header row ของ sheet
function getCols(sheetName, headers) {
    var mapping = MAPS[sheetName] || [];
    var thaiToEng = {};
    mapping.forEach(function (pair) { thaiToEng[pair[0]] = pair[1]; });
    var cols = {};
    headers.forEach(function (h, i) {
        var key = thaiToEng[h] || h;
        cols[key] = i;
    });
    return cols;
}

// Helper: แปลงเบอร์โทรให้มี 0 นำหน้าเสมอ (Google Sheets ตัด 0 ออกเพราะเก็บเป็นตัวเลข)
function normalizePhone(val) {
    var s = String(val || '');
    // เบอร์ไทย 9 หลัก (ขาด 0 นำหน้า) → เติม 0
    if (/^[1-9]\d{8}$/.test(s)) return '0' + s;
    return s;
}

// Helper: อ่านข้อมูลทั้ง sheet แล้วคืนเป็น array ของ object (English keys)
function readRows(sheetName) {
    var sheet = SS.getSheetByName(sheetName);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    var cols = getCols(sheetName, data[0]);
    return data.slice(1).map(function (row) {
        var obj = {};
        Object.keys(cols).forEach(function (key) { obj[key] = row[cols[key]]; });
        return obj;
    });
}

// ========================================
// ROUTER
// ========================================
function doGet(e) {
    var action = e.parameter.action;
    var result;

    try {
        switch (action) {
            // ===== Products =====
            case 'getProducts': result = getProducts(); break;
            case 'addProduct': result = addProduct(e.parameter); break;
            case 'updateProduct': result = updateProduct(e.parameter); break;
            case 'deleteProduct': result = deleteProduct(e.parameter); break;

            // ===== Transactions =====
            case 'withdraw': result = withdraw(e.parameter); break;
            case 'restock': result = restock(e.parameter); break;
            case 'getTransactions': result = getTransactions(e.parameter); break;
            case 'deleteTransaction': result = deleteTransaction(e.parameter); break;
            case 'clearTransactions': result = clearTransactions(); break;

            // ===== Staff =====
            case 'getStaff': result = getStaff(); break;
            case 'addStaff': result = addStaff(e.parameter); break;
            case 'updateStaff': result = updateStaff(e.parameter); break;
            case 'deleteStaff': result = deleteStaff(e.parameter); break;

            // ===== Users =====
            case 'getUsers': result = getUsers(); break;
            case 'registerUser': result = registerUser(e.parameter); break;
            case 'loginUser': result = loginUser(e.parameter); break;
            case 'deleteUser': result = deleteUser(e.parameter); break;
            case 'incrementUserWithdrawals': result = incrementUserWithdrawals(e.parameter); break;

            // ===== Expenses =====
            case 'getExpenses': result = getExpenses(); break;
            case 'addExpense': result = addExpense(e.parameter); break;
            case 'updateExpense': result = updateExpense(e.parameter); break;
            case 'deleteExpense': result = deleteExpense(e.parameter); break;

            default: result = { success: false, message: 'Unknown action: ' + action };
        }
    } catch (err) {
        result = { success: false, message: err.toString() };
    }

    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// PRODUCTS
// ========================================
function getProducts() {
    var data = readRows('Products');
    data.forEach(function (obj) {
        obj.stock_quantity = Number(obj.stock_quantity) || 0;
        obj.usage_count = Number(obj.usage_count) || 0;
        obj.cost_price = Number(obj.cost_price) || 0;
    });
    return { success: true, data: data };
}

function addProduct(p) {
    var sheet = SS.getSheetByName('Products');
    var id = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    // ใส่ตามลำดับ Header: รหัส | บาร์โค้ด | ชื่อสินค้า | หมวดหมู่ | จำนวนคงเหลือ | หน่วย | รูปภาพ | โหมดติดตาม | จำนวนการใช้ | สถานะ | ราคาต้นทุน | ที่มาสินค้า
    sheet.appendRow([
        id, p.barcode || '', p.name, p.category,
        Number(p.stock_quantity) || 0, p.unit || 'ชิ้น', p.image || '',
        p.tracking_mode || 'quantity', 0, 'available',
        Number(p.cost_price) || 0, p.source || ''
    ]);
    return { success: true, product: { id: id } };
}

function updateProduct(p) {
    var sheet = SS.getSheetByName('Products');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Products', data[0]);
    var numericFields = ['stock_quantity', 'usage_count', 'cost_price'];

    for (var i = 1; i < data.length; i++) {
        if (data[i][cols.id] === p.id) {
            Object.keys(cols).forEach(function (key) {
                if (key !== 'id' && p[key] !== undefined) {
                    var val = numericFields.indexOf(key) >= 0 ? Number(p[key]) : p[key];
                    sheet.getRange(i + 1, cols[key] + 1).setValue(val);
                }
            });
            return { success: true };
        }
    }
    return { success: false, message: 'Product not found' };
}

function deleteProduct(p) {
    var sheet = SS.getSheetByName('Products');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Products', data[0]);

    for (var i = 1; i < data.length; i++) {
        if (data[i][cols.id] === p.id) {
            sheet.deleteRow(i + 1);
            return { success: true };
        }
    }
    return { success: false, message: 'Product not found' };
}

// ========================================
// TRANSACTIONS
// ========================================
function withdraw(p) {
    var productsSheet = SS.getSheetByName('Products');
    var txSheet = SS.getSheetByName('Transactions');
    var products = productsSheet.getDataRange().getValues();
    var cols = getCols('Products', products[0]);

    var items = JSON.parse(p.items || '[]');
    var userName = p.userName || 'Unknown';

    for (var j = 0; j < items.length; j++) {
        var item = items[j];
        for (var i = 1; i < products.length; i++) {
            if (products[i][cols.id] === item.product_id) {
                var mode = products[i][cols.tracking_mode];
                if (mode === 'usage') {
                    var newCount = (Number(products[i][cols.usage_count]) || 0) + 1;
                    productsSheet.getRange(i + 1, cols.usage_count + 1).setValue(newCount);
                } else {
                    var newStock = Math.max(0, Number(products[i][cols.stock_quantity]) - (item.quantity || 1));
                    productsSheet.getRange(i + 1, cols.stock_quantity + 1).setValue(newStock);
                }
                // ใส่ตามลำดับ Header: รหัส | ชื่อผู้ใช้ | ชื่อสินค้า | จำนวน | หน่วย | ประเภท | วันที่
                txSheet.appendRow([
                    'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                    userName, products[i][cols.name], item.quantity || 1,
                    products[i][cols.unit], mode === 'usage' ? 'usage' : 'withdraw',
                    new Date().toISOString()
                ]);
                break;
            }
        }
    }
    return { success: true, message: 'เบิกสำเร็จ' };
}

function restock(p) {
    var sheet = SS.getSheetByName('Products');
    var txSheet = SS.getSheetByName('Transactions');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Products', data[0]);

    for (var i = 1; i < data.length; i++) {
        if (data[i][cols.id] === p.productId) {
            var newStock = Number(data[i][cols.stock_quantity]) + Number(p.amount || 0);
            sheet.getRange(i + 1, cols.stock_quantity + 1).setValue(newStock);
            // ใส่ตามลำดับ Header: รหัส | ชื่อผู้ใช้ | ชื่อสินค้า | จำนวน | หน่วย | ประเภท | วันที่
            txSheet.appendRow([
                'tx_' + Date.now(), p.userName || 'Admin',
                data[i][cols.name], Number(p.amount), data[i][cols.unit],
                'restock', new Date().toISOString()
            ]);
            return { success: true, message: 'เติมสต๊อกสำเร็จ' };
        }
    }
    return { success: false, message: 'Product not found' };
}

function getTransactions(p) {
    var limit = Number(p.limit) || 9999;
    var data = readRows('Transactions');
    data.forEach(function (obj) { obj.quantity = Number(obj.quantity) || 0; });
    data.reverse();
    return { success: true, data: data.slice(0, limit) };
}

function deleteTransaction(p) {
    var sheet = SS.getSheetByName('Transactions');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Transactions', data[0]);

    for (var i = 1; i < data.length; i++) {
        if (data[i][cols.id] === p.id) {
            sheet.deleteRow(i + 1);
            return { success: true };
        }
    }
    return { success: false };
}

function clearTransactions() {
    var sheet = SS.getSheetByName('Transactions');
    if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
    return { success: true };
}

// ========================================
// STAFF
// ========================================
function getStaff() {
    var data = readRows('Staff');
    data.forEach(function (obj) {
        obj.role = obj.role || 'viewer';
        obj.password = obj.password || '1234';
        obj.employee_id = normalizePhone(obj.employee_id);
    });
    return { success: true, data: data };
}

function addStaff(p) {
    var sheet = SS.getSheetByName('Staff');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Staff', data[0]);
    var inputId = normalizePhone(p.employee_id);

    for (var i = 1; i < data.length; i++) {
        if (normalizePhone(data[i][cols.employee_id]) === inputId) {
            return { success: false, message: 'ID ซ้ำ' };
        }
    }
    // ใส่ตามลำดับ Header: รหัสพนักงาน | ชื่อพนักงาน | ตำแหน่ง | รหัสผ่าน | แท็บที่อนุญาต | สิทธิ์การใช้งาน
    sheet.appendRow([inputId, p.employee_name, p.role || 'viewer', p.password || '1234', '', p.permissions || '']);
    // บังคับ format รหัสพนักงานเป็น Text
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, cols.employee_id + 1).setNumberFormat('@').setValue(inputId);
    return { success: true };
}

function updateStaff(p) {
    var sheet = SS.getSheetByName('Staff');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Staff', data[0]);
    var inputId = normalizePhone(p.employee_id);

    for (var i = 1; i < data.length; i++) {
        if (normalizePhone(data[i][cols.employee_id]) === inputId) {
            Object.keys(cols).forEach(function (key) {
                if (key !== 'employee_id' && p[key] !== undefined) {
                    sheet.getRange(i + 1, cols[key] + 1).setValue(p[key]);
                }
            });
            return { success: true };
        }
    }
    return { success: false };
}

function deleteStaff(p) {
    var sheet = SS.getSheetByName('Staff');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Staff', data[0]);
    var inputId = normalizePhone(p.employee_id);

    for (var i = 1; i < data.length; i++) {
        if (normalizePhone(data[i][cols.employee_id]) === inputId) {
            sheet.deleteRow(i + 1);
            return { success: true };
        }
    }
    return { success: false };
}

// ========================================
// SERVICE USERS
// ========================================
function getUsers() {
    var data = readRows('Users');
    data.forEach(function (obj) {
        obj.total_withdrawals = Number(obj.total_withdrawals) || 0;
        obj.phone = normalizePhone(obj.phone);
    });
    return { success: true, data: data };
}

function registerUser(p) {
    var sheet = SS.getSheetByName('Users');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Users', data[0]);
    var inputPhone = normalizePhone(p.phone);

    for (var i = 1; i < data.length; i++) {
        if (normalizePhone(data[i][cols.phone]) === inputPhone) {
            return { success: false, error: 'เบอร์โทรนี้ลงทะเบียนแล้ว' };
        }
    }
    var id = 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    var now = new Date().toISOString();
    // ใส่ตามลำดับ Header: รหัส | เบอร์โทร | ชื่อ | วันที่ลงทะเบียน | จำนวนการเบิก | เข้าสู่ระบบล่าสุด
    sheet.appendRow([id, inputPhone, p.name, now, 0, '']);
    // บังคับ format เบอร์โทรเป็น Text เพื่อไม่ให้ Google Sheets ตัด 0 นำหน้า
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, cols.phone + 1).setNumberFormat('@').setValue(inputPhone);
    return { success: true, user: { id: id, phone: inputPhone, name: p.name, registered_at: now, total_withdrawals: 0 } };
}

function loginUser(p) {
    var sheet = SS.getSheetByName('Users');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Users', data[0]);
    var inputPhone = normalizePhone(p.phone);

    for (var i = 1; i < data.length; i++) {
        if (normalizePhone(data[i][cols.phone]) === inputPhone) {
            var now = new Date().toISOString();
            if (cols.last_login >= 0) sheet.getRange(i + 1, cols.last_login + 1).setValue(now);
            var user = {};
            Object.keys(cols).forEach(function (key) { user[key] = data[i][cols[key]]; });
            user.phone = inputPhone;
            user.last_login = now;
            return { success: true, user: user };
        }
    }
    return { success: false, error: 'ไม่พบเบอร์โทรนี้ในระบบ' };
}

function deleteUser(p) {
    var sheet = SS.getSheetByName('Users');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Users', data[0]);

    for (var i = 1; i < data.length; i++) {
        if (data[i][cols.id] === p.id) {
            sheet.deleteRow(i + 1);
            return { success: true };
        }
    }
    return { success: false };
}

function incrementUserWithdrawals(p) {
    var sheet = SS.getSheetByName('Users');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Users', data[0]);
    var inputPhone = normalizePhone(p.phone);

    for (var i = 1; i < data.length; i++) {
        if (normalizePhone(data[i][cols.phone]) === inputPhone) {
            var newCount = (Number(data[i][cols.total_withdrawals]) || 0) + 1;
            sheet.getRange(i + 1, cols.total_withdrawals + 1).setValue(newCount);
            return { success: true };
        }
    }
    return { success: false };
}

// ========================================
// EXPENSES
// ========================================
function getExpenses() {
    var data = readRows('Expenses');
    data.forEach(function (obj) {
        obj.quantity = Number(obj.quantity) || 0;
        obj.unit_cost = Number(obj.unit_cost) || 0;
        obj.total_cost = Number(obj.total_cost) || 0;
    });
    data.reverse();
    return { success: true, data: data };
}

function addExpense(p) {
    var sheet = SS.getSheetByName('Expenses');
    // ใส่ตามลำดับ Header: รหัส | วันที่ | ชื่อสินค้า | รหัสสินค้า | จำนวน | หน่วย | ราคาต่อหน่วย | ราคารวม | หมายเหตุ
    sheet.appendRow([
        p.id || 'exp_' + Date.now(),
        p.date, p.product_name, p.product_id,
        Number(p.quantity) || 0, p.unit || 'ชิ้น',
        Number(p.unit_cost) || 0, Number(p.total_cost) || 0,
        p.note || ''
    ]);
    return { success: true };
}

function updateExpense(p) {
    var sheet = SS.getSheetByName('Expenses');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Expenses', data[0]);
    var numericFields = ['quantity', 'unit_cost', 'total_cost'];

    for (var i = 1; i < data.length; i++) {
        if (data[i][cols.id] === p.id) {
            Object.keys(cols).forEach(function (key) {
                if (key !== 'id' && p[key] !== undefined) {
                    var val = numericFields.indexOf(key) >= 0 ? Number(p[key]) : p[key];
                    sheet.getRange(i + 1, cols[key] + 1).setValue(val);
                }
            });
            return { success: true };
        }
    }
    return { success: false, message: 'Expense not found' };
}

function deleteExpense(p) {
    var sheet = SS.getSheetByName('Expenses');
    var data = sheet.getDataRange().getValues();
    var cols = getCols('Expenses', data[0]);

    for (var i = 1; i < data.length; i++) {
        if (data[i][cols.id] === p.id) {
            sheet.deleteRow(i + 1);
            return { success: true };
        }
    }
    return { success: false, message: 'Expense not found' };
}
