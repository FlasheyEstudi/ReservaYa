'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    Store,
    Users,
    TrendingUp,
    Calendar,
    DollarSign,
    ShoppingBag,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    subscription_metrics?: {
        mrr: number;
        active_subscriptions: number;
    };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function AdminDashboard() {
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

    return (
        <AdminLayout title="Dashboard" subtitle="Resumen general de la plataforma">
            {/* Stat Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${stats?.subscription_metrics ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-5 mb-8`}>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors cursor-pointer group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm font-medium">Ingresos Totales</p>
                                <p className="text-2xl font-semibold text-stone-800 mt-1">
                                    {formatCurrency(stats?.overview.total_revenue ?? 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-stone-100 group-hover:bg-orange-50 rounded-lg flex items-center justify-center transition-colors">
                                <DollarSign className="h-6 w-6 text-stone-400 group-hover:text-orange-500 transition-colors" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {stats?.subscription_metrics && (
                    <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors cursor-pointer group">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-stone-500 text-sm font-medium">MRR (Mensual)</p>
                                    <p className="text-2xl font-semibold text-stone-800 mt-1">
                                        {formatCurrency(stats.subscription_metrics.mrr)}
                                    </p>
                                    <p className="text-xs text-stone-400 mt-1">
                                        {stats.subscription_metrics.active_subscriptions} activos
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-stone-100 group-hover:bg-orange-50 rounded-lg flex items-center justify-center transition-colors">
                                    <DollarSign className="h-6 w-6 text-stone-400 group-hover:text-orange-500 transition-colors" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors cursor-pointer group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm font-medium">Restaurantes Activos</p>
                                <p className="text-2xl font-semibold text-stone-800 mt-1">
                                    {stats?.overview.active_restaurants ?? 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-stone-100 group-hover:bg-orange-50 rounded-lg flex items-center justify-center transition-colors">
                                <Store className="h-6 w-6 text-stone-400 group-hover:text-orange-500 transition-colors" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors cursor-pointer group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm font-medium">Órdenes Totales</p>
                                <p className="text-2xl font-semibold text-stone-800 mt-1">
                                    {stats?.overview.total_orders ?? 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-stone-100 group-hover:bg-orange-50 rounded-lg flex items-center justify-center transition-colors">
                                <ShoppingBag className="h-6 w-6 text-stone-400 group-hover:text-orange-500 transition-colors" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors cursor-pointer group">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm font-medium">Total Empleados</p>
                                <p className="text-2xl font-semibold text-stone-800 mt-1">
                                    {stats?.overview.total_employees ?? 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-stone-100 group-hover:bg-orange-50 rounded-lg flex items-center justify-center transition-colors">
                                <Users className="h-6 w-6 text-stone-400 group-hover:text-orange-500 transition-colors" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Activity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-stone-500 text-sm">Órdenes Hoy</p>
                                <p className="text-xl font-semibold text-stone-800">{stats?.today.orders ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-stone-500 text-sm">Reservas Hoy</p>
                                <p className="text-xl font-semibold text-stone-800">{stats?.today.reservations ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-stone-500 text-sm">Ingresos Hoy</p>
                                <p className="text-xl font-semibold text-stone-800">{formatCurrency(stats?.today.revenue ?? 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800">Accesos Rápidos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col items-center gap-2 border-stone-200 hover:border-orange-400 hover:bg-orange-50 transition-colors"
                                onClick={() => router.push('/admin/restaurants')}
                            >
                                <Store className="h-5 w-5 text-stone-500" />
                                <span className="text-sm text-stone-600">Restaurantes</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col items-center gap-2 border-stone-200 hover:border-orange-400 hover:bg-orange-50 transition-colors"
                                onClick={() => router.push('/admin/users')}
                            >
                                <Users className="h-5 w-5 text-stone-500" />
                                <span className="text-sm text-stone-600">Usuarios</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col items-center gap-2 border-stone-200 hover:border-orange-400 hover:bg-orange-50 transition-colors"
                                onClick={() => router.push('/admin/marketing')}
                            >
                                <TrendingUp className="h-5 w-5 text-stone-500" />
                                <span className="text-sm text-stone-600">Marketing</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col items-center gap-2 border-stone-200 hover:border-orange-400 hover:bg-orange-50 transition-colors"
                                onClick={() => router.push('/admin/analytics')}
                            >
                                <DollarSign className="h-5 w-5 text-stone-500" />
                                <span className="text-sm text-stone-600">Analytics</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800">Resumen de Recursos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2">
                                <span className="text-stone-600">Total Mesas</span>
                                <span className="font-semibold text-stone-800">{stats?.overview.total_tables ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-stone-100">
                                <span className="text-stone-600">Total Empleados</span>
                                <span className="font-semibold text-stone-800">{stats?.overview.total_employees ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-stone-100">
                                <span className="text-stone-600">Restaurantes Activos</span>
                                <span className="font-semibold text-stone-800">{stats?.overview.active_restaurants ?? 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
