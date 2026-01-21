'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Receipt, Calendar, Clock, Search, Eye, Printer, DollarSign, CreditCard, Wallet, X } from 'lucide-react';

interface Order {
    id: string;
    tableNumber: string;
    openedAt: string;
    closedAt: string;
    total: number;
    paymentMethod: 'cash' | 'card' | 'transfer';
    items: { name: string; quantity: number; price: number }[];
    status: 'open' | 'payment_pending' | 'closed';
}

export function BillingClient() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDailySummary, setShowDailySummary] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [toast, setToast] = useState('');


    useEffect(() => {
        fetchOrders();
    }, [selectedDate]);

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/restaurant/billing?date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error fetching orders');

            const data = await res.json();
            const mappedOrders: Order[] = (data.orders || []).map((o: any) => ({
                id: o.id,
                tableNumber: o.tableNumber || 'N/A',
                openedAt: o.createdAt ? new Date(o.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '',
                closedAt: o.status === 'closed' && o.updatedAt ? new Date(o.updatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '',
                total: o.total || 0,
                paymentMethod: 'card' as const, // Default for now
                status: o.status,
                items: o.items || []
            }));
            setOrders(mappedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (order: Order) => {
        const businessName = 'Mi Restaurante';
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;

        const receiptContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket #${order.id}</title>
                <style>
                    @page { size: 80mm auto; margin: 5mm; }
                    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Courier New', monospace; }
                    body { width: 72mm; padding: 2mm; font-size: 12px; }
                    .header { text-align: center; border-bottom: 1px dashed #333; padding-bottom: 8px; margin-bottom: 8px; }
                    .header h1 { font-size: 16px; font-weight: bold; }
                    .header p { font-size: 10px; color: #666; }
                    .info { margin-bottom: 8px; font-size: 11px; }
                    .info div { display: flex; justify-content: space-between; }
                    .items { border-top: 1px dashed #333; border-bottom: 1px dashed #333; padding: 8px 0; margin: 8px 0; }
                    .item { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; }
                    .item-name { flex: 1; }
                    .item-price { text-align: right; font-weight: bold; }
                    .total { text-align: right; font-size: 16px; font-weight: bold; margin: 8px 0; padding: 8px 0; border-top: 2px solid #333; }
                    .footer { text-align: center; font-size: 10px; color: #666; margin-top: 16px; }
                    .payment { background: #f5f5f5; padding: 4px 8px; border-radius: 4px; text-align: center; margin-bottom: 8px; }
                    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${businessName}</h1>
                    <p>Ticket de Venta</p>
                </div>
                <div class="info">
                    <div><span>Ticket:</span><span>#${order.id}</span></div>
                    <div><span>Mesa:</span><span>${order.tableNumber}</span></div>
                    <div><span>Fecha:</span><span>${new Date().toLocaleDateString()}</span></div>
                    <div><span>Hora:</span><span>${order.closedAt || order.openedAt}</span></div>
                </div>
                <div class="payment">
                    Pago: ${order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                </div>
                <div class="items">
                    ${order.items.map(item => `
                        <div class="item">
                            <span class="item-name">${item.quantity}x ${item.name}</span>
                            <span class="item-price">$${item.price.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="total">
                    TOTAL: $${order.total.toFixed(2)}
                </div>
                <div class="footer">
                    <p>¡Gracias por su visita!</p>
                    <p>${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 200);
    };

    const handlePrintDailySummary = () => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;

        const summaryContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Corte del Día - ${selectedDate}</title>
                <style>
                    @page { size: 80mm auto; margin: 5mm; }
                    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Courier New', monospace; }
                    body { width: 72mm; padding: 2mm; font-size: 12px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 12px; }
                    .header h1 { font-size: 14px; font-weight: bold; }
                    .header p { font-size: 11px; }
                    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #ccc; }
                    .row.total { border-top: 2px solid #333; border-bottom: none; margin-top: 8px; padding-top: 8px; font-size: 14px; font-weight: bold; }
                    .footer { text-align: center; font-size: 10px; color: #666; margin-top: 16px; border-top: 1px dashed #333; padding-top: 8px; }
                    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CORTE DEL DÍA</h1>
                    <p>${selectedDate}</p>
                </div>
                <div class="row"><span>Órdenes Cerradas:</span><span>${stats.orderCount}</span></div>
                <div class="row"><span>Efectivo:</span><span>$${stats.cashTotal.toFixed(2)}</span></div>
                <div class="row"><span>Tarjeta:</span><span>$${stats.cardTotal.toFixed(2)}</span></div>
                <div class="row total"><span>TOTAL VENTAS:</span><span>$${stats.totalSales.toFixed(2)}</span></div>
                <div class="footer">
                    <p>Impreso: ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(summaryContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 200);
        setShowDailySummary(false);
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'cash': return <Wallet className="h-4 w-4 text-emerald-600" />;
            case 'card': return <CreditCard className="h-4 w-4 text-blue-600" />;
            case 'transfer': return <DollarSign className="h-4 w-4 text-purple-600" />;
            default: return null;
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleCloseOrder = async (paymentMethod: 'cash' | 'card' | 'transfer') => {
        if (!selectedOrder) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/restaurant/orders/${selectedOrder.id}/close`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ paymentMethod })
            });

            if (res.ok) {
                showToast('Cuenta cerrada exitosamente');
                setSelectedOrder(null);
                fetchOrders();
            } else {
                showToast('Error al cerrar la cuenta');
            }
        } catch (error) {
            console.error('Error closing order:', error);
            showToast('Error al cerrar la cuenta');
        }
    };

    const handleApplyDiscount = async () => {
        if (!selectedOrder || discountAmount <= 0) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiUrl = getApiUrl();
            const discount = discountType === 'percentage'
                ? selectedOrder.total * (discountAmount / 100)
                : discountAmount;

            const res = await fetch(`${apiUrl}/restaurant/orders/${selectedOrder.id}/discount`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ discount, discountType, discountAmount })
            });

            if (res.ok) {
                showToast(`Descuento de $${discount.toFixed(2)} aplicado`);
                setShowDiscountModal(false);
                setDiscountAmount(0);
                fetchOrders();
            } else {
                showToast('Error al aplicar descuento');
            }
        } catch (error) {
            console.error('Error applying discount:', error);
            showToast('Error al aplicar descuento');
        }
    };

    const stats = {

        totalSales: orders.filter(o => o.status === 'closed').reduce((acc, o) => acc + o.total, 0),
        orderCount: orders.filter(o => o.status === 'closed').length,
        cashTotal: orders.filter(o => o.status === 'closed' && o.paymentMethod === 'cash').reduce((acc, o) => acc + o.total, 0),
        cardTotal: orders.filter(o => o.status === 'closed' && o.paymentMethod === 'card').reduce((acc, o) => acc + o.total, 0),
    };

    return (
        <ManageLayout title="Caja" subtitle="Historial de ventas y facturación">
            {/* Toolbar */}
            <div className="flex gap-4 mb-6">
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40 border-stone-200" />
                <Button onClick={() => setShowDailySummary(true)} variant="outline" className="ml-auto">
                    <Receipt className="h-4 w-4 mr-2" /> Corte del Día
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700">
                    <p className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</p>
                    <p className="text-sm">Ventas Totales</p>
                </div>
                <div className="p-4 rounded-xl bg-stone-100 text-stone-700">
                    <p className="text-2xl font-bold">{stats.orderCount}</p>
                    <p className="text-sm">Órdenes Cerradas</p>
                </div>
                <div className="p-4 rounded-xl bg-green-100 text-green-700">
                    <p className="text-2xl font-bold">${stats.cashTotal.toFixed(2)}</p>
                    <p className="text-sm">Efectivo</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-100 text-blue-700">
                    <p className="text-2xl font-bold">${stats.cardTotal.toFixed(2)}</p>
                    <p className="text-sm">Tarjeta</p>
                </div>
            </div>

            {/* Orders Table */}
            <Card className="border-stone-200">
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Orden</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Mesa</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Apertura</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Cierre</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Total</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Pago</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Estado</th>
                                <th className="text-right p-4 text-sm font-medium text-stone-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="p-8 text-center text-stone-400">Cargando...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-stone-400">Sin órdenes para esta fecha</td></tr>
                            ) : (
                                orders.map(o => (
                                    <tr key={o.id} className="border-b border-stone-100 hover:bg-stone-50">
                                        <td className="p-4 font-mono text-sm text-stone-600">#{o.id}</td>
                                        <td className="p-4 font-medium text-stone-800">{o.tableNumber}</td>
                                        <td className="p-4 text-sm text-stone-500">{o.openedAt}</td>
                                        <td className="p-4 text-sm text-stone-500">{o.closedAt || '—'}</td>
                                        <td className="p-4 font-medium text-emerald-600">${o.total.toFixed(2)}</td>
                                        <td className="p-4">{getPaymentIcon(o.paymentMethod)}</td>
                                        <td className="p-4">
                                            {o.status === 'closed' && <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Cerrada</span>}
                                            {o.status === 'open' && <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">Abierta</span>}
                                            {o.status === 'payment_pending' && <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Por Pagar</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => setSelectedOrder(o)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver Detalle">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {o.status === 'closed' && (
                                                    <button onClick={() => handlePrint(o)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg" title="Reimprimir">
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Orden #{selectedOrder.id.slice(-6)}</h2>
                            <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="mb-4 p-3 bg-stone-50 rounded-lg">
                            <div className="flex justify-between text-sm text-stone-600">
                                <span>Mesa: {selectedOrder.tableNumber}</span>
                                <span>{selectedOrder.openedAt} - {selectedOrder.closedAt || 'Abierta'}</span>
                            </div>
                            <div className="mt-2">
                                {selectedOrder.status === 'open' && <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">Abierta</span>}
                                {selectedOrder.status === 'payment_pending' && <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Por Pagar</span>}
                                {selectedOrder.status === 'closed' && <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Cerrada</span>}
                            </div>
                        </div>
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                            {selectedOrder.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-stone-700">{item.quantity}x {item.name}</span>
                                    <span className="text-stone-600">${item.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-stone-200 pt-4">
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="text-emerald-600">${selectedOrder.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Actions based on status */}
                        {selectedOrder.status !== 'closed' && (
                            <div className="mt-4 space-y-3">
                                <p className="text-sm font-medium text-stone-600">Cerrar cuenta con:</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => handleCloseOrder('cash')} className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
                                        <Wallet className="h-5 w-5 text-green-600 mx-auto" />
                                        <span className="text-xs text-green-700 mt-1 block">Efectivo</span>
                                    </button>
                                    <button onClick={() => handleCloseOrder('card')} className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
                                        <CreditCard className="h-5 w-5 text-blue-600 mx-auto" />
                                        <span className="text-xs text-blue-700 mt-1 block">Tarjeta</span>
                                    </button>
                                    <button onClick={() => handleCloseOrder('transfer')} className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                                        <DollarSign className="h-5 w-5 text-purple-600 mx-auto" />
                                        <span className="text-xs text-purple-700 mt-1 block">Transfer</span>
                                    </button>
                                </div>
                                <Button variant="outline" onClick={() => setShowDiscountModal(true)} className="w-full">
                                    Aplicar Descuento
                                </Button>
                            </div>
                        )}

                        <div className="flex gap-3 mt-4">
                            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="flex-1">Cerrar</Button>
                            <Button onClick={() => handlePrint(selectedOrder)} className="flex-1 bg-emerald-600 hover:bg-emerald-700"><Printer className="h-4 w-4 mr-2" /> Reimprimir</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Discount Modal */}
            {showDiscountModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Aplicar Descuento</h2>
                            <button onClick={() => setShowDiscountModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="mb-4 p-3 bg-stone-50 rounded-lg text-center">
                            <p className="text-sm text-stone-500">Total actual</p>
                            <p className="text-2xl font-bold text-stone-800">${selectedOrder.total.toFixed(2)}</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Tipo de descuento</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setDiscountType('percentage')} className={`p-3 rounded-lg border-2 ${discountType === 'percentage' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'}`}>
                                        Porcentaje (%)
                                    </button>
                                    <button onClick={() => setDiscountType('fixed')} className={`p-3 rounded-lg border-2 ${discountType === 'fixed' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'}`}>
                                        Monto Fijo ($)
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    {discountType === 'percentage' ? 'Porcentaje' : 'Monto'}
                                </label>
                                <Input
                                    type="number"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                    placeholder={discountType === 'percentage' ? '10' : '50.00'}
                                    min="0"
                                    max={discountType === 'percentage' ? '100' : selectedOrder.total}
                                />
                            </div>
                            {discountAmount > 0 && (
                                <div className="p-3 bg-amber-50 rounded-lg">
                                    <p className="text-sm text-amber-700">
                                        Descuento: <strong>${(discountType === 'percentage' ? selectedOrder.total * (discountAmount / 100) : discountAmount).toFixed(2)}</strong>
                                    </p>
                                    <p className="text-sm text-amber-700">
                                        Nuevo total: <strong>${(selectedOrder.total - (discountType === 'percentage' ? selectedOrder.total * (discountAmount / 100) : discountAmount)).toFixed(2)}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowDiscountModal(false)} className="flex-1">Cancelar</Button>
                            <Button onClick={handleApplyDiscount} disabled={discountAmount <= 0} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Aplicar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Summary Modal */}
            {showDailySummary && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Corte del Día</h2>
                            <button onClick={() => setShowDailySummary(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="text-center mb-6">
                            <p className="text-sm text-stone-500">{selectedDate}</p>
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between p-3 bg-emerald-50 rounded-lg">
                                <span className="text-stone-700">Total Ventas</span>
                                <span className="font-bold text-emerald-600">${stats.totalSales.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-stone-50 rounded-lg">
                                <span className="text-stone-700">Órdenes</span>
                                <span className="font-medium">{stats.orderCount}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-stone-700 flex items-center gap-2"><Wallet className="h-4 w-4" /> Efectivo</span>
                                <span className="font-medium text-green-600">${stats.cashTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-stone-700 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Tarjeta</span>
                                <span className="font-medium text-blue-600">${stats.cardTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <Button onClick={handlePrintDailySummary} className="w-full bg-emerald-600 hover:bg-emerald-700">
                            <Printer className="h-4 w-4 mr-2" /> Imprimir Corte
                        </Button>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-4 right-4 bg-stone-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
                    {toast}
                </div>
            )}
        </ManageLayout>

    );
}
