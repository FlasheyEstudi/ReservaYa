'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    Grid3X3,
    Users,
    UtensilsCrossed,
    CalendarDays,
    UserCheck,
    Receipt,
    Settings,
    LogOut,
    Building2,
    ChefHat,
    FileText,
    Package,
    BookOpen,
    BarChart3,
    Megaphone,
    Crown,
    GitBranch
} from 'lucide-react';

interface ManageLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

const menuGroups = [
    {
        label: 'General',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/manage' },
            { icon: GitBranch, label: 'Sucursales', href: '/manage/branches' },
        ]
    },
    {
        label: 'Operaciones',
        items: [
            { icon: Grid3X3, label: 'Plano y Mesas', href: '/manage/layout' },
            { icon: CalendarDays, label: 'Reservaciones', href: '/manage/reservations' },
            { icon: UtensilsCrossed, label: 'Menú', href: '/manage/menu' },
        ]
    },
    {
        label: 'Equipo',
        items: [
            { icon: ChefHat, label: 'Personal', href: '/manage/staff' },
            { icon: UserCheck, label: 'Clientes', href: '/manage/customers' },
        ]
    },
    {
        label: 'Finanzas',
        items: [
            { icon: Receipt, label: 'Caja', href: '/manage/billing' },
            { icon: FileText, label: 'Facturación', href: '/manage/invoices' },
            { icon: Package, label: 'Inventario', href: '/manage/inventory' },
            { icon: BookOpen, label: 'Libro Diario', href: '/manage/journal' },
        ]
    },
    {
        label: 'Crecimiento',
        items: [
            { icon: BarChart3, label: 'Reportes', href: '/manage/reports' },
            { icon: Megaphone, label: 'Marketing', href: '/manage/marketing' },
        ]
    },
    {
        label: 'Cuenta',
        items: [
            { icon: Crown, label: 'Mi Plan', href: '/manage/subscription' },
            { icon: Settings, label: 'Configuración', href: '/manage/settings' },
        ]
    }
];

interface Branch {
    id: string;
    name: string;
    businessCode: string;
    isCurrent: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function ManageLayout({ children, title, subtitle }: ManageLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [restaurant, setRestaurant] = useState<{ name: string; businessCode: string } | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);
    const [features, setFeatures] = useState<any>({});
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [hasMuiltipleBranches, setHasMultipleBranches] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.restaurant) {
                    setRestaurant(user.restaurant);
                }
            } catch { }
        }
        fetchBranches();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/restaurant/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFeatures(data.subscription?.features || {});
            }
        } catch (e) {
            console.error('Error fetching settings:', e);
        } finally {
            setLoadingSettings(false);
        }
    };

    const fetchBranches = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/organization/branches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBranches(data.branches || []);
                setHasMultipleBranches((data.branches || []).length > 1);
            }
        } catch (e) {
            console.error('Error fetching branches:', e);
        }
    };

    const handleSwitchBranch = (branchId: string) => {
        localStorage.setItem('selectedBranchId', branchId);
        setShowBranchDropdown(false);
        window.location.reload();
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/auth/login');
    };

    const isActive = (href: string) => {
        if (href === '/manage') return pathname === '/manage';
        return pathname.startsWith(href);
    };

    const currentBranch = branches.find(b => b.isCurrent);

    // Filter menu items based on features
    // Default: Core features always shown. Premium features checked against plan.
    const filteredMenuGroups = menuGroups.map(group => {
        const filteredItems = group.items.filter(item => {
            // Core features (always available)
            if (['/manage', '/manage/reservations', '/manage/menu', '/manage/layout', '/manage/billing', '/manage/staff', '/manage/settings', '/manage/subscription', '/manage/branches'].includes(item.href)) {
                return true;
            }

            // Premium features mapping
            if (item.href === '/manage/inventory') return features.inventory !== false; // Default true if undefined, strictly check false? Or default false? 
            // Better: default false for basic plan. But new plans might not have the field.
            // Let's assume strict check: if plan says false, hide it. 
            // User requirement: "si el resturante esta en modo baisco... solo muestra sus funciones gratis"
            // So default should be: check if feature is enabled.

            if (item.href === '/manage/inventory') return features.inventory === true;
            if (item.href === '/manage/marketing') return features.marketing === true;
            if (item.href === '/manage/reports') return features.reports === true;
            if (item.href === '/manage/customers') return features.customers === true;
            if (item.href === '/manage/invoices') return features.invoices === true; // If invoices is a feature
            if (item.href === '/manage/journal') return features.journal === true; // If journal is a feature

            return true;
        });

        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-stone-200 fixed h-full flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-stone-800 text-sm">{restaurant?.name || 'Mi Restaurante'}</h1>
                            <p className="text-xs text-stone-400">{restaurant?.businessCode || 'Gestión'}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 overflow-y-auto py-2 px-3" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                    {filteredMenuGroups.map((group, idx) => (
                        <div key={group.label} className={idx > 0 ? 'mt-4' : ''}>
                            <p className="px-3 py-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <button
                                        key={item.href}
                                        onClick={() => router.push(item.href)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                                            }`}
                                    >
                                        <item.icon className={`h-4 w-4 ${isActive(item.href) ? 'text-emerald-600' : 'text-stone-400'}`} />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Logout - Fixed at bottom */}
                <div className="p-3 border-t border-stone-100 bg-white">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {/* Header */}
                <header className="bg-white border-b border-stone-200 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-stone-800">{title}</h1>
                            {subtitle && <p className="text-stone-500 mt-1">{subtitle}</p>}
                        </div>

                        {/* Branch Selector */}
                        {hasMuiltipleBranches && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors"
                                >
                                    <GitBranch className="h-4 w-4" />
                                    <span className="font-medium">{currentBranch?.name || 'Sucursal'}</span>
                                    <svg className={`h-4 w-4 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showBranchDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-stone-200 z-50 overflow-hidden">
                                        <div className="p-2 border-b border-stone-100">
                                            <p className="text-xs text-stone-400 px-2">Cambiar sucursal</p>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {branches.map(branch => (
                                                <button
                                                    key={branch.id}
                                                    onClick={() => handleSwitchBranch(branch.id)}
                                                    className={`w-full text-left px-4 py-3 hover:bg-stone-50 flex items-center justify-between ${branch.isCurrent ? 'bg-emerald-50' : ''}`}
                                                >
                                                    <div>
                                                        <p className={`font-medium ${branch.isCurrent ? 'text-emerald-700' : 'text-stone-800'}`}>{branch.name}</p>
                                                        <p className="text-xs text-stone-400">{branch.businessCode}</p>
                                                    </div>
                                                    {branch.isCurrent && (
                                                        <span className="text-emerald-600 text-xs font-medium">Actual</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {/* Content */}
                <div className="p-8">
                    {children}
                </div>
            </main>

            {/* Click outside to close dropdown */}
            {showBranchDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowBranchDropdown(false)}
                />
            )}
        </div>
    );
}

