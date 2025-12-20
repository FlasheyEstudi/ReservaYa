'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Store,
  Users,
  Megaphone,
  Settings,
  LogOut
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Restaurantes',
    href: '/admin/restaurants',
    icon: Store,
  },
  {
    title: 'Usuarios',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Marketing',
    href: '/admin/marketing',
    icon: Megaphone,
  },
  {
    title: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('restaurantCode');
    window.location.href = '/auth/login';
  };

  return (
    <div className="w-64 bg-gradient-to-b from-orange-700 to-orange-800 text-white h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-orange-600">
        <h1 className="text-2xl font-bold text-white">ReservaYa</h1>
        <p className="text-sm text-orange-200 mt-1">Panel de Administración</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'text-orange-100 hover:bg-orange-600/50 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Actions */}
      <div className="p-4 border-t border-orange-600">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-orange-100 hover:bg-orange-600/50 hover:text-white transition-all duration-200 w-full"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}