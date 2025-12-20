import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface WebSocketState {
  // Connection state
  isConnected: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Connection management
  connect: (userId: string, userRole: string, restaurantId?: string) => void;
  disconnect: () => void;

  // Notification management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;

  // Socket event handlers
  onOrderReady: (data: any) => void;
  onTableStatusChange: (data: any) => void;
  onNewReservation: (data: any) => void;
  onMarketingPush: (data: any) => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  isConnected: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  notifications: [],
  unreadCount: 0,

  connect: (userId, userRole, restaurantId) => {
    // In a real implementation, this would establish a WebSocket connection
    console.log('Connecting to WebSocket:', { userId, userRole, restaurantId });

    // Simulate connection
    setTimeout(() => {
      set({ isConnected: true, reconnectAttempts: 0 });

      // Simulate receiving a notification after connection
      if (userRole === 'WAITER') {
        setTimeout(() => {
          get().onOrderReady({
            orderId: 'order123',
            tableNumber: 'Mesa 5',
            items: ['Pizza Margherita', 'Ensalada César'],
          });
        }, 3000);
      }
    }, 1000);
  },

  disconnect: () => {
    console.log('Disconnecting from WebSocket');
    set({ isConnected: false });
  },

  addNotification: (notificationData) => {
    // Use crypto.randomUUID if available, fallback to timestamp-based ID
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `notif-${crypto.randomUUID()}`;
      }
      return `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    };

    const notification: Notification = {
      ...notificationData,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Show browser notification if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.svg',
      });
    }
  },

  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
      unreadCount: 0,
    }));
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  onOrderReady: (data) => {
    const { addNotification } = get();

    addNotification({
      type: 'success',
      title: '¡Pedido Listo!',
      message: `${data.tableNumber}: ${data.items.join(', ')} está listo para servir.`,
      actionText: 'Ver Pedido',
      actionUrl: '/workspace/waiter',
    });

    // Vibrate device if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  },

  onTableStatusChange: (data) => {
    const { addNotification } = get();

    addNotification({
      type: 'info',
      title: 'Cambio de Mesa',
      message: `La ${data.tableNumber} ahora está ${data.newStatus}.`,
      actionText: 'Ver Mapa',
      actionUrl: '/workspace/host',
    });
  },

  onNewReservation: (data) => {
    const { addNotification } = get();

    addNotification({
      type: 'info',
      title: 'Nueva Reserva',
      message: `${data.customerName} ha reservado para ${data.people} personas a las ${data.time}.`,
      actionText: 'Ver Reservas',
      actionUrl: '/manage/reservations',
    });
  },

  onMarketingPush: (data) => {
    const { addNotification } = get();

    addNotification({
      type: 'warning',
      title: data.title,
      message: data.message,
      actionText: 'Ver Oferta',
      actionUrl: '/search',
    });
  },
}));

// Request notification permission on app load
if (typeof window !== 'undefined' && 'Notification' in window) {
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}