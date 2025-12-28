'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    Store, Users, TrendingUp, Calendar, DollarSign, ShoppingBag,
    ArrowRight, ArrowUp, ArrowDown, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RevenueChart, OrdersByDayChart, ComparisonChart, SparklineChart } from '@/components/admin/charts';

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
    // Chart data (generated if not from API)
    revenue_trend?: { date: string; revenue: number }[];
    orders_by_day?: { day: string; orders: number }[];
    activity_trend?: { date: string; orders: number; reservations: number }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats & {
        revenue_trend?: { date: string; revenue: number }[];
        orders_by_day?: { day: string; orders: number }[];
        activity_trend?: { date: string; orders: number; reservations: number }[];
    } | null>(null);
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

    const getPercentChange = () => Math.floor(Math.random() * 20) - 5; // Demo: random change

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <AdminLayout title="Dashboard" subtitle="Resumen general de la plataforma">
            {/* Modern Stat Cards with Sparklines */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Revenue Card */}
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 overflow-hidden">
                    <CardContent className="p-5 relative">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Ingresos Totales</p>
                                <p className="text-3xl font-bold mt-1">
                                    {formatCurrency(stats?.overview.total_revenue ?? 0)}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            {getPercentChange() >= 0 ? (
                                <><ArrowUp className="h-4 w-4" /><span>+12.5% vs mes anterior</span></>
                            ) : (
                                <><ArrowDown className="h-4 w-4" /><span>-3.2% vs mes anterior</span></>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-24 h-12 opacity-30">
                            <SparklineChart data={[3, 5, 4, 7, 6, 8, 9, 7, 10]} color="#fff" height={48} />
                        </div>
                    </CardContent>
                </Card>

                {/* MRR Card (if available) */}
                {stats?.subscription_metrics && (
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 overflow-hidden">
                        <CardContent className="p-5 relative">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium">MRR Mensual</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {formatCurrency(stats.subscription_metrics.mrr)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-sm text-emerald-100">
                                {stats.subscription_metrics.active_subscriptions} suscripciones activas
                            </p>
                            <div className="absolute bottom-0 right-0 w-24 h-12 opacity-30">
                                <SparklineChart data={[5, 6, 5, 7, 8, 9, 10, 11, 12]} color="#fff" height={48} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Restaurants Card */}
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-all hover:shadow-md">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-stone-500 text-sm font-medium">Restaurantes</p>
                                <p className="text-3xl font-bold text-stone-800 mt-1">
                                    {stats?.overview.active_restaurants ?? 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Store className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <ArrowUp className="h-4 w-4" />
                            <span>+3 este mes</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Card */}
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-all hover:shadow-md">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-stone-500 text-sm font-medium">Órdenes Totales</p>
                                <p className="text-3xl font-bold text-stone-800 mt-1">
                                    {stats?.overview.total_orders?.toLocaleString() ?? 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-purple-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <ArrowUp className="h-4 w-4" />
                            <span>+8.3% vs semana anterior</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
                {/* Revenue Chart - 2 columns wide */}
                <Card className="lg:col-span-2 bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-stone-800">
                                Ingresos Últimos 30 Días
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/analytics')}>
                                <BarChart3 className="h-4 w-4 mr-1" /> Ver más
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        {stats?.revenue_trend && <RevenueChart data={stats.revenue_trend} height={280} />}
                    </CardContent>
                </Card>

                {/* Orders by Day */}
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800">
                            Órdenes por Día
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        {stats?.orders_by_day && <OrdersByDayChart data={stats.orders_by_day} height={280} />}
                    </CardContent>
                </Card>
            </div>

            {/* Today's Activity + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                {/* Today's Stats */}
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-orange-500" />
                            Actividad de Hoy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-xl">
                                <ShoppingBag className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-stone-800">{stats?.today.orders ?? 0}</p>
                                <p className="text-xs text-stone-500">Órdenes</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-xl">
                                <Calendar className="h-6 w-6 text-green-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-stone-800">{stats?.today.reservations ?? 0}</p>
                                <p className="text-xs text-stone-500">Reservas</p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-xl">
                                <DollarSign className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-stone-800">{formatCurrency(stats?.today.revenue ?? 0)}</p>
                                <p className="text-xs text-stone-500">Ingresos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
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
                                onClick={() => router.push('/admin/subscriptions')}
                            >
                                <TrendingUp className="h-5 w-5 text-stone-500" />
                                <span className="text-sm text-stone-600">Suscripciones</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col items-center gap-2 border-stone-200 hover:border-orange-400 hover:bg-orange-50 transition-colors"
                                onClick={() => router.push('/admin/analytics')}
                            >
                                <BarChart3 className="h-5 w-5 text-stone-500" />
                                <span className="text-sm text-stone-600">Analytics</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Comparison Chart */}
            <Card className="bg-white border border-stone-200">
                <CardHeader className="border-b border-stone-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-stone-800">
                        Tendencia: Órdenes vs Reservas (30 días)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                    {stats?.activity_trend && <ComparisonChart data={stats.activity_trend} height={250} />}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
