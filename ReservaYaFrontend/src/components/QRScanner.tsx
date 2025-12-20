'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    onScan: (code: string) => void;
    onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        const scannerId = 'qr-scanner-container';

        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText) => {
                        // Success callback
                        onScan(decodedText);
                        // Stop scanner after successful scan
                        html5QrCode.stop().catch(console.error);
                        setIsScanning(false);
                    },
                    (errorMessage) => {
                        // Error callback (ignore, scanning continues)
                    }
                );

                setIsScanning(true);
                setHasPermission(true);
            } catch (err: any) {
                console.error('QR Scanner error:', err);
                setHasPermission(false);
                if (onError) {
                    onError(err.message || 'No se pudo acceder a la cámara');
                }
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [onScan, onError]);

    return (
        <div className="w-full">
            {hasPermission === false && (
                <div className="text-center p-6 bg-red-50 rounded-lg">
                    <p className="text-red-600 font-medium">No se pudo acceder a la cámara</p>
                    <p className="text-sm text-red-500 mt-1">
                        Asegúrate de permitir el acceso a la cámara en tu navegador
                    </p>
                </div>
            )}

            <div
                id="qr-scanner-container"
                className="w-full aspect-square max-w-[300px] mx-auto rounded-xl overflow-hidden bg-stone-900"
            />

            {isScanning && (
                <p className="text-center text-sm text-stone-500 mt-3 animate-pulse">
                    📷 Apunta la cámara al código QR del cliente...
                </p>
            )}
        </div>
    );
}
