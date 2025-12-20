import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN' | 'MANAGER' | 'CHEF' | 'WAITER' | 'HOST' | 'BARTENDER';
  phone?: string;
  avatar?: string;
}

export interface AuthState {
  // User data
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Restaurant context for employees
  restaurantCode?: string;
  restaurantId?: string;

  // Auth actions
  login: (email: string, password: string, role?: string) => Promise<void>;
  loginEmployee: (restaurantCode: string, email: string, pin: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string, role = 'CUSTOMER') => {
    set({ isLoading: true, error: null });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Store in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loginEmployee: async (restaurantCode: string, email: string, pin: string) => {
    set({ isLoading: true, error: null });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${API_URL}/auth/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_code: restaurantCode,
          email,
          pin
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error de autenticación');
      }

      // Map backend role to frontend role format
      const roleMap: Record<string, User['role']> = {
        'manager': 'MANAGER',
        'chef': 'CHEF',
        'waiter': 'WAITER',
        'host': 'HOST',
        'bartender': 'BARTENDER'
      };

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.fullName || data.user.email,
        role: roleMap[data.user.role.toLowerCase()] || 'WAITER',
      };

      // Store in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('restaurantCode', restaurantCode);
      localStorage.setItem('restaurantId', data.user.restaurantId);

      set({
        user,
        token: data.token,
        isAuthenticated: true,
        restaurantCode,
        restaurantId: data.user.restaurantId,
        isLoading: false,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Employee login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('restaurantCode');
    localStorage.removeItem('restaurantId');

    // Reset store state
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      restaurantCode: undefined,
      restaurantId: undefined,
      error: null,
    });
  },

  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),

  // Initialize auth state from localStorage on store creation
  // This would typically be done in a separate initialization function
}));

// Helper to check if JWT is expired
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return Date.now() > expiry;
  } catch {
    return true; // If we can't parse, assume expired
  }
}

// Initialize auth state from localStorage
const initializeAuth = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const restaurantCode = localStorage.getItem('restaurantCode');
    const restaurantId = localStorage.getItem('restaurantId');

    if (token && userStr) {
      // Check if token is expired before restoring session
      if (isTokenExpired(token)) {
        // Token expired - clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('restaurantCode');
        localStorage.removeItem('restaurantId');
        return;
      }

      try {
        const user = JSON.parse(userStr);
        useAuthStore.setState({
          user,
          token,
          isAuthenticated: true,
          restaurantCode: restaurantCode || undefined,
          restaurantId: restaurantId || undefined,
        });
      } catch (error) {
        // Invalid user data - clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('restaurantCode');
        localStorage.removeItem('restaurantId');
      }
    }
  }
};

// Initialize auth state
initializeAuth();