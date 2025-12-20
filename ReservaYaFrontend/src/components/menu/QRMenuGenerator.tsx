'use client';

import { useState, useEffect, useRef } from 'react';
import { QrCode, Download, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRMenuGeneratorProps {
    restaurantId: string;
    restaurantName?: string;
}

export default function QRMenuGenerator({ restaurantId, restaurantName }: QRMenuGeneratorProps) {
    const [copied, setCopied] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Generate the public menu URL
    const menuUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/menu/${restaurantId}`
        : `/menu/${restaurantId}`;

    // Generate QR code using canvas
    useEffect(() => {
        if (!restaurantId) return;

        // Load QRCode library dynamically
        const generateQR = async () => {
            try {
                // Using a simple QR code generation via API (can be replaced with local library)
                const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`;
                setQrDataUrl(qrApiUrl);
            } catch (error) {
                console.error('Error generating QR code:', error);
            }
        };

        generateQR();
    }, [restaurantId, menuUrl]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(menuUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleDownload = () => {
        if (!qrDataUrl) return;

        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `menu-qr-${restaurantName || restaurantId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenMenu = () => {
        window.open(menuUrl, '_blank');
    };

    return (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-stone-800">Menú QR</h3>
                    <p className="text-sm text-stone-500">Genera un código QR para tu menú digital</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* QR Code Display */}
                <div className="flex-shrink-0">
                    <div className="w-48 h-48 bg-white border-2 border-stone-200 rounded-xl overflow-hidden flex items-center justify-center">
                        {qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt="QR Code del Menú"
                                className="w-full h-full object-contain p-2"
                            />
                        ) : (
                            <div className="text-stone-300">
                                <QrCode className="h-16 w-16" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex-1 space-y-4">
                    {/* URL Display */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            URL del Menú
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={menuUrl}
                                className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-600 font-mono"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                className="px-3"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={handleDownload}
                            disabled={!qrDataUrl}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar QR
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleOpenMenu}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver Menú
                        </Button>
                    </div>

                    {/* Tips */}
                    <div className="bg-purple-50 rounded-lg p-4 text-sm">
                        <p className="font-medium text-purple-800 mb-2">💡 Consejos:</p>
                        <ul className="space-y-1 text-purple-700">
                            <li>• Imprime el QR y colócalo en cada mesa</li>
                            <li>• Los clientes solo verán items disponibles</li>
                            <li>• El menú se actualiza automáticamente</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
