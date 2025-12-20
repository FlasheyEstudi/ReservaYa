export interface SocketUser {
  uid: string;
  rid: string;
  role: string;
  email: string;
}

export interface SocketEvents {
  // Connection events
  connected: (data: { message: string; user: SocketUser; rooms: string[] }) => void;
  
  // Order events
  order_status_changed: (data: { orderId: string; status: string; timestamp: string }) => void;
  kitchen_order_update: (data: { orderId: string; status: string; updatedBy: string }) => void;
  new_kitchen_ticket: (data: { orderId: string; tableId: string; items: any[]; timestamp: string }) => void;
  new_bar_ticket: (data: { orderId: string; tableId: string; items: any[]; timestamp: string }) => void;
  order_item_ready: (data: { orderId: string; tableNumber: string; itemName: string; quantity: number; timestamp: string }) => void;
  order_notification: (data: { type: string; orderId: string; tableNumber?: string; itemName?: string; quantity?: number; timestamp: string }) => void;
  
  // Menu events
  menu_item_availability_changed: (data: { itemId: string; isAvailable: boolean; name: string; updatedBy: string; timestamp: string }) => void;
  
  // Table events
  table_status_update: (data: { tableId: string; oldStatus: string; newStatus: string; updatedBy: string; timestamp: string }) => void;
  joined_table: (data: { tableId: string }) => void;
  left_table: (data: { tableId: string }) => void;
  
  // Reservation events
  reservation_status_changed: (data: { reservationId: string; status: string; partySize: number; tableId?: string; updatedBy: string; timestamp: string }) => void;
  reservation_notification: (data: { type: string; reservationId: string; status?: string; partySize?: number; timestamp: string }) => void;
  
  // Marketing events
  marketing_push: (data: { campaignId: string; title: string; body: string; targetSegment?: string; restaurantId?: string; timestamp: string }) => void;
  
  // Staff events
  staff_disconnected: (data: { userId: string; email: string; role: string; timestamp: string }) => void;
}

export class ReservaYaSocket {
  private socket: any = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.setupSocket();
  }

  private setupSocket() {
    if (typeof window === 'undefined') return;

    // Import socket.io-client dynamically to avoid SSR issues
    import('socket.io-client').then(({ io }) => {
      this.socket = io('/', {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 5000,
        forceNew: true
      });

      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
      
      // Re-authenticate if we have a token
      if (this.token) {
        this.authenticate(this.token);
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from WebSocket server:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, don't reconnect automatically
        this.socket.connect();
      } else {
        // Try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.socket?.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Authentication
  authenticate(token: string) {
    this.token = token;
    
    if (this.socket && this.socket.connected) {
      this.socket.auth = { token };
      this.socket.disconnect().connect();
    }
  }

  // Event listeners
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    this.socket?.on(event, callback);
  }

  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    this.socket?.off(event, callback);
  }

  // Emit events
  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  // Table operations
  joinTable(tableId: string) {
    this.emit('join_table', { tableId });
  }

  leaveTable(tableId: string) {
    this.emit('leave_table', { tableId });
  }

  // Order operations
  updateOrderStatus(orderId: string, status: string, tableId?: string) {
    this.emit('order_update', { orderId, status, tableId });
  }

  notifyOrderReady(orderId: string, tableNumber: string, itemName: string, quantity: number, waiterId?: string) {
    this.emit('order_ready', { orderId, tableNumber, itemName, quantity, waiterId });
  }

  // Menu operations
  updateMenuItemAvailability(itemId: string, isAvailable: boolean, name: string) {
    this.emit('menu_update', { itemId, isAvailable, name });
  }

  // Table operations
  updateTableStatus(tableId: string, newStatus: string, oldStatus: string) {
    this.emit('table_status_changed', { tableId, newStatus, oldStatus });
  }

  // Reservation operations
  updateReservation(reservationId: string, status: string, partySize: number, tableId?: string) {
    this.emit('reservation_update', { reservationId, status, partySize, tableId });
  }

  // Marketing operations
  broadcastMarketing(campaignId: string, title: string, body: string, targetSegment?: string, restaurantId?: string) {
    this.emit('marketing_broadcast', { campaignId, title, body, targetSegment, restaurantId });
  }

  // Connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Cleanup
  disconnect() {
    this.socket?.disconnect();
    this.token = null;
  }
}

// Singleton instance
export const socket = new ReservaYaSocket();