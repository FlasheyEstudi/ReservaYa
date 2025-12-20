'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BarChart3, DollarSign, Calendar, TrendingUp } from 'lucide-react';
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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function AdminReports() {
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
            console.error('Failed to fetch:', err);
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
        <AdminLayout title="Reportes" subtitle="Métricas de rendimiento">
            {/* Summary */}
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
                                <p className="text-stone-500 text-sm">Reservas Hoy</p>
                                <p className="text-2xl font-semibold text-stone-800">{stats?.today.reservations ?? 0}</p>
                            </div>
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-500 text-sm">Ingresos Hoy</p>
                                <p className="text-2xl font-semibold text-stone-800">{formatCurrency(stats?.today.revenue ?? 0)}</p>
                            </div>
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800">Resumen General</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                <span className="text-stone-600">Restaurantes</span>
                                <span className="text-lg font-semibold text-stone-800">{stats?.overview.active_restaurants ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                <span className="text-stone-600">Empleados</span>
                                <span className="text-lg font-semibold text-stone-800">{stats?.overview.total_employees ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                <span className="text-stone-600">Mesas</span>
                                <span className="text-lg font-semibold text-stone-800">{stats?.overview.total_tables ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <span className="text-stone-600">Órdenes</span>
                                <span className="text-lg font-semibold text-stone-800">{stats?.overview.total_orders ?? 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800">Actividad Hoy</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100 hover:border-orange-400 transition-colors">
                            <span className="text-stone-600">Órdenes</span>
                            <span className="text-xl font-semibold text-blue-600">{stats?.today.orders ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100 hover:border-orange-400 transition-colors">
                            <span className="text-stone-600">Reservaciones</span>
                            <span className="text-xl font-semibold text-green-600">{stats?.today.reservations ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100 hover:border-orange-400 transition-colors">
                            <span className="text-stone-600">Ingresos</span>
                            <span className="text-xl font-semibold text-orange-600">{formatCurrency(stats?.today.revenue ?? 0)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
