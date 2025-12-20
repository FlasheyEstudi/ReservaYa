'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores';
import { useWebSocketStore } from '@/stores/websocketStore';

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { user, isAuthenticated, restaurantId } = useAuthStore();
  const { 
    isConnected, 
    connect: connectToStore, 
    disconnect: disconnectFromStore,
    onOrderReady,
    onTableStatusChange,
    onNewReservation,
    onMarketingPush
  } = useWebSocketStore();
  
  const socketRef = useRef<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000
  } = options;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('Socket: User not authenticated, skipping connection');
      return;
    }

    // Initialize socket connection
    const initSocket = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { io } = await import('socket.io-client');
        
        const socket = io('/', {
          path: '/socket.io/',
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          autoConnect: false,
          reconnection,
          reconnectionAttempts,
          reconnectionDelay,
          timeout: 20000,
          query: {
            XTransformPort: 3002
          }
        });

        socketRef.current = socket;

        // Connection event handlers
        socket.on('connect', () => {
          console.log('Socket connected:', socket.id);
          setConnectionError(null);
          connectToStore(user.id, user.role, restaurantId);
          
          // Authenticate with server
          socket.emit('authenticate', {
            userId: user.id,
            userRole: user.role,
            restaurantId
          });

          // Join role-specific rooms
          if (user.role === 'CHEF' && restaurantId) {
            socket.emit('join_kitchen', restaurantId);
          }
        });

        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          disconnectFromStore();
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setConnectionError(error.message);
        });

        socket.on('authenticated', (data) => {
          console.log('Socket authenticated:', data);
        });

        // Real-time event handlers
        socket.on('order_ready', (data) => {
          console.log('Order ready received:', data);
          onOrderReady(data);
        });

        socket.on('order_updated', (data) => {
          console.log('Order updated received:', data);
          // Handle order updates in kitchen display
        });

        socket.on('new_ticket', (data) => {
          console.log('New ticket received:', data);
          // Handle new tickets in kitchen display
        });

        socket.on('table_status_change', (data) => {
          console.log('Table status change received:', data);
          onTableStatusChange(data);
        });

        socket.on('new_reservation', (data) => {
          console.log('New reservation received:', data);
          onNewReservation(data);
        });

        socket.on('marketing_push', (data) => {
          console.log('Marketing push received:', data);
          onMarketingPush(data);
        });

        socket.on('vibrate', (data) => {
          console.log('Vibration request:', data);
          if ('vibrate' in navigator && data.pattern) {
            navigator.vibrate(data.pattern);
          }
        });

        // Auto-connect if enabled
        if (autoConnect) {
          socket.connect();
        }

        return socket;
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        setConnectionError('Failed to initialize socket connection');
        return null;
      }
    };

    initSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user, restaurantId, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay]);

  // Socket API methods
  const emit = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  // Order management methods
  const updateOrderStatus = (orderId: string, status: string, itemId?: string) => {
    emit('order_status_update', { orderId, status, itemId });
  };

  const createOrder = (orderData: {
    restaurantId: string;
    tableId: string;
    tableNumber: string;
    items: any[];
    employeeId: string;
  }) => {
    emit('new_order', orderData);
  };

  // Table management methods
  const updateTableStatus = (tableData: {
    restaurantId: string;
    tableId: string;
    tableNumber: string;
    newStatus: string;
    employeeId: string;
  }) => {
    emit('table_status_change', tableData);
  };

  // Reservation methods
  const createReservation = (reservationData: {
    restaurantId: string;
    customerName: string;
    people: number;
    time: string;
    date: string;
  }) => {
    emit('new_reservation', reservationData);
  };

  // Marketing methods (for admin)
  const sendMarketingPush = (marketingData: {
    title: string;
    message: string;
    segment?: string;
    targetUserIds?: string[];
  }) => {
    emit('marketing_push', marketingData);
  };

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    emit,
    disconnect,
    reconnect,
    // Domain-specific methods
    updateOrderStatus,
    createOrder,
    updateTableStatus,
    createReservation,
    sendMarketingPush
  };
};