import { create } from 'zustand';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface OrderStore {
  // Current table being served
  currentTableId: string | null;
  setCurrentTableId: (tableId: string | null) => void;

  // Cart items for current order
  cartItems: OrderItem[];
  addItem: (item: Omit<OrderItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;

  // Order submission
  isSubmitting: boolean;
  submitOrder: (tableId: string, employeeId: string) => Promise<void>;

  // Order totals
  getOrderTotal: () => number;
  getItemCount: () => number;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  currentTableId: null,
  cartItems: [],
  isSubmitting: false,

  setCurrentTableId: (tableId) => set({ currentTableId: tableId }),

  addItem: (item) => set((state) => {
    const existingItem = state.cartItems.find(
      (cartItem) => cartItem.menuItemId === item.menuItemId
    );

    if (existingItem) {
      return {
        cartItems: state.cartItems.map((cartItem) =>
          cartItem.menuItemId === item.menuItemId
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        ),
      };
    }

    const newItem: OrderItem = {
      ...item,
      id: `${item.menuItemId}-${Date.now()}`,
    };

    return {
      cartItems: [...state.cartItems, newItem],
    };
  }),

  removeItem: (itemId) => set((state) => ({
    cartItems: state.cartItems.filter((item) => item.id !== itemId),
  })),

  updateItemQuantity: (itemId, quantity) => set((state) => ({
    cartItems: state.cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
    ),
  })),

  updateItemNotes: (itemId, notes) => set((state) => ({
    cartItems: state.cartItems.map((item) =>
      item.id === itemId ? { ...item, notes } : item
    ),
  })),

  clearCart: () => set({ cartItems: [] }),

  submitOrder: async (tableId, employeeId) => {
    const { cartItems, clearCart } = get();

    if (cartItems.length === 0) {
      throw new Error('No items in cart');
    }

    set({ isSubmitting: true });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      const restaurantId = localStorage.getItem('restaurantId');

      // Calculate total
      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Create order data matching backend schema
      const orderData = {
        table_id: tableId,
        restaurant_id: restaurantId,
        items: cartItems.map((item) => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          unit_price: item.price,
          notes: item.notes || '',
        })),
      };

      // Call real API instead of mock
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit order');
      }

      // Clear cart after successful submission
      clearCart();

    } catch (error) {
      console.error('Failed to submit order:', error);
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  getOrderTotal: () => {
    const { cartItems } = get();
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    const { cartItems } = get();
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  },
}));