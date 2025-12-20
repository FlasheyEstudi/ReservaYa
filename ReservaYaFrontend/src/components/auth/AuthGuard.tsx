'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Define roles locally to avoid Prisma import in frontend
type UserRole = 'CUSTOMER' | 'ADMIN' | 'MANAGER' | 'CHEF' | 'WAITER' | 'HOST' | 'BARTENDER' | 'RESTAURANT';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackPath?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function AuthGuard({
  children,
  allowedRoles = [],
  fallbackPath = '/auth/login'
}: AuthGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          router.push(fallbackPath);
          return;
        }

        // Validate token with backend instead of trusting localStorage
        const res = await fetch(`${API_URL}/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          // Token invalid or expired - clear storage and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
          router.push(fallbackPath);
          return;
        }

        const data = await res.json();
        const userRole = (data.user?.role || data.role || '').toUpperCase() as UserRole;

        // Check if user role is allowed (using verified role from backend)
        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
          // Redirect to appropriate page based on verified role
          const roleRedirects: Record<UserRole, string> = {
            'CUSTOMER': '/profile',
            'ADMIN': '/admin',
            'MANAGER': '/manage',
            'RESTAURANT': '/manage',
            'CHEF': '/workspace/kitchen',
            'WAITER': '/workspace/waiter',
            'HOST': '/workspace/host',
            'BARTENDER': '/workspace/bar'
          };
          router.push(roleRedirects[userRole] || '/403');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        router.push(fallbackPath);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles, fallbackPath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}