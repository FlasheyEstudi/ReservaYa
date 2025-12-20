'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Search, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Table {
    id: string;
    number: string;
    capacity: number;
    status: string;
    restaurant: { id: string; name: string; businessCode: string };
    currentReservation: {
        id: string;
        reservationTime: string;
        partySize: number;
        status: string;
        user: { fullName: string | null; email: string };
    } | null;
    reservationsToday: number;
}

interface Stats {
    total: number;
    available: number;
    occupied: number;
    reserved: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function AdminTables() {
    const router = useRouter();
    const [tables, setTables] = useState<Table[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, available: 0, occupied: 0, reserved: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (!token || userRole !== 'ADMIN') {
            router.push('/auth/login');
            return;
        }

        fetchTables(token);
    }, [router]);

    const fetchTables = async (token: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/tables`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTables(data.tables || []);
                setStats(data.stats || { total: 0, available: 0, occupied: 0, reserved: 0 });
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTables = tables.filter(t => {
        const matchesSearch = t.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.number || '').toString().includes(searchTerm);

        let matchesStatus = true;
        if (filterStatus === 'available') {
            // Available = status is 'free' AND no reservations today
            matchesStatus = t.status === 'free' && t.reservationsToday === 0;
        } else if (filterStatus === 'reserved') {
            // Reserved = has reservations today
            matchesStatus = t.reservationsToday > 0;
        } else if (filterStatus === 'occupied') {
            // Occupied = status is 'occupied'
            matchesStatus = t.status === 'occupied';
        }
        // 'all' shows everything

        return matchesSearch && matchesStatus;
    });

    // Group by restaurant
    const groupedTables = filteredTables.reduce((acc, table) => {
        const key = table.restaurant.id;
        if (!acc[key]) {
            acc[key] = { restaurant: table.restaurant, tables: [] };
        }
        acc[key].tables.push(table);
        return acc;
    }, {} as Record<string, { restaurant: Table['restaurant']; tables: Table[] }>);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <AdminLayout title="Mesas" subtitle="Vista de mesas disponibles y reservadas">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <p className="text-2xl font-semibold text-stone-800">{stats.total}</p>
                        <p className="text-stone-500 text-sm">Total Mesas</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <p className="text-2xl font-semibold text-green-600">{stats.available}</p>
                        <p className="text-stone-500 text-sm">Disponibles</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <p className="text-2xl font-semibold text-blue-600">{stats.reserved}</p>
                        <p className="text-stone-500 text-sm">Con Reservas Hoy</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <p className="text-2xl font-semibold text-orange-600">{stats.occupied}</p>
                        <p className="text-stone-500 text-sm">Ocupadas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white border border-stone-200 mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                            <Input
                                placeholder="Buscar por restaurante o número..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 border-stone-200 focus:border-orange-400"
                            />
                        </div>
                        <div className="flex gap-2">
                            {[
                                { key: 'all', label: 'Todas' },
                                { key: 'available', label: 'Disponibles' },
                                { key: 'reserved', label: 'Reservadas' },
                                { key: 'occupied', label: 'Ocupadas' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilterStatus(key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === key
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tables by Restaurant */}
            {Object.values(groupedTables).length === 0 ? (
                <Card className="bg-white border border-stone-200">
                    <CardContent className="p-12 text-center text-stone-400">
                        No se encontraron mesas
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.values(groupedTables).map(({ restaurant, tables: restaurantTables }) => (
                        <Card key={restaurant.id} className="bg-white border border-stone-200">
                            <CardHeader className="border-b border-stone-100 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-semibold">
                                            {restaurant.name.charAt(0)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-stone-800">{restaurant.name}</CardTitle>
                                            <p className="text-stone-400 text-sm">{restaurant.businessCode}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-stone-500">{restaurantTables.length} mesas</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {restaurantTables.map((table) => {
                                        const isReserved = table.reservationsToday > 0;
                                        const isOccupied = table.status === 'occupied';
                                        const isFree = table.status === 'free' && !isReserved;

                                        return (
                                            <div
                                                key={table.id}
                                                className={`p-4 rounded-lg border transition-colors cursor-pointer ${isReserved
                                                        ? 'bg-blue-50 border-blue-200 hover:border-blue-400'
                                                        : isOccupied
                                                            ? 'bg-orange-50 border-orange-200 hover:border-orange-400'
                                                            : 'bg-green-50 border-green-200 hover:border-green-400'
                                                    }`}
                                            >
                                                <div className="text-center">
                                                    <span className="text-2xl font-bold text-stone-800">#{table.number || '?'}</span>
                                                    <div className="flex items-center justify-center gap-1 mt-1 text-stone-500 text-sm">
                                                        <Users className="h-3 w-3" />
                                                        <span>{table.capacity}</span>
                                                    </div>
                                                    <div className={`mt-2 px-2 py-0.5 rounded text-xs font-medium ${isReserved
                                                            ? 'bg-blue-100 text-blue-600'
                                                            : isOccupied
                                                                ? 'bg-orange-100 text-orange-600'
                                                                : 'bg-green-100 text-green-600'
                                                        }`}>
                                                        {isReserved ? `${table.reservationsToday} reserva(s)` : isOccupied ? 'Ocupada' : 'Libre'}
                                                    </div>
                                                    {table.currentReservation && (
                                                        <div className="mt-2 text-xs text-stone-500">
                                                            <p>{new Date(table.currentReservation.reservationTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                                                            <p className="truncate">{table.currentReservation.user.fullName || table.currentReservation.user.email}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
