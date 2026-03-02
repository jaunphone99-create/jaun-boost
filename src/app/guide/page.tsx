'use client';

import Link from 'next/link';

const steps = [
    {
        num: 1,
        icon: '🌐',
        title: 'เปิดเว็บไซต์',
        desc: 'เปิดเบราว์เซอร์บนมือถือหรือคอมพิวเตอร์ แล้วเข้าเว็บไซต์',
        detail: 'พิมพ์ jaun-boost.vercel.app ในช่อง URL หรือสแกน QR Code ที่ติดไว้ที่หน้าร้าน',
        color: '#3b82f6',
    },
    {
        num: 2,
        icon: '📞',
        title: 'กรอกเบอร์โทรศัพท์',
        desc: 'ป้อนเบอร์โทร 10 หลักของตนเอง แล้วกดปุ่ม "เข้าสู่ระบบ"',
        detail: 'เช่น 0812345678 — ใช้เบอร์โทรเดียวกับที่ลงทะเบียนไว้',
        color: '#8b5cf6',
    },
    {
        num: 3,
        icon: '✍️',
        title: 'ลงทะเบียน (ครั้งแรกเท่านั้น)',
        desc: 'หากเข้าใช้งานครั้งแรก กด "ลงทะเบียนเข้าใช้งาน"',
        detail: 'กรอกชื่อ-นามสกุล และเบอร์โทร แล้วกดปุ่ม "ลงทะเบียน" — ทำแค่ครั้งเดียว ครั้งต่อไปใช้เบอร์โทรเข้าสู่ระบบได้เลย',
        color: '#ec4899',
    },
    {
        num: 4,
        icon: '🏠',
        title: 'ดูรายการสินค้า',
        desc: 'หลังเข้าสู่ระบบ จะเห็นรายการสินค้าทั้งหมดที่เบิกได้',
        detail: 'สามารถค้นหาสินค้าจากช่องค้นหา หรือกรองตามหมวดหมู่ได้ แต่ละสินค้าจะแสดงชื่อ รูปภาพ และจำนวนคงเหลือ',
        color: '#f97316',
    },
    {
        num: 5,
        icon: '➕',
        title: 'เลือกสินค้าที่ต้องการเบิก',
        desc: 'กดปุ่ม ⊕ บนสินค้าที่ต้องการ',
        detail: 'สินค้าจะปรากฏในตะกร้า "รายการอาหาร" ด้านขวา กดปุ่ม ＋ / － เพื่อปรับจำนวนได้ตามต้องการ',
        color: '#10b981',
    },
    {
        num: 6,
        icon: '✅',
        title: 'กดยืนยันเบิก',
        desc: 'เมื่อเลือกสินค้าครบ กดปุ่ม "ยืนยันเบิก"',
        detail: 'ระบบอาจให้ถ่ายรูปยืนยันการรับสินค้า เมื่อเสร็จสิ้น จะแสดงข้อความ "เบิกสำเร็จ!" ข้อมูลทั้งหมดจะถูกบันทึกอัตโนมัติ',
        color: '#06b6d4',
    },
    {
        num: 7,
        icon: '🚪',
        title: 'ออกจากระบบ',
        desc: 'เมื่อใช้งานเสร็จ กดปุ่ม "ออก" ที่มุมขวาบน',
        detail: 'ควรออกจากระบบทุกครั้งหลังใช้งานเสร็จ เพื่อความปลอดภัยของข้อมูล',
        color: '#ef4444',
    },
];

const tips = [
    { icon: '💡', text: 'สามารถใช้งานได้ทั้งบนมือถือและคอมพิวเตอร์' },
    { icon: '🔍', text: 'ใช้ช่องค้นหาพิมพ์ชื่อสินค้าเพื่อหาเร็วขึ้น' },
    { icon: '📱', text: 'บันทึกหน้าเว็บไว้ที่หน้าจอมือถือเพื่อเข้าใช้ง่ายขึ้น' },
    { icon: '🆘', text: 'หากมีปัญหา กดปุ่ม "แจ้งปัญหาการใช้งาน" ที่มุมขวาบน' },
];

export default function GuidePage() {
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #002244 0%, #003366 40%, #004488 100%)' }}>
            {/* Header */}
            <header style={{
                padding: '32px 24px 16px', textAlign: 'center', position: 'relative',
            }}>
                <Link href="/" style={{
                    position: 'absolute', left: 24, top: 32,
                    background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
                    borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', textDecoration: 'none', backdropFilter: 'blur(10px)',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                    ← กลับหน้าหลัก
                </Link>
                <div style={{
                    width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #f97316, #fb923c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(249, 115, 22, 0.4)',
                }}>📖</div>
                <h1 style={{
                    fontFamily: "'Prompt', sans-serif", fontSize: 28, fontWeight: 800, color: '#fff',
                    margin: '0 0 8px',
                }}>
                    คู่มือการใช้งาน
                </h1>
                <p style={{
                    fontFamily: "'Prompt', sans-serif", fontSize: 16, color: 'rgba(255,255,255,0.7)',
                    fontWeight: 400,
                }}>
                    JAUN BOOST — ระบบสวัสดิการอาหาร
                </p>
            </header>

            {/* Steps */}
            <main style={{ maxWidth: 640, margin: '0 auto', padding: '16px 20px 40px' }}>
                {/* Steps Timeline */}
                <div style={{ position: 'relative' }}>
                    {steps.map((step, i) => (
                        <div key={step.num} style={{
                            display: 'flex', gap: 16, marginBottom: i < steps.length - 1 ? 0 : 0,
                            position: 'relative',
                        }}>
                            {/* Timeline line & dot */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                width: 48, flexShrink: 0,
                            }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${step.color}, ${step.color}bb)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, fontWeight: 800, color: '#fff',
                                    fontFamily: "'Prompt', sans-serif",
                                    boxShadow: `0 4px 20px ${step.color}66`,
                                    flexShrink: 0, position: 'relative', zIndex: 2,
                                }}>
                                    {step.num}
                                </div>
                                {i < steps.length - 1 && (
                                    <div style={{
                                        width: 3, flex: 1, minHeight: 20,
                                        background: `linear-gradient(180deg, ${step.color}88, ${steps[i + 1].color}88)`,
                                        borderRadius: 2,
                                    }} />
                                )}
                            </div>

                            {/* Card */}
                            <div style={{
                                flex: 1, background: 'rgba(255,255,255,0.08)',
                                borderRadius: 16, padding: '20px 20px 24px',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                marginBottom: 16,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <span style={{ fontSize: 24 }}>{step.icon}</span>
                                    <h3 style={{
                                        fontFamily: "'Prompt', sans-serif", fontSize: 18,
                                        fontWeight: 700, color: '#fff', margin: 0,
                                    }}>
                                        {step.title}
                                    </h3>
                                </div>
                                <p style={{
                                    fontFamily: "'Sarabun', sans-serif", fontSize: 15,
                                    color: 'rgba(255,255,255,0.9)', lineHeight: 1.6,
                                    margin: '0 0 8px', fontWeight: 500,
                                }}>
                                    {step.desc}
                                </p>
                                <p style={{
                                    fontFamily: "'Sarabun', sans-serif", fontSize: 13,
                                    color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, margin: 0,
                                }}>
                                    {step.detail}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tips Section */}
                <div style={{
                    marginTop: 32, background: 'rgba(249, 115, 22, 0.12)',
                    borderRadius: 20, padding: 24,
                    border: '1px solid rgba(249, 115, 22, 0.25)',
                }}>
                    <h3 style={{
                        fontFamily: "'Prompt', sans-serif", fontSize: 18,
                        fontWeight: 700, color: '#fdba74', margin: '0 0 16px',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        💡 เคล็ดลับการใช้งาน
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {tips.map((tip, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 10,
                            }}>
                                <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.icon}</span>
                                <p style={{
                                    fontFamily: "'Sarabun', sans-serif", fontSize: 14,
                                    color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5,
                                }}>
                                    {tip.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Summary */}
                <div style={{
                    marginTop: 24, background: 'rgba(255,255,255,0.06)',
                    borderRadius: 20, padding: 24,
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <h3 style={{
                        fontFamily: "'Prompt', sans-serif", fontSize: 18,
                        fontWeight: 700, color: '#fff', margin: '0 0 16px',
                        textAlign: 'center',
                    }}>
                        📋 สรุปขั้นตอน
                    </h3>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: 10,
                    }}>
                        {[
                            { e: '🌐', t: 'เปิดเว็บ' },
                            { e: '📞', t: 'กรอกเบอร์โทร' },
                            { e: '🔑', t: 'เข้าสู่ระบบ' },
                            { e: '🛒', t: 'เลือกสินค้า' },
                            { e: '✅', t: 'ยืนยันเบิก' },
                            { e: '📸', t: 'ถ่ายรูปยืนยัน' },
                            { e: '🎉', t: 'เสร็จสิ้น!' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 8px',
                                textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <div style={{ fontSize: 24, marginBottom: 4 }}>{item.e}</div>
                                <div style={{
                                    fontFamily: "'Sarabun', sans-serif", fontSize: 13,
                                    color: 'rgba(255,255,255,0.7)', fontWeight: 500,
                                }}>{item.t}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <Link href="/" style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        gap: 8, background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        color: '#fff', fontFamily: "'Prompt', sans-serif",
                        fontSize: 16, fontWeight: 700, padding: '16px 40px',
                        borderRadius: 14, textDecoration: 'none',
                        boxShadow: '0 8px 32px rgba(249, 115, 22, 0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}>
                        🚀 เริ่มใช้งานเลย
                    </Link>
                    <p style={{
                        fontFamily: "'Sarabun', sans-serif", fontSize: 13,
                        color: 'rgba(255,255,255,0.4)', marginTop: 16,
                    }}>
                        JAUN BOOST — Welfare System © 2026
                    </p>
                </div>
            </main>
        </div>
    );
}
