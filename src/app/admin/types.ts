import { Product, Transaction } from '@/lib/types';
import { type Staff, type StaffRole, type ServiceUser } from '@/lib/types';

export type Tab = 'dashboard' | 'products' | 'expenses' | 'transactions' | 'users' | 'staff' | 'settings';
export type ProductCategory = string;

export const DEFAULT_CATEGORIES = ['อาหาร', 'ของสด', 'ขนม', 'เครื่องดื่ม', 'ผลไม้', 'ของใช้'];
export const CATEGORY_EMOJI: Record<string, string> = {
    'อาหาร': '🍽️', 'ของสด': '🥬', 'ขนม': '🍰', 'เครื่องดื่ม': '🥤', 'ผลไม้': '🍎', 'ของใช้': '📦',
};
export const CUSTOM_CATEGORIES_KEY = 'smart_pantry_custom_categories';

export type RuleSection = {
    id: string;
    icon: string;
    title: string;
    color: 'blue' | 'orange' | 'green' | 'purple' | 'red';
    items: string[];
};

export const DEFAULT_RULES: RuleSection[] = [
    {
        id: 'time', icon: '🕐', title: 'เวลาและขอบเขตการใช้บริการ', color: 'blue',
        items: [
            'อนุญาตให้ใช้บริการเฉพาะช่วงเวลาพัก และหลังเลิกงานไม่เกิน 21.00 น.',
            'ห้ามใช้บริการในเวลาปฏิบัติงานทุกกรณี (ยกเว้นน้ำดื่มและกาแฟ)',
            'ห้ามนำอาหาร ขนม หรือของว่างออกนอกพื้นที่ห้องเด็ดขาด',
        ],
    },
    {
        id: 'withdraw', icon: '📝', title: 'การเบิกอาหาร (ระบบเกียรติศักดิ์)', color: 'orange',
        items: [
            'ต้องบันทึกรายการ/จำนวนที่เบิกผ่านระบบทุกครั้งก่อนรับประทาน',
            'ข้าวและกับข้าว เบิกได้ 1 ชุด/วัน/ท่าน',
            'ขนมและของว่างหยิบได้ตามความเหมาะสม และต้องรับประทานให้หมด',
            'การบันทึกข้อมูลไม่ตรงความจริง ถือเป็นการฝ่าฝืนระเบียบวินัย',
        ],
    },
    {
        id: 'clean', icon: '🧹', title: 'ความสะอาดและการตรวจสอบ', color: 'green',
        items: [
            'หลังรับประทานต้องจัดเก็บภาชนะและทิ้งขยะให้ถูกต้องตามจุดที่กำหนด',
            'ห้ามทิ้งเศษอาหารหรือสิ่งใดลงในอ่างล้างจาน',
            'บริษัทฯ จะตรวจสอบสต็อกและเบิกจ่ายรอบรายไตรมาส หากพบความไม่สอดคล้องอาจระงับสิทธิ',
        ],
    },
];

export const RULES_STORAGE_KEY = 'smart_pantry_rules';
export const RULE_COLORS: RuleSection['color'][] = ['blue', 'orange', 'green', 'purple', 'red'];

export const DEFAULT_PRODUCT_IMG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIHJ4PSIxNiIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjQwIiB5PSI0OCIgZm9udC1zaXplPSIzMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+TpjwvdGV4dD48L3N2Zz4=';

// Shared props that all tabs need
export interface AdminTabProps {
    products: Product[];
    setProducts: (p: Product[]) => void;
    transactions: Transaction[];
    setTransactions: (t: Transaction[]) => void;
    staffList: Staff[];
    setStaffList: (s: Staff[]) => void;
    serviceUsers: ServiceUser[];
    setServiceUsers: (u: ServiceUser[]) => void;
    adminRole: StaffRole;
    canAdd: boolean;
    canDelete: boolean;
    showToastMsg: (msg: string) => void;
    formatDate: (dateStr: string) => string;
}
