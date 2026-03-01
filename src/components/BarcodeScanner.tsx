'use client';

import { useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    isActive: boolean;
    onClose: () => void;
}

export default function BarcodeScanner({ onScan, isActive, onClose }: BarcodeScannerProps) {
    const scannerRef = useRef<HTMLDivElement>(null);
    const html5QrCodeRef = useRef<unknown>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isActive) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let scanner: any = null;

        const initScanner = async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode');
                if (!scannerRef.current) return;

                const scannerId = 'barcode-scanner-element';
                if (!document.getElementById(scannerId)) {
                    const div = document.createElement('div');
                    div.id = scannerId;
                    scannerRef.current.appendChild(div);
                }

                const html5QrCode = new Html5Qrcode(scannerId);
                html5QrCodeRef.current = html5QrCode;
                scanner = html5QrCode;

                await html5QrCode.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 150 },
                        aspectRatio: 1.0,
                    },
                    (decodedText: string) => {
                        onScan(decodedText);
                    },
                    () => {
                        // ignore scan failures
                    }
                );
            } catch (err) {
                console.error('Scanner error:', err);
                setError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์');
            }
        };

        initScanner();

        return () => {
            if (scanner) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const s = scanner as any;
                    if (s.isScanning) {
                        s.stop().then(() => s.clear()).catch(console.error);
                    } else {
                        s.clear().catch(console.error);
                    }
                } catch {
                    // ignore cleanup errors
                }
            }
        };
    }, [isActive, onScan]);

    if (!isActive) return null;

    return (
        <div className="scanner-overlay">
            <div className="scanner-container">
                <div className="scanner-header">
                    <h3>📷 สแกนบาร์โค้ด</h3>
                    <button onClick={onClose} className="scanner-close-btn">
                        ✕
                    </button>
                </div>
                <div ref={scannerRef} className="scanner-viewport" />
                {error && (
                    <div className="scanner-error">
                        <p>⚠️ {error}</p>
                        <p className="scanner-error-hint">ลองใช้ Chrome หรือ Safari แล้วอนุญาตสิทธิ์กล้อง</p>
                    </div>
                )}
                <p className="scanner-hint">หันกล้องไปที่บาร์โค้ดบนสินค้า</p>
            </div>
        </div>
    );
}
