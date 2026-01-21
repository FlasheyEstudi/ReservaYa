'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Calendar, Download, FileText, ArrowUpCircle, ArrowDownCircle, RefreshCw, Filter } from 'lucide-react';

interface JournalEntry {
    id: string;
    date: string;
    time: string;
    type: 'sale' | 'expense' | 'adjustment' | 'inventory';
    description: string;
    reference: string;
    debit: number;
    credit: number;
    balance: number;
    account: string;
}

export default function ManageJournal() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        fetchEntries();
    }, [dateFrom, dateTo]);

    const fetchEntries = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/restaurant/journal?limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error fetching journal');

            const data = await res.json();

            // Convert activity logs to journal entries
            let balance = 0;
            const journalEntries: JournalEntry[] = (data.entries || []).map((e: any) => {
                // Determine type and amounts based on action
                let type: JournalEntry['type'] = 'adjustment';
                let debit = 0;
                let credit = 0;

                if (e.action.includes('order') || e.action.includes('sale')) {
                    type = 'sale';
                    debit = e.metadata?.amount || 0;
                } else if (e.action.includes('expense') || e.action.includes('payment')) {
                    type = 'expense';
                    credit = e.metadata?.amount || 0;
                } else if (e.action.includes('inventory')) {
                    type = 'inventory';
                }

                balance += debit - credit;

                const date = new Date(e.createdAt);
                return {
                    id: e.id,
                    date: date.toISOString().split('T')[0],
                    time: date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                    type,
                    description: e.description,
                    reference: e.action,
                    debit,
                    credit,
                    balance,
                    account: e.employee?.name || 'Sistema'
                };
            });

            setEntries(journalEntries);
        } catch (error) {
            console.error('Error fetching journal:', error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'sale': return <ArrowUpCircle className="h-5 w-5 text-emerald-500" />;
            case 'expense': return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
            case 'inventory': return <RefreshCw className="h-5 w-5 text-amber-500" />;
            default: return <FileText className="h-5 w-5 text-stone-400" />;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'sale': return <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Venta</span>;
            case 'expense': return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Gasto</span>;
            case 'inventory': return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Inventario</span>;
            default: return <span className="px-2 py-1 rounded-full text-xs bg-stone-100 text-stone-700">Ajuste</span>;
        }
    };

    const handleExportCSV = () => {
        const headers = ['Fecha', 'Hora', 'Tipo', 'Descripción', 'Referencia', 'Débito', 'Crédito', 'Saldo', 'Cuenta'];
        const rows = entries.map(e => [e.date, e.time, e.type, e.description, e.reference, e.debit, e.credit, e.balance, e.account]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `libro-diario-${dateFrom}-${dateTo}.csv`;
        a.click();
    };

    const filteredEntries = filterType === 'all' ? entries : entries.filter(e => e.type === filterType);
    const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
    const netBalance = totalDebits - totalCredits;

    return (
        <ManageLayout title="Libro Diario" subtitle="Registro contable de transacciones">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-stone-400" />
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40 border-stone-200" />
                    <span className="text-stone-400">—</span>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40 border-stone-200" />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-stone-200 rounded-lg text-sm">
                    <option value="all">Todos los tipos</option>
                    <option value="sale">Ventas</option>
                    <option value="expense">Gastos</option>
                    <option value="inventory">Inventario</option>
                </select>
                <Button onClick={handleExportCSV} variant="outline" className="ml-auto">
                    <Download className="h-4 w-4 mr-2" /> Exportar CSV
                </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700">
                    <p className="text-2xl font-bold">${totalDebits.toFixed(2)}</p>
                    <p className="text-sm">Total Débitos</p>
                </div>
                <div className="p-4 rounded-xl bg-red-100 text-red-700">
                    <p className="text-2xl font-bold">${totalCredits.toFixed(2)}</p>
                    <p className="text-sm">Total Créditos</p>
                </div>
                <div className={`p-4 rounded-xl ${netBalance >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    <p className="text-2xl font-bold">${netBalance.toFixed(2)}</p>
                    <p className="text-sm">Balance Neto</p>
                </div>
                <div className="p-4 rounded-xl bg-stone-100 text-stone-700">
                    <p className="text-2xl font-bold">{entries.length}</p>
                    <p className="text-sm">Movimientos</p>
                </div>
            </div>

            {/* Journal Table */}
            <Card className="border-stone-200">
                <CardHeader className="border-b border-stone-100">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5 text-emerald-600" />
                        Movimientos del Período
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Fecha/Hora</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Tipo</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Descripción</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Referencia</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Cuenta</th>
                                <th className="text-right p-4 text-sm font-medium text-stone-600">Débito</th>
                                <th className="text-right p-4 text-sm font-medium text-stone-600">Crédito</th>
                                <th className="text-right p-4 text-sm font-medium text-stone-600">Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-stone-400">Sin movimientos en este período</td></tr>
                            ) : (
                                filteredEntries.map(e => (
                                    <tr key={e.id} className="border-b border-stone-100 hover:bg-stone-50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {getTypeIcon(e.type)}
                                                <div>
                                                    <p className="font-medium text-stone-800">{e.date}</p>
                                                    <p className="text-xs text-stone-400">{e.time}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">{getTypeBadge(e.type)}</td>
                                        <td className="p-4 text-stone-700">{e.description}</td>
                                        <td className="p-4 font-mono text-sm text-stone-500">{e.reference}</td>
                                        <td className="p-4 text-sm text-stone-500">{e.account}</td>
                                        <td className="p-4 text-right font-medium text-emerald-600">{e.debit > 0 ? `$${e.debit.toFixed(2)}` : '—'}</td>
                                        <td className="p-4 text-right font-medium text-red-600">{e.credit > 0 ? `$${e.credit.toFixed(2)}` : '—'}</td>
                                        <td className={`p-4 text-right font-bold ${e.balance >= 0 ? 'text-stone-800' : 'text-red-600'}`}>${e.balance.toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-stone-100">
                            <tr>
                                <td colSpan={5} className="p-4 font-bold text-stone-800">TOTALES</td>
                                <td className="p-4 text-right font-bold text-emerald-600">${totalDebits.toFixed(2)}</td>
                                <td className="p-4 text-right font-bold text-red-600">${totalCredits.toFixed(2)}</td>
                                <td className="p-4 text-right font-bold text-stone-800">${netBalance.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </CardContent>
            </Card>
        </ManageLayout>
    );
}
