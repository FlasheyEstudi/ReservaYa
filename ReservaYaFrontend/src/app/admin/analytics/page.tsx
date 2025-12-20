'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BarChart3, TrendingUp, Store, Users, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
    overview: {
        total_revenue: number;
        total_orders: number;
        active_restaurants: number;
        total_employees: number;
        total_tables: number;
    };
    today: {
        orders: number;
        reservations: number;
        revenue: number;
    };
    orders_by_status: Record<string, number>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function AdminAnalytics() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (!token || userRole !== 'ADMIN') {
            router.push('/auth/login');
            return;
        }

        fetchStats(token);
    }, [router]);

    const fetchStats = async (token: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(value);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    const weekData = [
        { day: 'Lun', orders: 24, revenue: 1200 },
        { day: 'Mar', orders: 31, revenue: 1550 },
        { day: 'Mie', orders: 28, revenue: 1400 },
        { day: 'Jue', orders: 35, revenue: 1750 },
        { day: 'Vie', orders: 42, revenue: 2100 },
        { day: 'Sab', orders: 58, revenue: 2900 },
        { day: 'Dom', orders: 45, revenue: 2250 }
    ];

    const maxOrders = Math.max(...weekData.map(d => d.orders));

    return (
        <AdminLayout title="Analytics" subtitle="Métricas y tendencias de la plataforma">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm">Ingresos Totales</p>
                                <p className="text-2xl font-semibold text-stone-800">{formatCurrency(stats?.overview.total_revenue ?? 0)}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm">Órdenes</p>
                                <p className="text-2xl font-semibold text-stone-800">{stats?.overview.total_orders ?? 0}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm">Restaurantes</p>
                                <p className="text-2xl font-semibold text-stone-800">{stats?.overview.active_restaurants ?? 0}</p>
                            </div>
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                                <Store className="h-5 w-5 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm">Empleados</p>
                                <p className="text-2xl font-semibold text-stone-800">{stats?.overview.total_employees ?? 0}</p>
                            </div>
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            Órdenes Semanales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="flex items-end justify-around h-48 gap-2">
                            {weekData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                    <div
                                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-orange-500"
                                        style={{ height: `${(d.orders / maxOrders) * 100}%`, minHeight: '16px' }}
                                    ></div>
                                    <span className="text-xs text-stone-500">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            Ingresos Semanales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="flex items-end justify-around h-48 gap-2">
                            {weekData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                    <div
                                        className="w-full bg-green-500 rounded-t transition-all hover:bg-orange-500"
                                        style={{ height: `${(d.revenue / 3000) * 100}%`, minHeight: '16px' }}
                                    ></div>
                                    <span className="text-xs text-stone-500">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Today & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-orange-500" />
                            Actividad de Hoy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100 hover:border-orange-400 transition-colors">
                            <span className="text-stone-600">Órdenes</span>
                            <span className="text-xl font-semibold text-blue-600">{stats?.today.orders ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100 hover:border-orange-400 transition-colors">
                            <span className="text-stone-600">Reservaciones</span>
                            <span className="text-xl font-semibold text-green-600">{stats?.today.reservations ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100 hover:border-orange-400 transition-colors">
                            <span className="text-stone-600">Ingresos</span>
                            <span className="text-xl font-semibold text-orange-600">{formatCurrency(stats?.today.revenue ?? 0)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800">Estado de Órdenes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        {Object.entries(stats?.orders_by_status || {}).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(stats?.orders_by_status || {}).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ${status === 'open' ? 'bg-yellow-500' :
                                                    status === 'closed' ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></div>
                                            <span className="text-stone-600 capitalize">{status.replace('_', ' ')}</span>
                                        </div>
                                        <span className="font-semibold text-stone-800">{count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-stone-400 text-center py-8">Sin órdenes registradas</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
