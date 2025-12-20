// Export all stores for easy importing
export { useAuthStore } from './authStore';
export { useOrderStore } from './orderStore';
export { useRestaurantStore } from './restaurantStore';
export { useWebSocketStore } from './websocketStore';

// Export types
export type { User, AuthState } from './authStore';
export type { OrderItem } from './orderStore';
export type {
  RestaurantConfig,
  TableLayout,
  TableItem
} from './restaurantStore';
export type { Notification, WebSocketState } from './websocketStore';