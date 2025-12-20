'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores';

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Log connection status changes
    if (isAuthenticated && user) {
      console.log('WebSocket connection would be established for user:', user.role);
      // Note: WebSocket connection temporarily disabled for stability
      // TODO: Re-enable WebSocket integration once socket.io-client import is fixed
    }
  }, [isAuthenticated, user]);

  return <>{children}</>;
}