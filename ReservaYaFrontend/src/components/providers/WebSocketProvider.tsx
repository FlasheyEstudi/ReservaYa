"use client";

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { socket } from '@/lib/socket';

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated, user, token } = useAuthStore(); // Assuming token is available in store

  useEffect(() => {
    if (isAuthenticated && user && token) {
      console.log('Initializing WebSocket for:', user.role);
      socket.connect(token);

      // Auto-join rooms based on role
      const role = (user.role as string).toUpperCase();
      if (role === 'MANAGER' || role === 'WAITER' || role === 'CHEF' || role === 'HOST') {
        // Join restaurant specific rooms
        const rid = (user as any).restaurantId || (user as any).rid; // Adjust based on user shape
        if (rid) {
          socket.joinRoom(`restaurant_${rid}_all`);
          if (role === 'CHEF') socket.joinRoom(`restaurant_${rid}_kitchen`);
          if (role === 'WAITER') socket.joinRoom(`restaurant_${rid}_waiters`);
          if (role === 'HOST') socket.joinRoom(`restaurant_${rid}_host`);
        }
      }

      // Also join per-user room
      socket.joinRoom(`user_${user.id}`);
    }

    return () => {
      if (isAuthenticated) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user, token]);

  return <>{children}</>;
}