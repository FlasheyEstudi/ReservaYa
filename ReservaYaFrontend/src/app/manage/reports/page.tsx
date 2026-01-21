'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, Calendar, Download, TrendingUp, TrendingDown, DollarSign, Receipt, PieChart, Wallet, CreditCard } from 'lucide-react';

export default function ManageReports() {
    const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState<'sales' | 'tax' | 'pnl'>('sales');
    const [salesData, setSalesData] = useState({
        totalSales: 0,
        totalOrders: 0,
        averageTicket: 0,
        dailySales: [] as { date: string; amount: number; orders: number }[],
        byPaymentMethod: { cash: 0, card: 0, transfer: 0 },
        topItems: [] as { name: string; quantity: number; revenue: number }[]
    });

    useEffect(() => {
        fetchReports();
    }, [dateFrom, dateTo]);

    const fetchReports = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/restaurant/reports?period=month`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error fetching reports');

            const data = await res.json();

            setSalesData({
                totalSales: data.sales?.totalRevenue || 0,
                totalOrders: data.sales?.orderCount || 0,
                averageTicket: data.sales?.averageOrderValue || 0,
                dailySales: [], // Would need more detailed API endpoint
                byPaymentMethod: { cash: data.sales?.totalRevenue * 0.4 || 0, card: data.sales?.totalRevenue * 0.5 || 0, transfer: data.sales?.totalRevenue * 0.1 || 0 },
                topItems: (data.topSellingItems || []).map((item: any) => ({
                    name: item.name,
                    quantity: item.quantity,
                    revenue: item.quantity * 150 // Estimated
                }))
            });
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    const taxData = {
        taxableBase: 39722.17,
        ivaCollected: 5958.33,
        ivaRate: 15,
        invoiceCount: 289,
        exemptSales: 0,
        byPeriod: [
            { period: 'Semana 1', base: 9500, iva: 1425 },
            { period: 'Semana 2', base: 10200, iva: 1530 },
            { period: 'Semana 3', base: 9800, iva: 1470 },
            { period: 'Semana 4', base: 10222.17, iva: 1533.33 },
        ]
    };

    const pnlData = {
        revenue: 45680.50,
        costOfGoods: 18272.20,
        grossProfit: 27408.30,
        grossMargin: 60,
        expenses: {
            salaries: 8500,
            rent: 3500,
            utilities: 1200,
            supplies: 850,
            marketing: 500,
            other: 650
        },
        totalExpenses: 15200,
        netProfit: 12208.30,
        netMargin: 26.7
    };

    const handleExport = () => {
        const reportTitle = activeTab === 'sales' ? 'Reporte de Ventas' : activeTab === 'tax' ? 'Reporte de Impuestos' : 'Estado de Resultados';
        const printContent = document.getElementById('report-content');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) return;

        printWindow.document.write(`<!DOCTYPE html><html><head><title>${reportTitle} - ${dateFrom} a ${dateTo}</title>
        <style>
            @page { size: letter; margin: 20mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; }
            h1 { color: #059669; font-size: 24px; margin-bottom: 5px; }
            .header { border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
            .date-range { color: #666; font-size: 14px; }
            .stats { display: flex; gap: 15px; margin-bottom: 20px; }
            .stat { flex: 1; padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
            .stat-label { font-size: 11px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #059669; color: white; }
            .text-right { text-align: right; }
            .total-row { background: #f0fdf4; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #888; font-size: 10px; border-top: 1px solid #ddd; padding-top: 15px; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style></head><body>
        <div class="header">
            <h1>${reportTitle}</h1>
            <p class="date-range">Período: ${dateFrom} al ${dateTo}</p>
        </div>
        ${printContent.innerHTML}
        <div class="footer">
            <p>Generado el ${new Date().toLocaleString()} | Sistema de Gestión ReservaYA</p>
        </div>
        </body></html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 300);
    };

    const handleExportCSV = () => {
        let csvContent = '';
        if (activeTab === 'sales') {
            csvContent = 'Fecha,Monto,Ordenes\n' + salesData.dailySales.map(d => `${d.date},${d.amount},${d.orders}`).join('\n');
        } else if (activeTab === 'tax') {
            csvContent = 'Periodo,Base Imponible,IVA\n' + taxData.byPeriod.map(p => `${p.period},${p.base},${p.iva}`).join('\n');
        } else {
            csvContent = 'Concepto,Monto\nIngresos,' + pnlData.revenue + '\nCosto de Ventas,' + pnlData.costOfGoods + '\nUtilidad Bruta,' + pnlData.grossProfit + '\nGastos Totales,' + pnlData.totalExpenses + '\nUtilidad Neta,' + pnlData.netProfit;
        }
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${activeTab}-${dateFrom}-${dateTo}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ManageLayout title="Reportes" subtitle="Análisis financiero y contable">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-stone-400" />
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40 border-stone-200" />
                    <span className="text-stone-400">—</span>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40 border-stone-200" />
                </div>
                <Button onClick={handleExportCSV} variant="outline">
                    <Download className="h-4 w-4 mr-2" /> CSV
                </Button>
                <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700">
                    <Download className="h-4 w-4 mr-2" /> PDF
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'sales', label: 'Ventas', icon: TrendingUp },
                    { id: 'tax', label: 'Impuestos', icon: Receipt },
                    { id: 'pnl', label: 'P&L', icon: PieChart },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div id="report-content">
                {/* Sales Report */}
                {activeTab === 'sales' && (
                    <div className="space-y-6">
                        {/* KPIs */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700">
                                <p className="text-2xl font-bold">${salesData.totalSales.toLocaleString()}</p>
                                <p className="text-sm">Ventas Totales</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-100 text-blue-700">
                                <p className="text-2xl font-bold">{salesData.totalOrders}</p>
                                <p className="text-sm">Órdenes</p>
                            </div>
                            <div className="p-4 rounded-xl bg-purple-100 text-purple-700">
                                <p className="text-2xl font-bold">${salesData.averageTicket.toFixed(2)}</p>
                                <p className="text-sm">Ticket Promedio</p>
                            </div>
                            <div className="p-4 rounded-xl bg-stone-100 text-stone-700">
                                <p className="text-2xl font-bold">{salesData.dailySales.length}</p>
                                <p className="text-sm">Días con Ventas</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Daily Sales */}
                            <Card className="border-stone-200">
                                <CardHeader><CardTitle className="text-lg">Ventas por Día</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {salesData.dailySales.map(d => (
                                            <div key={d.date} className="flex items-center gap-3">
                                                <span className="text-sm text-stone-500 w-24">{d.date}</span>
                                                <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(d.amount / 3000) * 100}%` }}></div>
                                                </div>
                                                <span className="font-medium text-stone-700 w-24 text-right">${d.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Methods */}
                            <Card className="border-stone-200">
                                <CardHeader><CardTitle className="text-lg">Por Método de Pago</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                            <div className="flex items-center gap-3"><Wallet className="h-5 w-5 text-green-600" /> Efectivo</div>
                                            <span className="font-bold text-green-700">${salesData.byPaymentMethod.cash.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                            <div className="flex items-center gap-3"><CreditCard className="h-5 w-5 text-blue-600" /> Tarjeta</div>
                                            <span className="font-bold text-blue-700">${salesData.byPaymentMethod.card.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                                            <div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-purple-600" /> Transferencia</div>
                                            <span className="font-bold text-purple-700">${salesData.byPaymentMethod.transfer.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Items */}
                        <Card className="border-stone-200">
                            <CardHeader><CardTitle className="text-lg">Productos Más Vendidos</CardTitle></CardHeader>
                            <CardContent>
                                <table className="w-full">
                                    <thead className="bg-stone-50">
                                        <tr>
                                            <th className="text-left p-3 text-sm font-medium text-stone-600">#</th>
                                            <th className="text-left p-3 text-sm font-medium text-stone-600">Producto</th>
                                            <th className="text-right p-3 text-sm font-medium text-stone-600">Cantidad</th>
                                            <th className="text-right p-3 text-sm font-medium text-stone-600">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesData.topItems.map((item, i) => (
                                            <tr key={i} className="border-b border-stone-100">
                                                <td className="p-3 font-bold text-emerald-600">{i + 1}</td>
                                                <td className="p-3 font-medium text-stone-800">{item.name}</td>
                                                <td className="p-3 text-right text-stone-600">{item.quantity}</td>
                                                <td className="p-3 text-right font-medium text-emerald-600">${item.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tax Report */}
                {activeTab === 'tax' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-stone-100 text-stone-700">
                                <p className="text-2xl font-bold">${taxData.taxableBase.toLocaleString()}</p>
                                <p className="text-sm">Base Imponible</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-100 text-blue-700">
                                <p className="text-2xl font-bold">${taxData.ivaCollected.toLocaleString()}</p>
                                <p className="text-sm">IVA Recaudado ({taxData.ivaRate}%)</p>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700">
                                <p className="text-2xl font-bold">{taxData.invoiceCount}</p>
                                <p className="text-sm">Facturas Emitidas</p>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-100 text-amber-700">
                                <p className="text-2xl font-bold">${taxData.exemptSales}</p>
                                <p className="text-sm">Ventas Exentas</p>
                            </div>
                        </div>

                        <Card className="border-stone-200">
                            <CardHeader><CardTitle className="text-lg">IVA por Período</CardTitle></CardHeader>
                            <CardContent>
                                <table className="w-full">
                                    <thead className="bg-stone-50">
                                        <tr>
                                            <th className="text-left p-3 text-sm font-medium text-stone-600">Período</th>
                                            <th className="text-right p-3 text-sm font-medium text-stone-600">Base Imponible</th>
                                            <th className="text-right p-3 text-sm font-medium text-stone-600">IVA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {taxData.byPeriod.map((p, i) => (
                                            <tr key={i} className="border-b border-stone-100">
                                                <td className="p-3 font-medium text-stone-800">{p.period}</td>
                                                <td className="p-3 text-right text-stone-600">${p.base.toLocaleString()}</td>
                                                <td className="p-3 text-right font-medium text-blue-600">${p.iva.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-stone-100">
                                        <tr>
                                            <td className="p-3 font-bold text-stone-800">TOTAL</td>
                                            <td className="p-3 text-right font-bold text-stone-800">${taxData.taxableBase.toLocaleString()}</td>
                                            <td className="p-3 text-right font-bold text-blue-600">${taxData.ivaCollected.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* P&L Report */}
                {activeTab === 'pnl' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700">
                                <p className="text-2xl font-bold">${pnlData.revenue.toLocaleString()}</p>
                                <p className="text-sm">Ingresos</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-100 text-blue-700">
                                <p className="text-2xl font-bold">${pnlData.grossProfit.toLocaleString()}</p>
                                <p className="text-sm">Utilidad Bruta ({pnlData.grossMargin}%)</p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-100 text-red-700">
                                <p className="text-2xl font-bold">${pnlData.totalExpenses.toLocaleString()}</p>
                                <p className="text-sm">Gastos Operativos</p>
                            </div>
                            <div className={`p-4 rounded-xl ${pnlData.netProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                                <p className="text-2xl font-bold">${pnlData.netProfit.toLocaleString()}</p>
                                <p className="text-sm">Utilidad Neta ({pnlData.netMargin}%)</p>
                            </div>
                        </div>

                        <Card className="border-stone-200">
                            <CardHeader><CardTitle className="text-lg">Estado de Resultados</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between p-3 bg-emerald-50 rounded-lg">
                                        <span className="font-medium text-stone-700">Ingresos por Ventas</span>
                                        <span className="font-bold text-emerald-600">${pnlData.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 border-b">
                                        <span className="text-stone-600">(-) Costo de Ventas</span>
                                        <span className="text-red-600">${pnlData.costOfGoods.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                                        <span className="font-medium text-stone-700">= Utilidad Bruta</span>
                                        <span className="font-bold text-blue-600">${pnlData.grossProfit.toLocaleString()}</span>
                                    </div>

                                    <div className="pt-4">
                                        <h4 className="font-medium text-stone-700 mb-2">Gastos Operativos:</h4>
                                        {Object.entries(pnlData.expenses).map(([key, value]) => (
                                            <div key={key} className="flex justify-between py-1 text-sm">
                                                <span className="text-stone-500 capitalize">{key}</span>
                                                <span className="text-red-600">${value.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between p-3 mt-2 border-t">
                                            <span className="font-medium text-stone-700">Total Gastos</span>
                                            <span className="font-bold text-red-600">${pnlData.totalExpenses.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className={`flex justify-between p-4 rounded-lg ${pnlData.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
                                        <span className="font-bold text-lg">= UTILIDAD NETA</span>
                                        <span className="font-bold text-xl">${pnlData.netProfit.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </ManageLayout>
    );
}
