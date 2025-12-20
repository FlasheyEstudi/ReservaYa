import { NextRequest } from 'next/server';

// WebSocket service integration
const WEBSOCKET_SERVICE_URL = process.env.WEBSOCKET_SERVICE_URL || 'http://localhost:8002';

export class WebSocketService {
  private static async emitToRoom(room: string, event: string, data: any) {
    try {
      // In a real implementation, this would use Redis pub/sub or direct socket.io admin API
      // For now, we'll make HTTP requests to the WebSocket service
      const response = await fetch(`${WEBSOCKET_SERVICE_URL}/emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room,
          event,
          data
        })
      });

      if (!response.ok) {
        console.error('WebSocket service error:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to emit WebSocket event:', error);
    }
  }

  // Order events
  static async emitNewTicket(restaurantId: string, orderId: string, tableId: string, items: any[]) {
    const kitchenItems = items.filter(item => item.station === 'kitchen');
    const barItems = items.filter(item => item.station === 'bar');

    if (kitchenItems.length > 0) {
      await this.emitToRoom(`restaurant_${restaurantId}_kitchen`, 'new_ticket', {
        orderId,
        tableId,
        items: kitchenItems,
        timestamp: new Date().toISOString()
      });
    }

    if (barItems.length > 0) {
      await this.emitToRoom(`restaurant_${restaurantId}_bar`, 'new_ticket', {
        orderId,
        tableId,
        items: barItems,
        timestamp: new Date().toISOString()
      });
    }
  }

  static async emitOrderReady(restaurantId: string, orderId: string, tableNumber: string, itemName: string, quantity: number, waiterId?: string) {
    // Notify specific waiter if provided
    if (waiterId) {
      await this.emitToRoom(`user_${waiterId}`, 'order_ready', {
        orderId,
        tableNumber,
        itemName,
        quantity,
        timestamp: new Date().toISOString()
      });
    }

    // Also notify all waiters
    await this.emitToRoom(`restaurant_${restaurantId}_waiters`, 'order_notification', {
      type: 'ready',
      orderId,
      tableNumber,
      itemName,
      quantity,
      timestamp: new Date().toISOString()
    });
  }

  // Menu events
  static async emitMenuUpdate(restaurantId: string, itemId: string, isAvailable: boolean, name: string) {
    await this.emitToRoom(`restaurant_${restaurantId}_waiters`, 'menu_update', {
      itemId,
      isAvailable,
      name,
      timestamp: new Date().toISOString()
    });
  }

  // Table events
  static async emitTableStatusUpdate(restaurantId: string, tableId: string, oldStatus: string, newStatus: string, updatedBy: string) {
    await this.emitToRoom(`restaurant_${restaurantId}_all`, 'table_status_changed', {
      tableId,
      oldStatus,
      newStatus,
      updatedBy,
      timestamp: new Date().toISOString()
    });
  }

  // Reservation events
  static async emitReservationUpdate(restaurantId: string, reservationId: string, status: string, partySize: number, tableId?: string) {
    await this.emitToRoom(`restaurant_${restaurantId}_host`, 'reservation_status_changed', {
      reservationId,
      status,
      partySize,
      tableId,
      timestamp: new Date().toISOString()
    });

    await this.emitToRoom(`restaurant_${restaurantId}_waiters`, 'reservation_notification', {
      type: 'update',
      reservationId,
      status,
      partySize,
      timestamp: new Date().toISOString()
    });
  }

  // Marketing events
  static async emitMarketingBroadcast(campaignId: string, title: string, body: string, targetSegment?: string, restaurantId?: string) {
    const targetRoom = restaurantId ? `restaurant_${restaurantId}_all` : 'all';
    await this.emitToRoom(targetRoom, 'marketing_push', {
      campaignId,
      title,
      body,
      targetSegment,
      restaurantId,
      timestamp: new Date().toISOString()
    });
  }
}