'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Receipt, Calendar, User, Phone, MapPin, CheckCircle, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoiceData {
    id: string;
    invoiceNumber: string;
    date: string;
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    customerName: string;
    customerTaxId: string;
    items: { description: string; quantity: number; unitPrice: number; total: number }[];
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    paymentMethod: string;
}

export default function InvoiceView() {
    const params = useParams();
    const invoiceId = params.id as string;
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (invoiceId) {
            fetchInvoice();
        }
    }, [invoiceId]);

    const fetchInvoice = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/public/invoice/${invoiceId}`);

            if (!res.ok) {
                throw new Error('Factura no encontrada');
            }

            const data = await res.json();
            setInvoice(data.invoice);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar factura');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share && invoice) {
            try {
                await navigator.share({
                    title: `Factura ${invoice.invoiceNumber}`,
                    text: `Tu factura de ${invoice.businessName} por $${invoice.total.toFixed(2)}`,
                    url: window.location.href
                });
            } catch {
                // User cancelled or error
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Enlace copiado al portapapeles');
        }
    };

    const handleDownload = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-stone-600">Cargando factura...</p>
                </div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Receipt className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-stone-800 mb-2">Factura no encontrada</h1>
                    <p className="text-stone-500 mb-4">{error || 'La factura solicitada no existe o ha expirado.'}</p>
                    <Button onClick={() => window.location.href = '/'} variant="outline">
                        Volver al inicio
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b-4 border-emerald-600">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-stone-800">{invoice.businessName}</h1>
                            <p className="text-sm text-stone-500">Factura #{invoice.invoiceNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(invoice.date).toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center justify-center gap-2 py-3 ${invoice.status === 'paid' ? 'bg-emerald-500' : invoice.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'} text-white`}>
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                        {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                    </span>
                </div>

                {/* Content */}
                <div className="bg-white p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="bg-stone-50 rounded-lg p-4">
                        <h3 className="text-xs font-medium text-stone-500 uppercase mb-2">Cliente</h3>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-stone-400" />
                            <span className="font-medium text-stone-800">{invoice.customerName}</span>
                        </div>
                        {invoice.customerTaxId && (
                            <p className="text-sm text-stone-500 ml-6">RTN: {invoice.customerTaxId}</p>
                        )}
                    </div>

                    {/* Items */}
                    <div>
                        <h3 className="text-xs font-medium text-stone-500 uppercase mb-3">Detalle</h3>
                        <div className="space-y-3">
                            {invoice.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-start py-2 border-b border-stone-100">
                                    <div>
                                        <p className="font-medium text-stone-800">{item.description}</p>
                                        <p className="text-sm text-stone-500">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                                    </div>
                                    <span className="font-medium text-stone-800">${item.total.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-stone-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Subtotal</span>
                            <span className="text-stone-700">${invoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Impuestos</span>
                            <span className="text-stone-700">${invoice.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-stone-200">
                            <span className="text-stone-800">Total</span>
                            <span className="text-emerald-600">${invoice.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    {invoice.paymentMethod && (
                        <div className="text-center text-sm text-stone-500">
                            Pagado con: <span className="font-medium">{invoice.paymentMethod === 'cash' ? 'Efectivo' : invoice.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="bg-white rounded-b-2xl shadow-lg p-4 flex gap-3 print:hidden">
                    <Button variant="outline" onClick={handleShare} className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" /> Compartir
                    </Button>
                    <Button onClick={handleDownload} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        <Download className="h-4 w-4 mr-2" /> Descargar
                    </Button>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-stone-400 mt-6">
                    Gracias por tu preferencia • {invoice.businessName}
                </p>
            </div>
        </div>
    );
}
