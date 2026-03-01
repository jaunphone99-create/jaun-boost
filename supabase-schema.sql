-- ============================================
-- JAUN BOOST — Supabase Schema
-- ระบบสวัสดิการอาหาร (Smart Pantry)
-- ============================================

-- สินค้า
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  stock_quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'ชิ้น',
  image_url TEXT DEFAULT '',
  tracking_mode TEXT DEFAULT 'quantity',
  usage_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available',
  cost_price NUMERIC DEFAULT 0,
  source TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ธุรกรรม (เบิก/เติม)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL DEFAULT '',
  product_name TEXT NOT NULL DEFAULT '',
  quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'ชิ้น',
  type TEXT NOT NULL DEFAULT 'withdraw',
  photo TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- พนักงาน
CREATE TABLE IF NOT EXISTS staff (
  employee_id TEXT PRIMARY KEY,
  employee_name TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  password TEXT DEFAULT '1234',
  allowed_tabs TEXT DEFAULT '',
  permissions JSONB DEFAULT '{}'::jsonb
);

-- ผู้ใช้บริการ
CREATE TABLE IF NOT EXISTS service_users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  total_withdrawals INTEGER DEFAULT 0,
  last_login TIMESTAMPTZ
);

-- ค่าใช้จ่าย
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  product_name TEXT NOT NULL DEFAULT '',
  product_id TEXT DEFAULT '',
  quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'ชิ้น',
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  note TEXT DEFAULT ''
);

-- Default admin user
INSERT INTO staff (employee_id, employee_name, role, password, permissions)
VALUES ('admin', 'ผู้ดูแลระบบ', 'admin', '1234', '{}'::jsonb)
ON CONFLICT (employee_id) DO NOTHING;
