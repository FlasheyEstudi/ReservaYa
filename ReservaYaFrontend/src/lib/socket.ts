import io from 'socket.io-client';
import { getSocketUrl } from '@/lib/api';

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

// Socket URL now resolved dynamically via getSocketUrl()

export class ReservaYaSocket {
    private socket: any | null = null;
    private token: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    constructor() {
        // Lazy init via setupSocket when needed or immediately
    }

    public connect(token: string) {
        this.token = token;
        if (!this.socket) {
            this.setupSocket();
        } else {
            if (!this.socket.connected) {
                this.socket.auth = { token };
                this.socket.connect();
            }
        }
    }

    private setupSocket() {
        if (typeof window === 'undefined') return;

        this.socket = io(getSocketUrl(), {
            transports: ['websocket', 'polling'],
            auth: { token: this.token },
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts
        });

        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason: string) => {
            console.log('Disconnected from WebSocket server:', reason);
        });

        this.socket.on('connect_error', (error: Error) => {
            console.error('WebSocket connection error:', error);
        });
    }

    // Join rooms based on role/restaurant
    joinRoom(room: string) {
        this.emit('join_room', room);
    }

    // Event listeners
    on(event: string, callback: any) {
        this.socket?.on(event, callback);
    }

    off(event: string, callback: any) {
        this.socket?.off(event, callback);
    }

    // Emit events
    emit(event: string, data?: any) {
        this.socket?.emit(event, data);
    }

    // Connection status
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    // Cleanup
    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
}

// Singleton instance
export const socket = new ReservaYaSocket();
