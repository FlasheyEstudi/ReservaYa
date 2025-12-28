'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Bell, User, Store, Star, AlertTriangle, TrendingUp, Calendar, Check, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    createdAt: string;
    read: boolean;
    icon: string;
    color: string;
}

interface Stats {
    unread: number;
    newUsers: number;
    newRestaurants: number;
    lowRatings: number;
    trending: number;
    reservationsToday: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function AdminNotifications() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [readIds, setReadIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (!token || userRole !== 'ADMIN') {
            router.push('/auth/login');
            return;
        }

        fetchNotifications(token);
    }, [router]);

    const fetchNotifications = async (token: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setStats(data.stats || null);
                // Set read IDs from API response
                const ids = new Set<string>((data.notifications || []).filter((n: any) => n.read).map((n: any) => n.id as string));
                setReadIds(ids);
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        if (readIds.has(id)) return; // Already read

        const newReadIds = new Set([...readIds, id]);
        setReadIds(newReadIds);

        // Update stats to decrement unread count
        if (stats && stats.unread > 0) {
            setStats({ ...stats, unread: stats.unread - 1 });
        }

        // Update notification in local state
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        // Persist to backend
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/admin/notifications/read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notificationIds: [id] })
        }).catch(() => { });
    };

    const markAllAsRead = async () => {
        const allIds = notifications.map(n => n.id);
        setReadIds(new Set(allIds));

        // Update stats
        if (stats) {
            setStats({ ...stats, unread: 0 });
        }

        // Update all notifications in local state
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        // Persist to backend
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/admin/notifications/read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notificationIds: allIds })
        }).catch(() => { });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'user_registration': return <User className="h-5 w-5" />;
            case 'restaurant_created': return <Store className="h-5 w-5" />;
            case 'restaurant_trending': return <TrendingUp className="h-5 w-5" />;
            case 'low_rating': return <AlertTriangle className="h-5 w-5" />;
            default: return <Bell className="h-5 w-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'user_registration': return 'bg-blue-100 text-blue-600';
            case 'restaurant_created': return 'bg-green-100 text-green-600';
            case 'restaurant_trending': return 'bg-orange-100 text-orange-600';
            case 'low_rating': return 'bg-red-100 text-red-600';
            default: return 'bg-stone-100 text-stone-600';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !readIds.has(n.id);
        return n.type === filter;
    });

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return date.toLocaleDateString('es-MX');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <AdminLayout title="Notificaciones" subtitle="Centro de alertas y actividad del sistema">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-4 text-center">
                        <Bell className="h-6 w-6 mx-auto text-orange-500 mb-1" />
                        <p className="text-xl font-semibold text-stone-800">{notifications.length - readIds.size}</p>
                        <p className="text-stone-500 text-xs">Sin leer</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-4 text-center">
                        <User className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                        <p className="text-xl font-semibold text-blue-600">{stats?.newUsers || 0}</p>
                        <p className="text-stone-500 text-xs">Nuevos Usuarios</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-4 text-center">
                        <Store className="h-6 w-6 mx-auto text-green-500 mb-1" />
                        <p className="text-xl font-semibold text-green-600">{stats?.newRestaurants || 0}</p>
                        <p className="text-stone-500 text-xs">Nuevos Rest.</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-4 text-center">
                        <TrendingUp className="h-6 w-6 mx-auto text-orange-500 mb-1" />
                        <p className="text-xl font-semibold text-orange-600">{stats?.trending || 0}</p>
                        <p className="text-stone-500 text-xs">En Racha</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-6 w-6 mx-auto text-red-500 mb-1" />
                        <p className="text-xl font-semibold text-red-600">{stats?.lowRatings || 0}</p>
                        <p className="text-stone-500 text-xs">Alertas</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-4 text-center">
                        <Calendar className="h-6 w-6 mx-auto text-purple-500 mb-1" />
                        <p className="text-xl font-semibold text-purple-600">{stats?.reservationsToday || 0}</p>
                        <p className="text-stone-500 text-xs">Reservas Hoy</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white border border-stone-200 mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'Todas', icon: Bell },
                                { key: 'unread', label: 'Sin leer', icon: Bell },
                                { key: 'user_registration', label: 'Usuarios', icon: User },
                                { key: 'restaurant_created', label: 'Restaurantes', icon: Store },
                                { key: 'restaurant_trending', label: 'Trending', icon: TrendingUp },
                                { key: 'low_rating', label: 'Alertas', icon: AlertTriangle }
                            ].map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === key ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                            <Check className="h-4 w-4 mr-1" />
                            Marcar todo leído
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications List */}
            <Card className="bg-white border border-stone-200">
                <CardHeader className="border-b border-stone-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-stone-800">
                        Actividad Reciente ({filteredNotifications.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-12 text-stone-400">
                            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No hay notificaciones</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {filteredNotifications.map((notification) => {
                                const isRead = readIds.has(notification.id);
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => markAsRead(notification.id)}
                                        className={`p-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-stone-50 ${isRead ? 'opacity-60' : ''
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className={`font-medium text-stone-800 ${isRead ? '' : 'font-semibold'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-stone-500 mt-0.5">{notification.message}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-xs text-stone-400">{formatTime(notification.createdAt)}</span>
                                                    {!isRead && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
