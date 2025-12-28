'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BarChart3, TrendingUp, Store, Users, DollarSign, Calendar, Activity, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    RevenueChart, OrdersByDayChart, SubscriptionsPieChart,
    ComparisonChart, TopRestaurantsChart
} from '@/components/admin/charts';

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

interface ChartData {
    revenue_trend?: { date: string; revenue: number }[];
    orders_by_day?: { day: string; orders: number }[];
    subscriptions_pie?: { name: string; value: number }[];
    activity_trend?: { date: string; orders: number; reservations: number }[];
    top_restaurants?: { name: string; revenue: number }[];
}

export default function AdminAnalytics() {
    const router = useRouter();
    const [stats, setStats] = useState<(Stats & ChartData) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

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
        <AdminLayout title="Analytics" subtitle="Análisis detallado de la plataforma">
            {/* Period Selector */}
            <div className="flex gap-2 mb-6">
                {(['7d', '30d', '90d'] as const).map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p
                            ? 'bg-orange-500 text-white'
                            : 'bg-white text-stone-600 border border-stone-200 hover:border-orange-400'
                            }`}
                    >
                        {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
                    </button>
                ))}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-white border border-stone-200">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-500">Ingresos</p>
                                <p className="text-xl font-bold text-stone-800">{formatCurrency(stats?.overview.total_revenue ?? 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-500">Órdenes</p>
                                <p className="text-xl font-bold text-stone-800">{(stats?.overview.total_orders ?? 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Store className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-500">Restaurantes</p>
                                <p className="text-xl font-bold text-stone-800">{stats?.overview.active_restaurants ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-500">Empleados</p>
                                <p className="text-xl font-bold text-stone-800">{stats?.overview.total_employees ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
                <Card className="lg:col-span-2 bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-orange-500" />
                            Tendencia de Ingresos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        {stats?.revenue_trend && <RevenueChart data={stats.revenue_trend} height={300} />}
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-purple-500" />
                            Suscripciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        {stats?.subscriptions_pie && stats.subscriptions_pie.length > 0 && <SubscriptionsPieChart data={stats.subscriptions_pie} height={270} />}
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            Órdenes por Día de Semana
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        {stats?.orders_by_day && <OrdersByDayChart data={stats.orders_by_day} height={280} />}
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <Store className="h-5 w-5 text-green-500" />
                            Top 5 Restaurantes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        {stats?.top_restaurants && stats.top_restaurants.length > 0 && <TopRestaurantsChart data={stats.top_restaurants} height={280} />}
                    </CardContent>
                </Card>
            </div>

            {/* Activity Comparison */}
            <Card className="bg-white border border-stone-200">
                <CardHeader className="border-b border-stone-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        Comparativa: Órdenes vs Reservas
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                    {stats?.activity_trend && <ComparisonChart data={stats.activity_trend} height={300} />}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
