'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect, useRef } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Eye, Printer, Plus, X, Building2, Receipt, Calendar, Hash, User, MapPin, Phone, Mail, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface InvoiceItem {
    id: string;
    code: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxable: boolean;
}

interface Invoice {
    id: string;
    series: string;
    number: string;
    date: string;
    dueDate: string;
    customer: {
        name: string;
        ruc: string;
        dv: string;
        address: string;
        phone: string;
        email: string;
    };
    items: InvoiceItem[];
    paymentMethod: 'cash' | 'card' | 'transfer' | 'credit';
    notes: string;
    status: 'paid' | 'pending' | 'cancelled';
}

interface FiscalConfig {
    businessName: string;
    tradeName: string;
    ruc: string;
    dv: string;
    address: string;
    phone: string;
    email: string;
    logo: string;
    ivaRate: number;
    invoiceSeries: string;
    nextNumber: number;
    cai: string;  // Código de Autorización de Impresión
    rangeFrom: string;
    rangeTo: string;
    expirationDate: string;
}

export default function ManageInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig>({
        businessName: 'Restaurante La Casa del Sabor S.A. de C.V.',
        tradeName: 'La Casa del Sabor',
        ruc: '0801-1990-12345',
        dv: '8',
        address: 'Col. Palmira, Blvd. Morazán #123, Tegucigalpa, F.M.',
        phone: '(504) 2235-6789',
        email: 'facturacion@lacasadelsabor.hn',
        logo: '',
        ivaRate: 15,
        invoiceSeries: 'A',
        nextNumber: 1001,
        cai: 'A1B2C3-D4E5F6-G7H8I9-J0K1L2-M3N4O5-P6',
        rangeFrom: 'A-0001',
        rangeTo: 'A-5000',
        expirationDate: '2025-12-31'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newInvoice, setNewInvoice] = useState({
        customerName: '',
        customerRuc: '',
        customerAddress: '',
        customerPhone: '',
        items: [{ description: '', quantity: 1, unitPrice: 0 }]
    });
    const printRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        fetchFiscalConfig();
        fetchInvoices();
    }, []);

    const fetchFiscalConfig = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/restaurant/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const { restaurant, settings } = data;

                // Merge relational data with JSON settings
                setFiscalConfig(prev => ({
                    ...prev,
                    ...settings.fiscal, // Assume fiscal settings are nested or generic
                    businessName: restaurant.name || prev.businessName,
                    ruc: restaurant.taxId || prev.ruc,
                    address: restaurant.address || prev.address,
                    // If these are in settings, they overwrite; otherwise defaults
                    tradeName: settings.tradeName || prev.tradeName,
                    dv: settings.dv || prev.dv,
                    phone: settings.phone || prev.phone,
                    email: settings.email || prev.email,
                    logo: settings.logo || prev.logo,
                    ivaRate: settings.ivaRate || prev.ivaRate,
                    invoiceSeries: settings.invoiceSeries || prev.invoiceSeries,
                    nextNumber: settings.nextNumber || prev.nextNumber,
                    cai: settings.cai || prev.cai,
                    rangeFrom: settings.rangeFrom || prev.rangeFrom,
                    rangeTo: settings.rangeTo || prev.rangeTo,
                    expirationDate: settings.expirationDate || prev.expirationDate
                }));
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Fallback to local storage only on error
            const saved = localStorage.getItem('fiscalConfig');
            if (saved) setFiscalConfig(JSON.parse(saved));
        }
    };

    const fetchInvoices = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/restaurant/invoices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Map API response to component's Invoice format
                const mappedInvoices: Invoice[] = (data.invoices || []).map((inv: any) => ({
                    id: inv.id,
                    series: inv.invoiceNumber?.split('-')[0] || 'A',
                    number: inv.invoiceNumber?.split('-')[1] || inv.id.slice(-4),
                    date: inv.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                    dueDate: inv.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                    customer: {
                        name: inv.customerName || 'Cliente',
                        ruc: inv.customerTaxId || '',
                        dv: '',
                        address: '',
                        phone: '',
                        email: ''
                    },
                    items: [{
                        id: '1',
                        code: 'ORD',
                        description: `Orden #${inv.orderId || 'N/A'}`,
                        quantity: 1,
                        unitPrice: inv.subtotal || 0,
                        discount: 0,
                        taxable: true
                    }],
                    paymentMethod: 'card' as const,
                    notes: '',
                    status: inv.status === 'paid' ? 'paid' : inv.status === 'cancelled' ? 'cancelled' : 'pending'
                }));
                setInvoices(mappedInvoices);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    const calculateInvoiceTotals = (items: InvoiceItem[]) => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const discount = items.reduce((sum, item) => sum + item.discount, 0);
        const taxable = items.filter(i => i.taxable).reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0);
        const iva = taxable * (fiscalConfig.ivaRate / 100);
        const total = subtotal - discount + iva;
        return { subtotal, discount, taxable, iva, total };
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFiscalConfig(p => ({ ...p, logo: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const saveConfig = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            // Offline fallback
            localStorage.setItem('fiscalConfig', JSON.stringify(fiscalConfig));
            setShowConfigModal(false);
            return;
        }

        try {
            const apiUrl = getApiUrl();
            await fetch(`${apiUrl}/restaurant/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: fiscalConfig.businessName,
                    taxId: fiscalConfig.ruc,
                    address: fiscalConfig.address,
                    settings: {
                        tradeName: fiscalConfig.tradeName,
                        dv: fiscalConfig.dv,
                        phone: fiscalConfig.phone,
                        email: fiscalConfig.email,
                        logo: fiscalConfig.logo,
                        ivaRate: fiscalConfig.ivaRate,
                        invoiceSeries: fiscalConfig.invoiceSeries,
                        nextNumber: fiscalConfig.nextNumber,
                        cai: fiscalConfig.cai,
                        rangeFrom: fiscalConfig.rangeFrom,
                        rangeTo: fiscalConfig.rangeTo,
                        expirationDate: fiscalConfig.expirationDate
                    }
                })
            });
            // Update local storage just in case as backup, but API is authoritative
            localStorage.setItem('fiscalConfig', JSON.stringify(fiscalConfig));
        } catch (error) {
            console.error('Error saving config:', error);
            localStorage.setItem('fiscalConfig', JSON.stringify(fiscalConfig));
        }
        setShowConfigModal(false);
    };

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) return;

        printWindow.document.write(`<!DOCTYPE html><html><head><title>Factura ${selectedInvoice?.series}-${selectedInvoice?.number}</title>
        <style>
            @page { size: letter; margin: 15mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.4; background: white; }
            .invoice { max-width: 750px; margin: 0 auto; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 15px; border-bottom: 3px solid #059669; margin-bottom: 15px; }
            .logo-section { display: flex; align-items: center; gap: 15px; }
            .logo { max-width: 80px; max-height: 80px; object-fit: contain; }
            .logo-placeholder { width: 60px; height: 60px; background: #059669; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
            .company-info h1 { font-size: 16px; color: #059669; margin-bottom: 2px; }
            .company-info p { font-size: 10px; color: #666; }
            .invoice-type { text-align: right; }
            .invoice-type h2 { font-size: 22px; color: #059669; letter-spacing: 2px; }
            .invoice-type .number { font-size: 14px; font-weight: bold; color: #333; margin-top: 5px; }
            .invoice-type .date { font-size: 10px; color: #666; }
            .fiscal-info { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px; margin-bottom: 15px; font-size: 9px; }
            .fiscal-info .row { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
            .fiscal-info .item { flex: 1; min-width: 150px; }
            .fiscal-info .label { color: #666; font-weight: 500; }
            .fiscal-info .value { color: #333; font-family: monospace; }
            .parties { display: flex; gap: 20px; margin-bottom: 20px; }
            .party { flex: 1; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 12px; }
            .party h3 { font-size: 10px; text-transform: uppercase; color: #059669; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 5px; }
            .party .name { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 5px; }
            .party .detail { font-size: 10px; color: #666; margin-bottom: 2px; display: flex; align-items: center; gap: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th { background: #059669; color: white; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
            .items-table th:nth-child(3), .items-table th:nth-child(4), .items-table th:nth-child(5), .items-table th:nth-child(6) { text-align: right; }
            .items-table td { padding: 10px 8px; border-bottom: 1px solid #e5e5e5; font-size: 11px; }
            .items-table td:nth-child(3), .items-table td:nth-child(4), .items-table td:nth-child(5), .items-table td:nth-child(6) { text-align: right; font-family: monospace; }
            .items-table tr:nth-child(even) { background: #fafafa; }
            .items-table .code { font-family: monospace; font-size: 10px; color: #666; }
            .summary { display: flex; justify-content: space-between; gap: 30px; }
            .payment-info { flex: 1; }
            .payment-info h4 { font-size: 10px; color: #666; margin-bottom: 8px; }
            .payment-info .method { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 5px 12px; border-radius: 4px; font-size: 11px; font-weight: 500; }
            .notes { margin-top: 10px; padding: 10px; background: #fff8e1; border-radius: 4px; font-size: 10px; color: #795548; }
            .totals { width: 280px; }
            .totals .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
            .totals .row.total { background: #059669; color: white; padding: 12px; margin-top: 5px; border-radius: 6px; font-size: 14px; font-weight: bold; }
            .totals .label { color: #666; }
            .totals .value { font-family: monospace; font-weight: 500; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 9px; color: #888; }
            .footer .legal { background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
            .signature-area { display: flex; justify-content: space-around; margin-top: 40px; padding-top: 20px; }
            .signature { text-align: center; width: 200px; }
            .signature .line { border-top: 1px solid #333; margin-bottom: 5px; }
            .signature .label { font-size: 10px; color: #666; }
            @media print { 
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                .invoice { padding: 0; }
            }
        </style></head><body>${content.innerHTML}</body></html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Pagada</span>;
            case 'pending': return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Pendiente</span>;
            case 'cancelled': return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Anulada</span>;
            default: return null;
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito' };
        return labels[method] || method;
    };

    const filteredInvoices = invoices.filter(i =>
        `${i.series}-${i.number}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ManageLayout title="Facturación" subtitle="Gestión de facturas fiscales">
            {/* Toolbar */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input placeholder="Buscar factura..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-stone-200" />
                </div>
                <Button onClick={() => setShowConfigModal(true)} variant="outline"><Building2 className="h-4 w-4 mr-2" /> Config. Fiscal</Button>
                <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" /> Nueva Factura</Button>

            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total', value: invoices.length, color: 'bg-stone-100 text-stone-700' },
                    { label: 'Pagadas', value: invoices.filter(i => i.status === 'paid').length, color: 'bg-emerald-100 text-emerald-700' },
                    { label: 'Pendientes', value: invoices.filter(i => i.status === 'pending').length, color: 'bg-amber-100 text-amber-700' },
                    { label: 'Ingresos', value: `L ${invoices.filter(i => i.status === 'paid').reduce((s, i) => s + calculateInvoiceTotals(i.items).total, 0).toFixed(2)}`, color: 'bg-emerald-600 text-white' },
                ].map((s, i) => (
                    <div key={i} className={`p-4 rounded-xl ${s.color}`}>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-sm opacity-80">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Invoice List */}
            <Card className="border-stone-200">
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Factura</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Fecha</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Cliente</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">RTN</th>
                                <th className="text-right p-4 text-sm font-medium text-stone-600">Total</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Estado</th>
                                <th className="text-right p-4 text-sm font-medium text-stone-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(inv => {
                                const totals = calculateInvoiceTotals(inv.items);
                                return (
                                    <tr key={inv.id} className="border-b border-stone-100 hover:bg-stone-50">
                                        <td className="p-4 font-mono font-medium text-stone-800">{inv.series}-{inv.number}</td>
                                        <td className="p-4 text-sm text-stone-500">{inv.date}</td>
                                        <td className="p-4 font-medium text-stone-800">{inv.customer.name}</td>
                                        <td className="p-4 font-mono text-sm text-stone-500">{inv.customer.ruc}</td>
                                        <td className="p-4 text-right font-medium text-emerald-600">L {totals.total.toFixed(2)}</td>
                                        <td className="p-4">{getStatusBadge(inv.status)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => { setSelectedInvoice(inv); setShowPreview(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-4 w-4" /></button>
                                                <button onClick={() => { setSelectedInvoice(inv); setShowPreview(true); setTimeout(handlePrint, 200); }} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg"><Printer className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Create Invoice Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Nueva Factura</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Nombre del Cliente *</label>
                                    <Input value={newInvoice.customerName} onChange={(e) => setNewInvoice(p => ({ ...p, customerName: e.target.value }))} placeholder="Juan Pérez" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">RTN</label>
                                    <Input value={newInvoice.customerRuc} onChange={(e) => setNewInvoice(p => ({ ...p, customerRuc: e.target.value }))} placeholder="0801-1990-12345" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Dirección</label>
                                <Input value={newInvoice.customerAddress} onChange={(e) => setNewInvoice(p => ({ ...p, customerAddress: e.target.value }))} placeholder="Dirección del cliente" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Teléfono</label>
                                <Input value={newInvoice.customerPhone} onChange={(e) => setNewInvoice(p => ({ ...p, customerPhone: e.target.value }))} placeholder="+504 9999-9999" />
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-medium text-stone-800 mb-3">Conceptos</h3>
                                {newInvoice.items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                                        <div className="col-span-6">
                                            <Input value={item.description} onChange={(e) => {
                                                const items = [...newInvoice.items];
                                                items[idx].description = e.target.value;
                                                setNewInvoice(p => ({ ...p, items }));
                                            }} placeholder="Descripción" />
                                        </div>
                                        <div className="col-span-2">
                                            <Input type="number" value={item.quantity} onChange={(e) => {
                                                const items = [...newInvoice.items];
                                                items[idx].quantity = parseInt(e.target.value) || 1;
                                                setNewInvoice(p => ({ ...p, items }));
                                            }} placeholder="Cant." />
                                        </div>
                                        <div className="col-span-3">
                                            <Input type="number" value={item.unitPrice} onChange={(e) => {
                                                const items = [...newInvoice.items];
                                                items[idx].unitPrice = parseFloat(e.target.value) || 0;
                                                setNewInvoice(p => ({ ...p, items }));
                                            }} placeholder="Precio" />
                                        </div>
                                        <div className="col-span-1 flex items-center justify-center">
                                            {newInvoice.items.length > 1 && (
                                                <button onClick={() => {
                                                    setNewInvoice(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
                                                }} className="text-red-500 hover:text-red-700">×</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={() => setNewInvoice(p => ({ ...p, items: [...p.items, { description: '', quantity: 1, unitPrice: 0 }] }))} className="w-full mt-2">
                                    <Plus className="h-4 w-4 mr-2" /> Agregar Concepto
                                </Button>
                            </div>

                            <div className="bg-stone-50 p-4 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-600">Subtotal:</span>
                                    <span className="font-medium">L {newInvoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-stone-600">ISV ({fiscalConfig.ivaRate}%):</span>
                                    <span className="font-medium">L {(newInvoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) * fiscalConfig.ivaRate / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                                    <span>Total:</span>
                                    <span className="text-emerald-600">L {(newInvoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) * (1 + fiscalConfig.ivaRate / 100)).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancelar</Button>
                            <Button onClick={() => {
                                // For now just add to local state - in production would POST to API
                                const newInv: Invoice = {
                                    id: `local_${Date.now()}`,
                                    series: fiscalConfig.invoiceSeries,
                                    number: String(fiscalConfig.nextNumber).padStart(4, '0'),
                                    date: new Date().toISOString().split('T')[0],
                                    dueDate: new Date().toISOString().split('T')[0],
                                    customer: { name: newInvoice.customerName, ruc: newInvoice.customerRuc, dv: '', address: newInvoice.customerAddress, phone: newInvoice.customerPhone, email: '' },
                                    items: newInvoice.items.map((it, i) => ({ id: String(i), code: `ITEM${i + 1}`, description: it.description, quantity: it.quantity, unitPrice: it.unitPrice, discount: 0, taxable: true })),
                                    paymentMethod: 'cash',
                                    notes: '',
                                    status: 'pending'
                                };
                                setInvoices(prev => [newInv, ...prev]);
                                setFiscalConfig(p => ({ ...p, nextNumber: p.nextNumber + 1 }));
                                setNewInvoice({ customerName: '', customerRuc: '', customerAddress: '', customerPhone: '', items: [{ description: '', quantity: 1, unitPrice: 0 }] });
                                setShowCreateModal(false);
                            }} className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={!newInvoice.customerName || newInvoice.items.every(i => !i.description)}>
                                <Receipt className="h-4 w-4 mr-2" /> Crear Factura
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Config Modal */}

            {showConfigModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Configuración Fiscal (DGI)</h2>
                            <button onClick={() => setShowConfigModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>

                        {/* Logo */}
                        <div className="mb-6 flex items-center gap-4">
                            {fiscalConfig.logo ? <img src={fiscalConfig.logo} alt="Logo" className="w-20 h-20 object-contain border rounded-lg" /> : <div className="w-20 h-20 bg-emerald-100 rounded-lg flex items-center justify-center"><Building2 className="h-8 w-8 text-emerald-600" /></div>}
                            <div>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} id="logo-input" className="hidden" />
                                <label htmlFor="logo-input" className="cursor-pointer text-sm text-emerald-600 hover:underline">Cambiar logo</label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Razón Social</label><Input value={fiscalConfig.businessName} onChange={(e) => setFiscalConfig(p => ({ ...p, businessName: e.target.value }))} /></div>
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Nombre Comercial</label><Input value={fiscalConfig.tradeName} onChange={(e) => setFiscalConfig(p => ({ ...p, tradeName: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="col-span-2"><label className="block text-sm font-medium text-stone-700 mb-1">RTN</label><Input value={fiscalConfig.ruc} onChange={(e) => setFiscalConfig(p => ({ ...p, ruc: e.target.value }))} /></div>
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">DV</label><Input value={fiscalConfig.dv} onChange={(e) => setFiscalConfig(p => ({ ...p, dv: e.target.value }))} /></div>
                        </div>
                        <div className="mb-4"><label className="block text-sm font-medium text-stone-700 mb-1">Dirección</label><Input value={fiscalConfig.address} onChange={(e) => setFiscalConfig(p => ({ ...p, address: e.target.value }))} /></div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Teléfono</label><Input value={fiscalConfig.phone} onChange={(e) => setFiscalConfig(p => ({ ...p, phone: e.target.value }))} /></div>
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Email</label><Input value={fiscalConfig.email} onChange={(e) => setFiscalConfig(p => ({ ...p, email: e.target.value }))} /></div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <h3 className="font-medium text-stone-800 mb-3">Autorización DGI (CAI)</h3>
                            <div className="mb-4"><label className="block text-sm font-medium text-stone-700 mb-1">CAI</label><Input value={fiscalConfig.cai} onChange={(e) => setFiscalConfig(p => ({ ...p, cai: e.target.value }))} className="font-mono" /></div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div><label className="block text-sm font-medium text-stone-700 mb-1">Rango Desde</label><Input value={fiscalConfig.rangeFrom} onChange={(e) => setFiscalConfig(p => ({ ...p, rangeFrom: e.target.value }))} /></div>
                                <div><label className="block text-sm font-medium text-stone-700 mb-1">Rango Hasta</label><Input value={fiscalConfig.rangeTo} onChange={(e) => setFiscalConfig(p => ({ ...p, rangeTo: e.target.value }))} /></div>
                                <div><label className="block text-sm font-medium text-stone-700 mb-1">Fecha Límite</label><Input type="date" value={fiscalConfig.expirationDate} onChange={(e) => setFiscalConfig(p => ({ ...p, expirationDate: e.target.value }))} /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">IVA %</label><Input type="number" value={fiscalConfig.ivaRate} onChange={(e) => setFiscalConfig(p => ({ ...p, ivaRate: parseFloat(e.target.value) || 15 }))} /></div>
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Serie</label><Input value={fiscalConfig.invoiceSeries} onChange={(e) => setFiscalConfig(p => ({ ...p, invoiceSeries: e.target.value }))} /></div>
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Próximo N°</label><Input type="number" value={fiscalConfig.nextNumber} onChange={(e) => setFiscalConfig(p => ({ ...p, nextNumber: parseInt(e.target.value) || 1 }))} /></div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowConfigModal(false)} className="flex-1">Cancelar</Button>
                            <Button onClick={saveConfig} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Guardar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Professional Invoice Preview */}
            {showPreview && selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-bold text-stone-800">Factura {selectedInvoice.series}-{selectedInvoice.number}</h2>
                            <div className="flex gap-2">
                                <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700"><Printer className="h-4 w-4 mr-2" /> Imprimir / PDF</Button>
                                <button onClick={() => setShowPreview(false)} className="p-2 text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                            </div>
                        </div>

                        <div ref={printRef} className="p-8">
                            <div className="invoice">
                                {/* Header */}
                                <div className="header flex justify-between items-start pb-4 border-b-4 border-emerald-600 mb-4">
                                    <div className="logo-section flex items-center gap-4">
                                        {fiscalConfig.logo ? <img src={fiscalConfig.logo} alt="Logo" className="logo w-20 h-20 object-contain" /> : <div className="logo-placeholder w-14 h-14 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">{fiscalConfig.tradeName.charAt(0)}</div>}
                                        <div className="company-info">
                                            <h1 className="text-lg font-bold text-emerald-600">{fiscalConfig.businessName}</h1>
                                            <p className="text-xs text-stone-500">RTN: {fiscalConfig.ruc}</p>
                                            <p className="text-xs text-stone-500">{fiscalConfig.address}</p>
                                            <p className="text-xs text-stone-500">Tel: {fiscalConfig.phone} | {fiscalConfig.email}</p>
                                        </div>
                                    </div>
                                    <div className="invoice-type text-right">
                                        <h2 className="text-2xl font-bold text-emerald-600 tracking-widest">FACTURA</h2>
                                        <div className="number text-lg font-bold text-stone-800 mt-1">{selectedInvoice.series}-{selectedInvoice.number}</div>
                                        <div className="date text-xs text-stone-500 mt-1">Fecha: {selectedInvoice.date}</div>
                                        {selectedInvoice.dueDate !== selectedInvoice.date && <div className="date text-xs text-stone-500">Vence: {selectedInvoice.dueDate}</div>}
                                    </div>
                                </div>

                                {/* Fiscal Info */}
                                <div className="fiscal-info bg-stone-50 border border-stone-200 rounded-lg p-3 mb-4 text-xs">
                                    <div className="row flex justify-between flex-wrap gap-2">
                                        <div className="item"><span className="label text-stone-500">CAI: </span><span className="value font-mono text-stone-700">{fiscalConfig.cai}</span></div>
                                        <div className="item"><span className="label text-stone-500">Rango: </span><span className="value font-mono text-stone-700">{fiscalConfig.rangeFrom} al {fiscalConfig.rangeTo}</span></div>
                                        <div className="item"><span className="label text-stone-500">Fecha Límite: </span><span className="value text-stone-700">{fiscalConfig.expirationDate}</span></div>
                                    </div>
                                </div>

                                {/* Parties */}
                                <div className="parties flex gap-4 mb-4">
                                    <div className="party flex-1 bg-stone-50 border border-stone-200 rounded-lg p-3">
                                        <h3 className="text-xs uppercase text-emerald-600 font-semibold border-b pb-1 mb-2">Cliente</h3>
                                        <div className="name text-sm font-semibold text-stone-800 mb-1">{selectedInvoice.customer.name}</div>
                                        <div className="detail text-xs text-stone-500 flex items-center gap-1"><Hash className="h-3 w-3" /> RTN: {selectedInvoice.customer.ruc}</div>
                                        <div className="detail text-xs text-stone-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedInvoice.customer.address}</div>
                                        {selectedInvoice.customer.phone && <div className="detail text-xs text-stone-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedInvoice.customer.phone}</div>}
                                    </div>
                                </div>

                                {/* Items */}
                                <table className="items-table w-full border-collapse mb-4">
                                    <thead>
                                        <tr className="bg-emerald-600 text-white">
                                            <th className="p-2 text-left text-xs uppercase">Código</th>
                                            <th className="p-2 text-left text-xs uppercase">Descripción</th>
                                            <th className="p-2 text-right text-xs uppercase">Cant.</th>
                                            <th className="p-2 text-right text-xs uppercase">P. Unit.</th>
                                            <th className="p-2 text-right text-xs uppercase">Desc.</th>
                                            <th className="p-2 text-right text-xs uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.items.map((item, i) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                                                <td className="p-2 text-xs font-mono text-stone-500">{item.code}</td>
                                                <td className="p-2 text-sm text-stone-800">{item.description}</td>
                                                <td className="p-2 text-right text-sm font-mono">{item.quantity}</td>
                                                <td className="p-2 text-right text-sm font-mono">L {item.unitPrice.toFixed(2)}</td>
                                                <td className="p-2 text-right text-sm font-mono text-red-600">{item.discount > 0 ? `-L ${item.discount.toFixed(2)}` : '—'}</td>
                                                <td className="p-2 text-right text-sm font-mono font-medium">L {(item.quantity * item.unitPrice - item.discount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Summary */}
                                {(() => {
                                    const totals = calculateInvoiceTotals(selectedInvoice.items);
                                    return (
                                        <div className="summary flex justify-between gap-8">
                                            <div className="payment-info flex-1">
                                                <h4 className="text-xs text-stone-500 mb-2">Condiciones de Pago</h4>
                                                <div className="method inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-sm font-medium">{getPaymentMethodLabel(selectedInvoice.paymentMethod)}</div>
                                                {selectedInvoice.notes && <div className="notes mt-3 p-3 bg-amber-50 rounded-lg text-xs text-amber-800">📝 {selectedInvoice.notes}</div>}
                                            </div>
                                            <div className="totals w-64">
                                                <div className="row flex justify-between py-1 border-b border-stone-100"><span className="label text-stone-500">Subtotal:</span><span className="value font-mono">L {totals.subtotal.toFixed(2)}</span></div>
                                                {totals.discount > 0 && <div className="row flex justify-between py-1 border-b border-stone-100"><span className="label text-stone-500">Descuento:</span><span className="value font-mono text-red-600">-L {totals.discount.toFixed(2)}</span></div>}
                                                <div className="row flex justify-between py-1 border-b border-stone-100"><span className="label text-stone-500">Importe Gravado:</span><span className="value font-mono">L {totals.taxable.toFixed(2)}</span></div>
                                                <div className="row flex justify-between py-1 border-b border-stone-100"><span className="label text-stone-500">ISV ({fiscalConfig.ivaRate}%):</span><span className="value font-mono">L {totals.iva.toFixed(2)}</span></div>
                                                <div className="row total flex justify-between py-3 px-3 mt-2 bg-emerald-600 text-white rounded-lg"><span className="text-sm font-bold">TOTAL:</span><span className="text-lg font-bold font-mono">L {totals.total.toFixed(2)}</span></div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Footer */}
                                <div className="footer mt-8 pt-4 border-t border-stone-200">
                                    {/* QR Code for client access */}
                                    <div className="flex justify-center mb-4">
                                        <div className="text-center">
                                            <QRCodeSVG
                                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invoice/view/${selectedInvoice.id}`}
                                                size={80}
                                                level="M"
                                            />
                                            <p className="text-xs text-stone-400 mt-1">Escanea para ver tu factura</p>
                                        </div>
                                    </div>
                                    <div className="legal bg-stone-100 p-3 rounded-lg mb-3 text-xs text-stone-600 text-center">
                                        <p>Original: Cliente | Copia: Emisor | La factura es beneficio de todos: ¡Exíjala!</p>
                                        <p className="font-medium mt-1">Este documento ha sido emitido conforme a las disposiciones legales vigentes.</p>
                                    </div>
                                    <p className="text-xs text-stone-400 text-center">Gracias por su preferencia | {fiscalConfig.tradeName}</p>
                                </div>

                                {/* Signatures */}
                                <div className="signature-area flex justify-around mt-10 pt-6">
                                    <div className="signature text-center w-48">
                                        <div className="line border-t border-stone-400 mb-1"></div>
                                        <div className="label text-xs text-stone-500">Recibido por</div>
                                    </div>
                                    <div className="signature text-center w-48">
                                        <div className="line border-t border-stone-400 mb-1"></div>
                                        <div className="label text-xs text-stone-500">Entregado por</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ManageLayout>
    );
}
