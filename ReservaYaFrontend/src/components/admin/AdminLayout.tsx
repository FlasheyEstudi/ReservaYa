'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    Users,
    Settings,
    BarChart3,
    LogOut,
    Megaphone,
    Activity,
    FileText,
    Tags,
    Bell,
    Grid3X3,
    Package,
    CreditCard,
    Building2
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: Package, label: 'Planes', href: '/admin/plans' },
    { icon: CreditCard, label: 'Suscripciones', href: '/admin/subscriptions' },
    { icon: Building2, label: 'Organizaciones', href: '/admin/organizations' },
    { icon: Store, label: 'Restaurantes', href: '/admin/restaurants' },
    { icon: Grid3X3, label: 'Mesas', href: '/admin/tables' },
    { icon: Users, label: 'Usuarios', href: '/admin/users' },
    { icon: Bell, label: 'Notificaciones', href: '/admin/notifications' },
    { icon: Megaphone, label: 'Marketing', href: '/admin/marketing' },
    { icon: Tags, label: 'Categorías', href: '/admin/categories' },
    { icon: FileText, label: 'Audit Log', href: '/admin/audit' },
    { icon: Activity, label: 'Sistema', href: '/admin/system' },
    { icon: Settings, label: 'Configuración', href: '/admin/settings' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [notificationCount, setNotificationCount] = useState(0);
    const [showNotificationPreview, setShowNotificationPreview] = useState(false);
    const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

    useEffect(() => {
        fetchNotifications();
        // Refresh every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/admin/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotificationCount(data.stats?.unread || 0);
                setRecentNotifications((data.notifications || []).slice(0, 5));
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/auth/login');
    };

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
        return `${Math.floor(diffMins / 1440)}d`;
    };

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {/* Minimalist White Sidebar */}
            <aside className="w-64 bg-white border-r border-stone-200 fixed h-full">
                {/* Logo */}
                <div className="p-6 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">R</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-stone-800">ReservaYa</h1>
                            <p className="text-stone-400 text-xs">Admin Console</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4">
                    <p className="text-stone-400 text-xs font-medium uppercase tracking-wider mb-4 px-3">
                        Menú
                    </p>
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => router.push(item.href)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group
                    ${active
                                            ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-500'
                                            : 'text-stone-600 hover:bg-stone-50 hover:border-l-2 hover:border-orange-400'
                                        }`}
                                >
                                    <item.icon className={`h-5 w-5 ${active ? 'text-orange-500' : 'text-stone-400 group-hover:text-orange-400'}`} />
                                    <span className="font-medium text-sm">{item.label}</span>
                                    {item.label === 'Notificaciones' && notificationCount > 0 && (
                                        <span className="ml-auto bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                            {notificationCount > 99 ? '99+' : notificationCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout */}
                <div className="absolute bottom-0 w-64 p-4 border-t border-stone-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-stone-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {/* Top Header */}
                <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
                    <div className="flex items-center justify-between px-8 py-5">
                        <div>
                            <h2 className="text-2xl font-semibold text-stone-800">{title}</h2>
                            {subtitle && <p className="text-stone-500 text-sm mt-0.5">{subtitle}</p>}
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    className="p-2 hover:bg-stone-100 rounded-lg relative transition-colors"
                                    onClick={() => setShowNotificationPreview(!showNotificationPreview)}
                                >
                                    <Bell className="h-5 w-5 text-stone-500" />
                                    {notificationCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {notificationCount > 9 ? '9+' : notificationCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotificationPreview && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-stone-200 z-50">
                                        <div className="p-3 border-b border-stone-100 flex items-center justify-between">
                                            <h4 className="font-semibold text-stone-800">Notificaciones</h4>
                                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                                {notificationCount} nuevas
                                            </span>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {recentNotifications.length === 0 ? (
                                                <div className="p-4 text-center text-stone-400 text-sm">
                                                    Sin notificaciones
                                                </div>
                                            ) : (
                                                recentNotifications.map((n) => (
                                                    <div key={n.id} className="p-3 hover:bg-stone-50 border-b border-stone-50 cursor-pointer">
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-lg">{n.icon}</span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-stone-700 truncate">{n.title}</p>
                                                                <p className="text-xs text-stone-500 truncate">{n.message}</p>
                                                            </div>
                                                            <span className="text-xs text-stone-400">{formatTime(n.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-stone-100">
                                            <button
                                                onClick={() => { router.push('/admin/notifications'); setShowNotificationPreview(false); }}
                                                className="w-full py-2 text-center text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            >
                                                Ver todas las notificaciones
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Admin Avatar */}
                            <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
                                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <span className="text-orange-600 font-semibold text-sm">A</span>
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium text-stone-700">Administrador</p>
                                    <p className="text-xs text-stone-400">Super Admin</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
