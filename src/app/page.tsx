'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Product, Transaction } from '@/lib/types';
import {
  getProducts, getTransactions, getTodayUserCount, isDemo,
  loginServiceUser, getCurrentUser, logoutUser, getServiceUsers,
  updateProduct, registerServiceUser, incrementUserWithdrawals,
  withdrawProducts,
} from '@/lib/sheets-api';
import {
  ShoppingBag,
  Plus,
  Minus,
  Package,
  History,
  Settings,
  AlertCircle,
  CheckCircle2,
  X,
  PlusCircle,
  BarChart3,
  User,
  ShieldCheck,
  Search,
  Clock,
  Trash2,
  Coffee,
  Info,
  ChevronRight,
  Camera,
  ImageIcon,
  Phone,
  UserPlus,
  ClipboardCheck,
} from 'lucide-react';
import { RuleSection, DEFAULT_RULES, RULES_STORAGE_KEY } from './admin/types';

// Load welfare rules from localStorage (synced with admin settings)
function loadWelfareRules(): RuleSection[] {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(RULES_STORAGE_KEY) : null;
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  } catch { return DEFAULT_RULES; }
}

export default function HomePage() {
  // Auth
  const [currentUser, setCurrentUser] = useState<{ phone: string; name: string } | null>(null);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Registration
  const [showRegister, setShowRegister] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [myTransactions, setMyTransactions] = useState<Transaction[]>([]);
  const [orderHistory, setOrderHistory] = useState<Array<{ id: number; date: string; photo?: string; items: Array<Product & { qty: number }> }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [motivationalMsg, setMotivationalMsg] = useState<string | null>(null);

  const motivationalMessages = [
    '🌟 ขอให้มื้อนี้อร่อยและมีความสุขนะครับ!',
    '💪 เติมพลังเต็มที่ ทำงานแบบสุดๆ!',
    '😊 ยิ้มสดใส วันนี้จะเป็นวันที่ดี!',
    '🎉 อาหารอร่อยๆ เพิ่มพลังให้วันนี้!',
    '✨ คุณทำงานเก่งมาก สมควรได้พักทานอาหาร!',
    '🌈 หลังจากทานเสร็จ ลุยงานต่อได้เลย!',
    '🍀 โชคดีตลอดวัน มีแต่สิ่งดีๆ!',
    '💛 ขอบคุณที่เป็นส่วนหนึ่งของทีมเรา!',
    '🔥 เติมพลัง เติมแรงบันดาลใจ!',
    '🌻 วันนี้สดใสเหมือนคุณ!',
    '🏆 คุณคือคนสำคัญของทีม!',
    '💎 ทุกวันคือโอกาสใหม่ ทำให้ดีที่สุด!',
    '🎯 ตั้งใจทำงาน ผลดีจะตามมา!',
    '⭐ คุณคือดาวเด่นของทีมเรา!',
    '🌺 มีความสุขกับทุกมื้ออาหาร!',
    '🍽️ กินให้อิ่ม พร้อมลุยงาน!',
    '🎊 วันนี้เป็นวันที่วิเศษ!',
    '💐 ขอให้สุขภาพแข็งแรง!',
    '🌞 แสงแดดส่องทางให้คุณ!',
    '🤝 เราทำงานร่วมกันอย่างดี!',
    '🚀 พร้อมลุยงานต่อหลังทานอิ่ม!',
    '💫 ความสำเร็จอยู่แค่ปลายนิ้ว!',
    '🌸 ขอให้วันนี้เต็มไปด้วยรอยยิ้ม!',
    '🎶 ชีวิตดี มีอาหารอร่อย!',
    '🏅 ขอบคุณที่ตั้งใจทำงาน!',
    '💝 ส่งกำลังใจให้ทุกคน!',
    '🌿 พักทานอาหาร ผ่อนคลายสักครู่!',
    '⚡ เติมพลังเต็มแม็กซ์!',
    '🎈 เก่งมากๆ ภูมิใจในตัวคุณ!',
    '🌊 ปล่อยวาง ทานอาหารให้สบายใจ!',
    '🔆 คุณทำให้ที่ทำงานสดใสขึ้น!',
    '🎁 อาหารดีๆ คือของขวัญจากเรา!',
    '💚 รักษาสุขภาพด้วยนะ!',
    '🌟 ยิ่งทาน ยิ่งมีพลัง!',
    '🤗 อบอุ่นเสมอกับครอบครัวเกียรติศักดิ์!',
    '🍜 มื้อนี้ทานให้อร่อย!',
    '🏠 ที่นี่คือบ้านหลังที่สอง!',
    '🌤️ วันใหม่ โอกาสใหม่!',
    '💪 สุขภาพดี มาจากอาหารดี!',
    '🎯 มุ่งมั่น ตั้งใจ สำเร็จแน่นอน!',
    '🌷 ดอกไม้ยังต้องน้ำ คุณก็ต้องอาหาร!',
    '😄 ทานให้อิ่มท้อง อิ่มใจ!',
    '✅ เบิกเรียบร้อย พร้อมลุย!',
    '🌍 วันนี้จะดีกว่าเมื่อวาน!',
    '🎵 ทานไป ฟังเพลงไป มีความสุข!',
    '🧡 ดูแลตัวเองด้วยนะ!',
    '🌱 เติบโตทุกวัน ทั้งงานทั้งใจ!',
    '🤩 คุณคือคนพิเศษ!',
    '🦋 อิสระ สบาย ทานให้อร่อย!',
    '💯 100 คะแนนเต็มสำหรับวันนี้!',
  ];
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const rulesScrollRef = useRef<HTMLDivElement>(null);
  const checkoutLockRef = useRef(false); // Synchronous lock to prevent double-tap
  const [hasScrolledRules, setHasScrolledRules] = useState(false);
  const [welfareRules, setWelfareRules] = useState<RuleSection[]>(loadWelfareRules);

  // Sync rules from localStorage (when admin edits in another tab or same tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === RULES_STORAGE_KEY) {
        setWelfareRules(loadWelfareRules());
      }
    };
    window.addEventListener('storage', handleStorage);
    // Also poll every 5 seconds for same-tab changes
    const interval = setInterval(() => {
      setWelfareRules(loadWelfareRules());
    }, 5000);
    return () => { window.removeEventListener('storage', handleStorage); clearInterval(interval); };
  }, []);

  const totalStock = useMemo(() => products.reduce((acc, curr) => acc + curr.stock_quantity, 0), [products]);

  useEffect(() => {
    const session = getCurrentUser();
    if (session && session.phone) {
      // Verify user still exists in database
      getServiceUsers().then(users => {
        const stillExists = users.some(u => u.phone === session.phone);
        if (stillExists) {
          const restoredUser = { phone: session.phone!, name: session.name || '' };
          setCurrentUser(restoredUser);
          loadData(restoredUser);
        } else {
          // User was deleted from admin, clear session
          logoutUser();
          setCurrentUser(null);
          setLoading(false);
        }
      }).catch(() => {
        // Fallback: restore session anyway if can't verify
        const restoredUser = { phone: session.phone!, name: session.name || '' };
        setCurrentUser(restoredUser);
        loadData(restoredUser);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Sync products when admin updates in another tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pantry_products') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  async function loadData(user?: { phone: string; name: string }) {
    const activeUser = user || currentUser;
    try {
      const [prods, txns] = await Promise.all([getProducts(), getTransactions(100)]);
      setProducts(prods);
      // Filter transactions for current user
      if (activeUser) {
        const userTx = txns.filter(t => t.user_name === activeUser.name || t.user_name === activeUser.phone);
        setMyTransactions(userTx);
        // Build orderHistory from transactions for display
        const history = userTx
          .filter(t => t.type === 'WITHDRAW')
          .map(t => ({
            id: parseInt(t.id.replace(/\D/g, '').slice(0, 13)) || Date.now(),
            date: new Date(t.created_at).toLocaleString('th-TH'),
            items: [{ ...prods.find(p => p.id === t.product_id || p.name === t.item_name) as Product, qty: t.amount }].filter(i => i.name),
            photo: t.photo,
          }));
        setOrderHistory(history);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoginError('');
    if (!loginId.trim()) {
      setLoginError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    setLoginLoading(true);
    const result = await loginServiceUser(loginId.trim());
    setLoginLoading(false);
    if (result.success && result.user) {
      const loggedUser = {
        phone: result.user.phone,
        name: result.user.name,
      };
      setCurrentUser(loggedUser);
      setLoading(true);
      loadData(loggedUser);
    } else {
      setLoginError(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  }

  function handleLogout() {
    logoutUser();
    setCurrentUser(null);
    setLoginId('');
    setLoginPassword('');
    setShowRegister(false);
    setLoginError('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin();
  }

  const showNotice = (msg: string, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (product: Product) => {
    // Time-based restriction
    const hour = new Date().getHours();
    if (hour >= 20 && !['ขนม', 'เครื่องดื่ม', 'ผลไม้'].includes(product.category)) {
      showNotice('🌙 ช่วง 20.00-21.00 น. เบิกได้เฉพาะขนม เครื่องดื่ม และผลไม้', 'error');
      return;
    }
    if (product.stock_quantity <= (cart[product.id] || 0)) {
      showNotice('สินค้าในสต็อกไม่พอ', 'error');
      return;
    }
    setCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const handleCheckoutRequest = () => {
    if (Object.keys(cart).length === 0) return;
    setIsAgreed(false);
    setHasScrolledRules(false);
    setShowRulesModal(true);
  };

  const confirmCheckout = async () => {
    if (!isAgreed || checkoutLoading) return;
    // Synchronous ref lock — prevents double-tap on mobile
    if (checkoutLockRef.current) return;
    checkoutLockRef.current = true;
    setCheckoutLoading(true);

    try {
      // Withdraw products (decreases stock + creates transaction records)
      const cartItems = Object.entries(cart).map(([id, qty]) => ({
        product: products.find((p) => p.id === id)!,
        quantity: qty,
      })).filter(item => item.product);
      await withdrawProducts(currentUser?.name || 'Unknown', cartItems, evidencePhoto);

      setCart({});
      setShowRulesModal(false);
      setEvidencePhoto(null);
      showNotice('เบิกอาหารสำเร็จ!');
      // Show motivational popup
      const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMotivationalMsg(randomMsg);
      // Increment user withdrawal count
      if (currentUser?.phone) {
        await incrementUserWithdrawals(currentUser.phone);
      }
      // Refresh products + transactions
      await loadData();
    } catch (err) {
      console.error('Checkout error:', err);
      showNotice('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setCheckoutLoading(false);
      checkoutLockRef.current = false;
    }
  };

  const updateStock = async (id: string, amount: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    await updateProduct(id, { stock_quantity: Math.max(0, product.stock_quantity + amount) });
    const prods = await getProducts();
    setProducts(prods);
    showNotice('อัปเดตสต็อกเรียบร้อย');
  };

  // Time-based restriction: อาหาร/อาหารสด only available 11:00-20:00, other categories available anytime
  const currentHour = new Date().getHours();
  const isWithinServiceHours = currentHour >= 11 && currentHour < 20;
  const isOutsideServiceHours = !isWithinServiceHours;
  const RESTRICTED_CATEGORIES = ['อาหาร', 'อาหารสด'];

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchSearch) return false;
    if (isOutsideServiceHours && RESTRICTED_CATEGORIES.includes(p.category)) return false;
    if (selectedCategory !== 'ทั้งหมด' && p.category !== selectedCategory) return false;
    // Hide out-of-stock products (quantity tracking only)
    if (p.tracking_mode !== 'usage' && p.stock_quantity <= 0) return false;
    if (p.tracking_mode === 'usage' && p.status === 'empty') return false;
    return true;
  });

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    if (isOutsideServiceHours) return cats.filter(c => !RESTRICTED_CATEGORIES.includes(c));
    return cats;
  }, [products, isOutsideServiceHours]);

  // ===== LOGIN SCREEN =====
  if (!currentUser) {
    return (
      <div className="jb-login-page">
        <div className="jb-login-card">
          <div className="jb-login-header">
            <div className="jb-login-logo-wrap">
              <Coffee size={32} className="jb-login-coffee-icon" />
            </div>
            <h1 className="jb-login-title">
              JAUN <span className="jb-login-title-accent">BOOST</span>
            </h1>
            <p className="jb-login-subtitle">Welfare System</p>
          </div>

          <div className="jb-login-form">
            <div className="jb-login-field">
              <label className="jb-login-label">เบอร์โทรศัพท์</label>
              <div className="jb-login-input-wrap">
                <Phone size={18} className="jb-login-input-icon" />
                <input
                  type="tel"
                  className="jb-login-input"
                  placeholder="เช่น 0812345678"
                  maxLength={10}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
            </div>


            {loginError && (
              <div className="jb-login-error">
                <AlertCircle size={16} /> {loginError}
              </div>
            )}

            <button
              className="jb-login-btn"
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </div>

          <div className="jb-login-footer">
            <button
              className="jb-register-link"
              onClick={() => { setShowRegister(true); setRegError(''); setRegSuccess(false); setRegPhone(''); setRegName(''); }}
            >
              <UserPlus size={16} /> ยังไม่มีบัญชี? ลงทะเบียนเข้าใช้งาน
            </button>
            <Link href="/admin" className="jb-login-admin-link">
              <Settings size={14} /> เข้าหน้าจัดการระบบ
            </Link>
          </div>
        </div>

        {/* ===== Registration Modal ===== */}
        {showRegister && (
          <div className="jb-reg-overlay" onClick={() => setShowRegister(false)}>
            <div className="jb-reg-modal" onClick={(e) => e.stopPropagation()}>
              <div className="jb-reg-header">
                <h3><UserPlus size={20} /> ลงทะเบียนเข้าใช้งาน</h3>
                <button onClick={() => setShowRegister(false)} className="jb-modal-close"><X size={20} /></button>
              </div>

              {regSuccess ? (
                <div className="jb-reg-success">
                  <CheckCircle2 size={48} className="jb-reg-success-icon" />
                  <h4>ลงทะเบียนสำเร็จ!</h4>
                  <p>ใช้เบอร์โทรศัพท์ เพื่อเข้าสู่ระบบ</p>
                  <button
                    className="jb-login-btn"
                    onClick={() => { setShowRegister(false); setLoginId(regPhone); setLoginPassword('1234'); }}
                  >
                    ไปหน้าเข้าสู่ระบบ
                  </button>
                </div>
              ) : (
                <div className="jb-reg-form">
                  <div className="jb-login-field">
                    <label className="jb-login-label">ชื่อ-นามสกุล</label>
                    <div className="jb-login-input-wrap">
                      <User size={18} className="jb-login-input-icon" />
                      <input
                        type="text"
                        className="jb-login-input"
                        placeholder="เช่น สมชาย ใจดี"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="jb-login-field">
                    <label className="jb-login-label">เบอร์โทรศัพท์</label>
                    <div className="jb-login-input-wrap">
                      <Phone size={18} className="jb-login-input-icon" />
                      <input
                        type="tel"
                        className="jb-login-input"
                        placeholder="เช่น 0812345678"
                        maxLength={10}
                        minLength={9}
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                      />
                    </div>
                  </div>

                  {regError && (
                    <div className="jb-login-error">
                      <AlertCircle size={16} /> {regError}
                    </div>
                  )}

                  <button
                    className="jb-login-btn"
                    onClick={async () => {
                      setRegError('');
                      if (!regName.trim()) { setRegError('กรุณากรอกชื่อ-นามสกุล'); return; }
                      if (!regPhone.trim() || regPhone.trim().length < 9) { setRegError('กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง'); return; }
                      const result = await registerServiceUser(regPhone.trim(), regName.trim());
                      if (result.success) {
                        setRegSuccess(true);
                      } else {
                        setRegError(result.error || 'ลงทะเบียนไม่สำเร็จ');
                      }
                    }}
                  >
                    ลงทะเบียน
                  </button>

                  <p className="jb-reg-hint">ลงทะเบียนแล้วใช้เบอร์โทรเข้าสู่ระบบได้เลย</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748b' }}>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // ===== MAIN APP =====
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      {/* Notification Toast */}
      {notification && (
        <div className={`jb-notification ${notification.type === 'error' ? 'jb-notification-error' : 'jb-notification-success'}`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="jb-notification-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="jb-navbar">
        <div className="jb-navbar-inner">
          <div className="jb-navbar-left">
            <div className="jb-navbar-logo">
              <Coffee size={24} className="text-white" />
            </div>
            <div>
              <span className="jb-navbar-brand">
                JAUN <span className="jb-navbar-brand-accent">BOOST</span>
              </span>
              <span className="jb-navbar-tagline">Welfare System</span>
            </div>
          </div>

          <div className="jb-navbar-right">
            <a href="https://lin.ee/D8Z7xcB" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: '#065f46', color: '#fff', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
              แจ้งปัญหาการใช้งาน
            </a>
            <span className="jb-navbar-user">
              <User size={14} /> {currentUser.name}
            </span>
            <button onClick={handleLogout} className="jb-logout-btn">
              ออก
            </button>
          </div>
        </div>
      </nav>

      <main className="jb-main">
        <div className="jb-content-grid">
          {/* ===== Main Area ===== */}
          <div className="jb-main-area">
            {/* Hero Banner */}
            <div className="jb-hero">
              <div className="jb-hero-content">
                <h2 className="jb-hero-title">เติมพลังให้เต็มที่! ⚡️</h2>
                <p className="jb-hero-subtitle">
                  ยินดีต้อนรับสู่มุมสวัสดิการอาหาร พนักงานทุกคนอย่าลืมรักษาระเบียบและบันทึกข้อมูลตามจริงนะครับ
                </p>
              </div>
              <div className="jb-hero-icon">
                <ShoppingBag size={200} />
              </div>
            </div>

            {/* Filter Row: Category dropdown + Search */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  flex: 1, height: '44px', padding: '0 32px 0 14px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff',
                  fontSize: '14px', fontWeight: 600, color: '#1e3a5f', cursor: 'pointer',
                  appearance: 'none' as const, WebkitAppearance: 'none' as const,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                }}
              >
                <option value="ทั้งหมด">🏷️ ทั้งหมด ({isOutsideServiceHours ? products.filter(p => !RESTRICTED_CATEGORIES.includes(p.category)).length : products.length})</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat} ({products.filter(p => p.category === cat).length})</option>
                ))}
              </select>
              <div className="jb-search-wrap" style={{ flex: 1, marginBottom: 0, height: '44px' }}>
                <Search className="jb-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  className="jb-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Time Restriction Banner */}
            {isOutsideServiceHours && (
              <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', border: '1px solid #fbbf24' }}>
                <div>
                  <strong style={{ color: '#92400e', fontSize: '14px' }}>หมวดอาหาร/อาหารสด เปิดให้บริการ 11:00 - 20:00 น.</strong>
                  <p style={{ color: '#a16207', fontSize: '13px', margin: 0 }}>{currentHour < 11 ? 'หมวดอาหารและอาหารสดยังไม่เปิดให้บริการ หมวดอื่นๆ เบิกได้ตามปกติ' : 'หมวดอาหารและอาหารสดปิดให้บริการแล้ว หมวดอื่นๆ ยังเบิกได้ตามปกติ'}</p>
                </div>
              </div>
            )}

            {/* Product Grid */}
            <div className="jb-products-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="jb-product-card">
                  <div className="jb-product-card-inner">
                    <div className="jb-product-image-wrap">
                      <div className="jb-product-image-emoji">
                        {product.image_url && (product.image_url.startsWith('data:') || product.image_url.startsWith('http')) ? (
                          <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} />
                        ) : (
                          product.image_url || '📦'
                        )}
                      </div>
                    </div>
                    <div className="jb-product-info">
                      <div>
                        <div className="jb-product-header">
                          <span className="jb-product-category">{product.category}</span>
                          {product.stock_quantity <= 5 && (
                            <span className="jb-product-low-badge">ใกล้หมด</span>
                          )}
                        </div>
                        <h3 className="jb-product-name">{product.name}</h3>
                        {product.barcode && (
                          <p style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', margin: '2px 0 0' }}>#{product.barcode}</p>
                        )}
                        <p className="jb-product-stock">
                          <Package size={14} /> คงเหลือ {product.stock_quantity} {product.unit}
                        </p>
                      </div>
                      <div className="jb-product-actions">
                        {cart[product.id] ? (
                          <div className="jb-qty-controls">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="jb-qty-btn jb-qty-minus"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="jb-qty-display">{cart[product.id]}</span>
                            <button
                              onClick={() => addToCart(product)}
                              className="jb-qty-btn jb-qty-plus"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="jb-add-btn"
                            disabled={product.stock_quantity <= 0}
                          >
                            <PlusCircle size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== Sidebar ===== */}
          <div className="jb-sidebar">
            {/* Cart */}
            <div className="jb-sidebar-card">
              <h3 className="jb-sidebar-title">
                <ShoppingBag size={20} /> รายการอาหาร
              </h3>
              {Object.keys(cart).length === 0 ? (
                <div className="jb-sidebar-empty">
                  <ShoppingBag size={40} className="jb-sidebar-empty-icon" />
                  <p>ยังไม่มีรายการ</p>
                  <p className="jb-sidebar-empty-hint">เลือกอาหารจากรายการด้านซ้าย</p>
                </div>
              ) : (
                <>
                  <div className="jb-cart-items">
                    {Object.entries(cart).map(([id, qty]) => {
                      const prod = products.find((p) => p.id === id);
                      if (!prod) return null;
                      return (
                        <div key={id} className="jb-cart-item">
                          <span className="jb-cart-item-emoji">
                            {prod.image_url && (prod.image_url.startsWith('data:') || prod.image_url.startsWith('http')) ? (
                              <img src={prod.image_url} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} />
                            ) : (
                              prod.image_url || '📦'
                            )}
                          </span>
                          <div className="jb-cart-item-info">
                            <span className="jb-cart-item-name">{prod.name}</span>
                            <span className="jb-cart-item-detail">
                              {qty} {prod.unit}
                            </span>
                          </div>
                          <button
                            onClick={() => removeFromCart(id)}
                            className="jb-cart-remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={handleCheckoutRequest} className="jb-checkout-btn">
                    <CheckCircle2 size={18} />
                    ยืนยันเบิก ({Object.values(cart).reduce((a, b) => a + b, 0)} รายการ)
                  </button>
                </>
              )}
            </div>

            {/* Order History Button */}
            {orderHistory.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="jb-sidebar-card"
                style={{ width: '100%', cursor: 'pointer', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <History size={20} />
                  <div>
                    <strong style={{ fontSize: '15px', color: '#1e3a5f' }}>ประวัติการเบิก</strong>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{orderHistory.length} รายการ</p>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </button>
            )}



            {/* Rules Link */}
            <button
              onClick={() => { setIsAgreed(false); setShowRulesModal(true); }}
              className="jb-rules-link"
            >
              <Info size={18} />
              กฎ-ระเบียบสวัสดิการอาหาร
              <ChevronRight size={16} />
            </button>



          </div>
        </div>
      </main >

      {/* ===== Rules Modal ===== */}
      {
        showRulesModal && (
          <div className="jb-modal-overlay" onClick={() => setShowRulesModal(false)}>
            <div className="jb-modal" onClick={(e) => e.stopPropagation()}>
              <div className="jb-modal-header">
                <h3>
                  <ShieldCheck size={22} /> กฎ-ระเบียบสวัสดิการอาหาร
                </h3>
                <button onClick={() => setShowRulesModal(false)} className="jb-modal-close">
                  <X size={20} />
                </button>
              </div>

              <div className="jb-modal-body" ref={rulesScrollRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollHeight - el.scrollTop - el.clientHeight < 30) {
                    setHasScrolledRules(true);
                  }
                }}
              >
                {welfareRules.map((rule, index) => (
                  <div key={index} className="jb-rule-section">
                    <h4 className="jb-rule-title">
                      <span>{rule.icon}</span> {rule.title}
                    </h4>
                    <ul className="jb-rule-list">
                      {rule.items.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {!hasScrolledRules && (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: '#ea580c', fontSize: '13px', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
                    ⬇️ เลื่อนอ่านกฎ-ระเบียบจนสุดเพื่อยืนยันการเบิก ⬇️
                  </div>
                )}
              </div>

              {Object.keys(cart).length > 0 && (
                <div className="jb-modal-footer">
                  {/* Photo Evidence */}
                  <div style={{ width: '100%', marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#1e3a5f', marginBottom: '8px' }}>
                      📸 แนบรูปหลักฐานการเบิก *
                    </label>
                    {/* Hidden camera input (opens camera directly) */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const img = new window.Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const maxW = 800;
                            const scale = Math.min(1, maxW / img.width);
                            canvas.width = img.width * scale;
                            canvas.height = img.height * scale;
                            const ctx = canvas.getContext('2d')!;
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            setEvidencePhoto(canvas.toDataURL('image/jpeg', 0.6));
                          };
                          img.src = ev.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }}
                      style={{ display: 'none' }}
                    />
                    {/* Hidden gallery input (opens file picker) */}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const img = new window.Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const maxW = 800;
                            const scale = Math.min(1, maxW / img.width);
                            canvas.width = img.width * scale;
                            canvas.height = img.height * scale;
                            const ctx = canvas.getContext('2d')!;
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            setEvidencePhoto(canvas.toDataURL('image/jpeg', 0.6));
                          };
                          img.src = ev.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }}
                      style={{ display: 'none' }}
                    />
                    {evidencePhoto ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={evidencePhoto} alt="หลักฐาน" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #3b82f6' }} />
                        <button
                          onClick={() => { setEvidencePhoto(null); if (photoInputRef.current) photoInputRef.current.value = ''; if (cameraInputRef.current) cameraInputRef.current.value = ''; }}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >✕</button>
                        <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>✅ แนบรูปแล้ว</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', border: '2px dashed #f97316', background: '#fff7ed', color: '#ea580c', cursor: 'pointer', fontSize: '14px', flex: 1, justifyContent: 'center', fontWeight: 600 }}
                        >
                          <Camera size={20} /> ถ่ายรูป
                        </button>
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', border: '2px dashed #94a3b8', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '14px', flex: 1, justifyContent: 'center' }}
                        >
                          <ImageIcon size={20} /> เลือกรูป
                        </button>
                      </div>
                    )}
                  </div>

                  <label className="jb-agree-label" style={!hasScrolledRules ? { opacity: 0.4, pointerEvents: 'none' } : {}}>
                    <input
                      type="checkbox"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      disabled={!hasScrolledRules}
                      className="jb-agree-checkbox"
                    />
                    ข้าพเจ้ายอมรับกฎ-ระเบียบ และจะบันทึกข้อมูลตามจริง
                  </label>
                  <button
                    onClick={confirmCheckout}
                    disabled={!isAgreed || !evidencePhoto || checkoutLoading}
                    className="jb-confirm-btn"
                  >
                    {checkoutLoading ? '⏳ กำลังบันทึก...' : <><CheckCircle2 size={18} /> ยืนยันเบิกอาหาร</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* History Modal */}
      {showHistoryModal && (
        <div className="jb-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="jb-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="jb-modal-header">
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} /> ประวัติการเบิก
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="jb-modal-close">
                <X size={20} />
              </button>
            </div>

            {/* Month Selector */}
            <div style={{ padding: '0 20px', marginBottom: '12px' }}>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc' }}
              />
            </div>

            {/* History List */}
            <div style={{ overflow: 'auto', flex: 1, padding: '0 20px 20px' }}>
              {(() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                const filtered = orderHistory.filter(o => {
                  const d = new Date(o.id);
                  return d.getFullYear() === y && d.getMonth() + 1 === m;
                });
                if (filtered.length === 0) {
                  return <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>ไม่มีประวัติในเดือนนี้</p>;
                }
                return filtered.map((order) => (
                  <div key={order.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                      <Clock size={14} />
                      <span>{order.date}</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '14px' }}>
                      {order.items.map((item, i) => (
                        <li key={i} style={{ marginBottom: '2px' }}>
                          {item.image_url && (item.image_url.startsWith('data:') || item.image_url.startsWith('http')) ? (
                            <img src={item.image_url} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover', verticalAlign: 'middle', marginRight: 4 }} />
                          ) : (
                            <>{item.image_url || '📦'} </>
                          )}
                          {item.name} x{item.qty}
                        </li>
                      ))}
                    </ul>
                    {order.photo && (
                      <button
                        onClick={() => setViewingPhoto(order.photo!)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', marginTop: '8px' }}
                      >
                        <ImageIcon size={12} /> ดูหลักฐาน
                      </button>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewing Modal */}
      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <button
            onClick={() => setViewingPhoto(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer' }}
          >✕</button>
          <img
            src={viewingPhoto}
            alt="หลักฐานการเบิก"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90%', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Motivational Popup */}
      {motivationalMsg && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px', padding: '40px 32px', maxWidth: '380px', width: '88%',
            textAlign: 'center', boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
            animation: 'popIn 0.4s ease',
          }}>
            <div style={{ fontSize: '52px', marginBottom: '20px', animation: 'bounce 0.6s ease' }}>🎉</div>
            <h3 style={{
              fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '16px',
              letterSpacing: '-0.3px',
            }}>เบิกสำเร็จแล้ว!</h3>
            <p style={{
              fontSize: '16px', color: '#475569', lineHeight: 1.8, marginBottom: '28px',
              fontWeight: 400,
            }}>{motivationalMsg}</p>
            <button onClick={() => setMotivationalMsg(null)} style={{
              background: '#1e293b', color: '#fff',
              border: 'none', borderRadius: '12px', padding: '14px 48px', fontSize: '15px',
              fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px',
              transition: 'background 0.2s',
            }}>ปิด</button>
          </div>
        </div>
      )}
    </div >
  );
}
