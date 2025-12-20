'use client';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, List, Clock, Users, CheckCircle, XCircle, AlertCircle, Search, ChevronLeft, ChevronRight, X, Edit, UserCheck, UserX } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Reservation {
    id: string;
    date: string;
    time: string;
    partySize: number;
    status: 'confirmed' | 'seated' | 'cancelled' | 'no_show';
    customerName: string;
    customerPhone: string;
    notes: string | null;
    tableNumber: string | null;
}

export default function ManageReservations() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        fetchReservations();
    }, [selectedDate]);

    const fetchReservations = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/reservations?date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map API snake_case fields to frontend camelCase format
                const mappedReservations = (data.reservations || []).map((r: any) => ({
                    id: r.id,
                    date: r.reservation_time?.split('T')[0] || r.date,
                    time: r.reservation_time ? new Date(r.reservation_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : r.time,
                    partySize: r.party_size || r.partySize || 0,
                    status: r.status,
                    customerName: r.user_name || r.customerName || 'Cliente',
                    customerPhone: r.user_phone || r.customerPhone || '',
                    notes: r.notes || null,
                    tableNumber: r.table_number || r.tableNumber || null
                }));
                setReservations(mappedReservations);
            }
        } catch (err) {
            console.error('Reservations fetch error:', err);
            // No fallback mock data - show empty state
        } finally {
            setLoading(false);
        }
    };


    const handleCheckIn = (reservation: Reservation) => {
        setReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: 'seated' as const, tableNumber: 'T1' } : r));
        setSelectedReservation(null);
    };

    const handleNoShow = (reservation: Reservation) => {
        if (confirm('¿Marcar como No-Show?')) {
            setReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: 'no_show' as const } : r));
            setSelectedReservation(null);
        }
    };

    const handleCancel = (reservation: Reservation) => {
        if (confirm('¿Cancelar esta reserva?')) {
            setReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: 'cancelled' as const } : r));
            setSelectedReservation(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">Confirmada</span>;
            case 'seated': return <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Sentado</span>;
            case 'cancelled': return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Cancelada</span>;
            case 'no_show': return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">No Show</span>;
            default: return null;
        }
    };

    const filteredReservations = reservations.filter(r => filterStatus === 'all' || r.status === filterStatus);

    const stats = {
        total: reservations.length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        seated: reservations.filter(r => r.status === 'seated').length,
        noShow: reservations.filter(r => r.status === 'no_show').length,
    };

    return (
        <ManageLayout title="Reservaciones" subtitle="Gestiona las reservas del día">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total', value: stats.total, color: 'bg-stone-100 text-stone-700' },
                    { label: 'Pendientes', value: stats.confirmed, color: 'bg-blue-100 text-blue-700' },
                    { label: 'Sentados', value: stats.seated, color: 'bg-emerald-100 text-emerald-700' },
                    { label: 'No Show', value: stats.noShow, color: 'bg-amber-100 text-amber-700' },
                ].map((stat, i) => (
                    <div key={i} className={`p-4 rounded-xl ${stat.color}`}>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedDate(new Date(new Date(selectedDate).getTime() - 86400000).toISOString().split('T')[0])} className="p-2 hover:bg-stone-100 rounded-lg">
                        <ChevronLeft className="h-5 w-5 text-stone-600" />
                    </button>
                    <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" />
                    <button onClick={() => setSelectedDate(new Date(new Date(selectedDate).getTime() + 86400000).toISOString().split('T')[0])} className="p-2 hover:bg-stone-100 rounded-lg">
                        <ChevronRight className="h-5 w-5 text-stone-600" />
                    </button>
                </div>
                <div className="flex gap-2 ml-auto">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-stone-200 rounded-lg text-sm">
                        <option value="all">Todos los estados</option>
                        <option value="confirmed">Confirmadas</option>
                        <option value="seated">Sentados</option>
                        <option value="no_show">No Show</option>
                    </select>
                    <div className="flex border border-stone-200 rounded-lg overflow-hidden">
                        <button onClick={() => setView('list')} className={`px-3 py-2 ${view === 'list' ? 'bg-emerald-50 text-emerald-600' : 'text-stone-500'}`}>
                            <List className="h-4 w-4" />
                        </button>
                        <button onClick={() => setView('calendar')} className={`px-3 py-2 ${view === 'calendar' ? 'bg-emerald-50 text-emerald-600' : 'text-stone-500'}`}>
                            <CalendarDays className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* List View */}
            {view === 'list' && (
                <Card className="border-stone-200">
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead className="bg-stone-50 border-b border-stone-200">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-stone-600">Hora</th>
                                    <th className="text-left p-4 text-sm font-medium text-stone-600">Cliente</th>
                                    <th className="text-left p-4 text-sm font-medium text-stone-600">Personas</th>
                                    <th className="text-left p-4 text-sm font-medium text-stone-600">Mesa</th>
                                    <th className="text-left p-4 text-sm font-medium text-stone-600">Estado</th>
                                    <th className="text-left p-4 text-sm font-medium text-stone-600">Notas</th>
                                    <th className="text-right p-4 text-sm font-medium text-stone-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-stone-400">Cargando...</td></tr>
                                ) : filteredReservations.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-stone-400">Sin reservaciones para esta fecha</td></tr>
                                ) : (
                                    filteredReservations.map(r => (
                                        <tr key={r.id} className="border-b border-stone-100 hover:bg-stone-50">
                                            <td className="p-4"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-stone-400" />{r.time}</div></td>
                                            <td className="p-4"><p className="font-medium text-stone-800">{r.customerName}</p><p className="text-xs text-stone-400">{r.customerPhone}</p></td>
                                            <td className="p-4"><div className="flex items-center gap-1"><Users className="h-4 w-4 text-stone-400" />{r.partySize}</div></td>
                                            <td className="p-4">{r.tableNumber || <span className="text-stone-400">—</span>}</td>
                                            <td className="p-4">{getStatusBadge(r.status)}</td>
                                            <td className="p-4"><span className="text-sm text-stone-500">{r.notes || '—'}</span></td>
                                            <td className="p-4 text-right">
                                                {r.status === 'confirmed' && (
                                                    <div className="flex gap-1 justify-end">
                                                        <button onClick={() => handleCheckIn(r)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Check-in">
                                                            <UserCheck className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleNoShow(r)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="No-Show">
                                                            <UserX className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleCancel(r)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Cancelar">
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Calendar View Placeholder */}
            {view === 'calendar' && (
                <Card className="border-stone-200">
                    <CardContent className="p-12 text-center">
                        <CalendarDays className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                        <p className="text-stone-500">Vista de calendario próximamente</p>
                    </CardContent>
                </Card>
            )}
        </ManageLayout>
    );
}
