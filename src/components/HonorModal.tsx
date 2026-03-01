'use client';

import { useEffect, useState } from 'react';

interface HonorModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'withdraw' | 'restock';
    userName: string;
}

const MESSAGES_WITHDRAW = [
    'ขอบคุณในความซื่อสัตย์ สวัสดิการนี้จะอยู่ได้เพราะคุณ 💛',
    'เกียรติศักดิ์ของคุณคือรากฐานของความไว้วางใจ ✨',
    'ขอบคุณที่เป็นส่วนหนึ่งของวัฒนธรรมแห่งความซื่อตรง 🌟',
];

const MESSAGES_RESTOCK = [
    'ขอบคุณที่ช่วยเติมเต็ม! คุณคือฮีโร่ของทุกคน 🦸',
    'สินค้าจะไม่หมดเพราะมีคุณคอยดูแล 💪',
    'ขอบคุณที่แบ่งปัน ห้องอาหารนี้มีชีวิตเพราะคุณ 🌈',
];

export default function HonorModal({ isOpen, onClose, type, userName }: HonorModalProps) {
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            const messages = type === 'withdraw' ? MESSAGES_WITHDRAW : MESSAGES_RESTOCK;
            setMessage(messages[Math.floor(Math.random() * messages.length)]);

            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, type, onClose]);

    if (!isOpen) return null;

    return (
        <div className="honor-overlay" onClick={onClose}>
            <div className="honor-modal" onClick={(e) => e.stopPropagation()}>
                <div className="honor-icon">
                    {type === 'withdraw' ? '🙏' : '🎉'}
                </div>
                <h2 className="honor-title">
                    {type === 'withdraw' ? 'บันทึกเรียบร้อย!' : 'เติมสินค้าสำเร็จ!'}
                </h2>
                <p className="honor-user">
                    {userName && `สวัสดี คุณ${userName}`}
                </p>
                <p className="honor-message">{message}</p>
                <div className="honor-sparkle">✨🌟💫⭐✨</div>
                <button onClick={onClose} className="honor-close-btn">
                    ปิด
                </button>
            </div>
        </div>
    );
}
