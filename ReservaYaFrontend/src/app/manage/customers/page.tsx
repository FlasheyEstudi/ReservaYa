'use client';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, User, Phone, Mail, CalendarDays, Ban, Star, MessageSquare, X, Save, Eye } from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    totalVisits: number;
    lastVisit: string | null;
    noShows: number;
    isVIP: boolean;
    isBlocked: boolean;
    notes: string;
}

export default function ManageCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [editNotes, setEditNotes] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/restaurant/customers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error fetching customers');

            const data = await res.json();
            setCustomers(data.customers || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleVIP = async (customer: Customer) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/restaurant/customers?id=${customer.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isVIP: !customer.isVIP })
            });

            if (res.ok) {
                setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, isVIP: !c.isVIP } : c));
            }
        } catch (error) {
            console.error('Error toggling VIP:', error);
        }
    };

    const toggleBlock = async (customer: Customer) => {
        const action = customer.isBlocked ? 'desbloquear' : 'bloquear';
        if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${customer.name}?`)) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/restaurant/customers?id=${customer.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isBlocked: !customer.isBlocked })
            });

            if (res.ok) {
                setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, isBlocked: !c.isBlocked } : c));
            }
        } catch (error) {
            console.error('Error toggling block:', error);
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedCustomer) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/restaurant/customers?id=${selectedCustomer.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes: editNotes })
            });

            if (res.ok) {
                setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, notes: editNotes } : c));
                setSelectedCustomer(null);
            }
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <ManageLayout title="Clientes" subtitle="Base de datos de clientes y preferencias">
            {/* Toolbar */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input placeholder="Buscar por nombre, email o teléfono..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-stone-200" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-stone-100 text-stone-700">
                    <p className="text-2xl font-bold">{customers.length}</p>
                    <p className="text-sm">Total Clientes</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-100 text-amber-700">
                    <p className="text-2xl font-bold">{customers.filter(c => c.isVIP).length}</p>
                    <p className="text-sm">VIP</p>
                </div>
                <div className="p-4 rounded-xl bg-red-100 text-red-700">
                    <p className="text-2xl font-bold">{customers.filter(c => c.isBlocked).length}</p>
                    <p className="text-sm">Bloqueados</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700">
                    <p className="text-2xl font-bold">{customers.reduce((acc, c) => acc + c.totalVisits, 0)}</p>
                    <p className="text-sm">Visitas Totales</p>
                </div>
            </div>

            {/* Customer List */}
            <Card className="border-stone-200">
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Cliente</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Contacto</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Visitas</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Última Visita</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">No-Shows</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Estado</th>
                                <th className="text-right p-4 text-sm font-medium text-stone-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-stone-400">Cargando...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-stone-400">Sin clientes</td></tr>
                            ) : (
                                filteredCustomers.map(c => (
                                    <tr key={c.id} className={`border-b border-stone-100 ${c.isBlocked ? 'bg-red-50' : 'hover:bg-stone-50'}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.isVIP ? 'bg-amber-100' : 'bg-stone-100'}`}>
                                                    {c.isVIP ? <Star className="h-5 w-5 text-amber-600" /> : <User className="h-5 w-5 text-stone-400" />}
                                                </div>
                                                <span className="font-medium text-stone-800">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-stone-600 flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</p>
                                            <p className="text-sm text-stone-400 flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</p>
                                        </td>
                                        <td className="p-4 font-medium text-emerald-600">{c.totalVisits}</td>
                                        <td className="p-4 text-sm text-stone-500">{c.lastVisit || '—'}</td>
                                        <td className="p-4"><span className={`${c.noShows > 1 ? 'text-red-600 font-medium' : 'text-stone-400'}`}>{c.noShows}</span></td>
                                        <td className="p-4">
                                            {c.isBlocked && <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Bloqueado</span>}
                                            {c.isVIP && !c.isBlocked && <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">VIP</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => { setSelectedCustomer(c); setEditNotes(c.notes); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver/Editar Notas">
                                                    <MessageSquare className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => toggleVIP(c)} className={`p-2 rounded-lg ${c.isVIP ? 'text-amber-600 hover:bg-amber-50' : 'text-stone-400 hover:bg-stone-100'}`} title={c.isVIP ? 'Quitar VIP' : 'Marcar VIP'}>
                                                    <Star className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => toggleBlock(c)} className={`p-2 rounded-lg ${c.isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'}`} title={c.isBlocked ? 'Desbloquear' : 'Bloquear'}>
                                                    <Ban className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Notes Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Notas de Cliente</h2>
                            <button onClick={() => setSelectedCustomer(null)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="mb-4">
                            <p className="font-medium text-stone-800">{selectedCustomer.name}</p>
                            <p className="text-sm text-stone-500">{selectedCustomer.email}</p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-700 mb-2">Notas Privadas</label>
                            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full h-32 p-3 border border-stone-200 rounded-lg text-sm resize-none" placeholder="Preferencias, alergias, notas especiales..." />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setSelectedCustomer(null)} className="flex-1">Cancelar</Button>
                            <Button onClick={handleSaveNotes} className="flex-1 bg-emerald-600 hover:bg-emerald-700"><Save className="h-4 w-4 mr-2" /> Guardar</Button>
                        </div>
                    </div>
                </div>
            )}
        </ManageLayout>
    );
}
