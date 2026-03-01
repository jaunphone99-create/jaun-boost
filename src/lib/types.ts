// ===== Data Types =====

export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  category: string;
  stock_quantity: number;
  unit: string;
  image_url: string; // emoji or URL
  tracking_mode: 'quantity' | 'usage'; // quantity=นับจำนวน, usage=นับครั้ง
  usage_count?: number; // จำนวนครั้งที่ใช้ (เฉพาะ usage mode)
  status?: 'available' | 'empty'; // สถานะ (เฉพาะ usage mode)
  cost_price?: number; // ราคาต้นทุนต่อหน่วย (บาท)
  source?: string; // ที่มาของสินค้า เช่น แม็คโคร, โลตัส
}

export interface Expense {
  id: string;
  date: string; // ISO date string
  product_name: string;
  product_id: string;
  quantity: number;
  unit: string;
  unit_cost: number; // ราคาต่อหน่วย
  total_cost: number; // ราคารวม
  note?: string;
}

export interface Transaction {
  id: string;
  product_id: string;
  item_name: string;
  user_name: string;
  type: 'WITHDRAW' | 'RESTOCK';
  amount: number;
  created_at: string;
  photo?: string; // evidence photo (base64)
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// ===== Staff Types =====

export type StaffRole = 'viewer' | 'editor' | 'admin';
export type PermissionAction = 'view' | 'edit' | 'delete';
export type StaffPermissions = Record<string, PermissionAction[]>;

export interface Staff {
  employee_id: string;
  employee_name: string;
  role: StaffRole;
  password?: string;
  allowed_tabs?: string[];
  permissions?: StaffPermissions;
}

// ===== Service User Types =====

export interface ServiceUser {
  id: string;
  phone: string;
  name: string;
  registered_at: string;
  last_login?: string;
  total_withdrawals: number;
}
