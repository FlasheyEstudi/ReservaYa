'use client';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CalendarCheck, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';

import { getApiUrl } from '@/lib/api';

interface DashboardStats {
    salesToday: number;
    occupancy: number;
    pendingReservations: number;
    totalTables: number;
    occupiedTables: number;
    ordersToday: number;
}

export default function ManageDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        salesToday: 0,
        occupancy: 0,
        pendingReservations: 0,
        totalTables: 0,
        occupiedTables: 0,
        ordersToday: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('token');
        const restaurantId = localStorage.getItem('restaurantId');

        if (!token || !restaurantId) {
            setLoading(false);
            return;
        }

        try {
            // Fetch tables
            const tablesRes = await fetch(`${getApiUrl()}/restaurant/layout`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (tablesRes.ok) {
                const tablesData = await tablesRes.json();
                const tables = tablesData.tables || [];
                const occupied = tables.filter((t: any) => t.currentStatus === 'occupied').length;

                setStats(prev => ({
                    ...prev,
                    totalTables: tables.length,
                    occupiedTables: occupied,
                    occupancy: tables.length > 0 ? Math.round((occupied / tables.length) * 100) : 0
                }));
            }

            // Fetch reports for sales data
            const reportsRes = await fetch(`${getApiUrl()}/restaurant/reports?period=day`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (reportsRes.ok) {
                const reportsData = await reportsRes.json();
                setStats(prev => ({
                    ...prev,
                    salesToday: reportsData.sales?.totalRevenue || 0,
                    ordersToday: reportsData.sales?.orderCount || 0,
                    pendingReservations: reportsData.reservations?.confirmed || 0
                }));
            }

            // Fetch journal for recent activity
            const journalRes = await fetch(`${getApiUrl()}/restaurant/journal?limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (journalRes.ok) {
                const journalData = await journalRes.json();
                const activities = (journalData.entries || []).map((e: any) => ({
                    type: e.action.includes('order') ? 'order' : e.action.includes('reservation') ? 'reservation' : 'info',
                    message: e.description,
                    time: new Date(e.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                }));
                setRecentActivity(activities.length > 0 ? activities : [
                    { type: 'info', message: 'Sin actividad reciente', time: '' }
                ]);
            } else {
                setRecentActivity([{ type: 'info', message: 'Sin actividad reciente', time: '' }]);
            }

        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const kpis = [
        {
            title: 'Ventas Hoy',
            value: `$${stats.salesToday.toLocaleString()}`,
            icon: DollarSign,
            change: '+12%',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50'
        },
        {
            title: 'Ocupación',
            value: `${stats.occupancy}%`,
            icon: Users,
            subtitle: `${stats.occupiedTables}/${stats.totalTables} mesas`,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            title: 'Reservas Pendientes',
            value: stats.pendingReservations.toString(),
            icon: CalendarCheck,
            subtitle: 'Para hoy',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50'
        },
        {
            title: 'Órdenes Hoy',
            value: stats.ordersToday.toString(),
            icon: TrendingUp,
            subtitle: 'Completadas',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
    ];

    return (
        <ManageLayout title="Dashboard" subtitle="Resumen de operaciones en tiempo real">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, i) => (
                    <Card key={i} className="border-stone-200">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-stone-500 mb-1">{kpi.title}</p>
                                    <p className="text-3xl font-bold text-stone-800">{kpi.value}</p>
                                    {kpi.subtitle && <p className="text-xs text-stone-400 mt-1">{kpi.subtitle}</p>}
                                    {kpi.change && <p className="text-xs text-emerald-600 mt-1">{kpi.change} vs ayer</p>}
                                </div>
                                <div className={`w-12 h-12 ${kpi.bgColor} rounded-xl flex items-center justify-center`}>
                                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card className="border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800">Acciones Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Nueva Reserva', href: '/manage/reservations', icon: CalendarCheck, color: 'emerald' },
                                { label: 'Ver Mesas', href: '/manage/layout', icon: Users, color: 'blue' },
                                { label: 'Editar Menú', href: '/manage/menu', icon: TrendingUp, color: 'amber' },
                                { label: 'Ver Caja', href: '/manage/billing', icon: DollarSign, color: 'purple' },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => window.location.href = action.href}
                                    className={`p-4 rounded-xl border-2 border-stone-200 hover:border-${action.color}-300 hover:bg-${action.color}-50 transition-colors text-left`}
                                >
                                    <action.icon className={`h-6 w-6 text-${action.color}-600 mb-2`} />
                                    <p className="font-medium text-stone-700">{action.label}</p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800">Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {recentActivity.length === 0 ? (
                                <p className="text-stone-400 text-center py-8">Sin actividad reciente</p>
                            ) : (
                                recentActivity.map((activity, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-stone-50">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'reservation' ? 'bg-emerald-100' :
                                            activity.type === 'order' ? 'bg-blue-100' : 'bg-amber-100'
                                            }`}>
                                            {activity.type === 'reservation' && <CalendarCheck className="h-5 w-5 text-emerald-600" />}
                                            {activity.type === 'order' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                                            {activity.type === 'checkin' && <Users className="h-5 w-5 text-amber-600" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-stone-700">{activity.message}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-stone-400">
                                            <Clock className="h-3 w-3" />
                                            {activity.time}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ManageLayout>
    );
}
