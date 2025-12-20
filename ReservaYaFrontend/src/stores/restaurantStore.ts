import { create } from 'zustand';

export interface RestaurantConfig {
  id: string;
  name: string;
  currency: string;
  taxRate: number;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  settings: {
    autoConfirmReservations: boolean;
    requireDepositForLargeGroups: boolean;
    maxGroupSizeForDeposit: number;
    depositAmount: number;
    cancellationDeadlineHours: number;
  };
}

export interface TableLayout {
  id: string;
  name: string;
  configuration: TableItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableItem {
  id: string;
  type: 'round' | 'square' | 'rectangle' | 'wall' | 'plant';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  number?: string;
  zone?: string;
  capacity?: number;
  isDecorative?: boolean;
}

interface RestaurantStore {
  // Restaurant configuration
  restaurantConfig: RestaurantConfig | null;
  setRestaurantConfig: (config: RestaurantConfig) => void;
  updateRestaurantConfig: (updates: Partial<RestaurantConfig>) => void;

  // Table layouts
  layouts: TableLayout[];
  currentLayout: TableLayout | null;
  setCurrentLayout: (layout: TableLayout | null) => void;
  fetchLayouts: () => Promise<void>;
  saveLayout: (layout: Omit<TableLayout, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLayout: (layoutId: string, updates: Partial<TableLayout>) => Promise<void>;
  deleteLayout: (layoutId: string) => Promise<void>;

  // Menu items
  menuItems: any[];
  fetchMenuItems: () => Promise<void>;
  updateMenuItemAvailability: (itemId: string, isAvailable: boolean) => Promise<void>;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
}

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  restaurantConfig: null,
  layouts: [],
  currentLayout: null,
  menuItems: [],
  isLoading: false,
  isSaving: false,

  setRestaurantConfig: (config) => set({ restaurantConfig: config }),

  updateRestaurantConfig: (updates) => set((state) => ({
    restaurantConfig: state.restaurantConfig
      ? { ...state.restaurantConfig, ...updates }
      : null,
  })),

  setCurrentLayout: (layout) => set({ currentLayout: layout }),

  fetchLayouts: async () => {
    set({ isLoading: true });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/restaurant/layout`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Error fetching layouts');
      }

      const data = await res.json();
      const tables = data.tables || [];

      // Convert tables to layout format
      const configuration: TableItem[] = tables.map((t: any) => ({
        id: t.id,
        type: (t.shape as TableItem['type']) || 'rectangle',
        x: t.pos_x ?? t.posX ?? 100,
        y: t.pos_y ?? t.posY ?? 100,
        width: 80,
        height: 80,
        number: t.table_number ?? t.tableNumber ?? t.id,
        zone: t.area?.name || 'main',
        capacity: t.capacity,
        isDecorative: false,
      }));

      const layout: TableLayout = {
        id: 'main',
        name: 'Distribución Principal',
        configuration,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({
        layouts: [layout],
        currentLayout: layout,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch layouts:', error);
      set({ layouts: [], currentLayout: null, isLoading: false });
    }
  },

  saveLayout: async (layoutData) => {
    set({ isSaving: true });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/restaurant/layout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(layoutData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save layout');
      }

      const data = await res.json();
      const newLayout: TableLayout = {
        ...layoutData,
        id: data.id || Date.now().toString(),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };

      set((state) => ({
        layouts: [...state.layouts, newLayout],
        isSaving: false,
      }));
    } catch (error) {
      console.error('Failed to save layout:', error);
      set({ isSaving: false });
      throw error;
    }
  },

  updateLayout: async (layoutId, updates) => {
    set({ isSaving: true });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/restaurant/layout/${layoutId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update layout');
      }

      set((state) => ({
        layouts: state.layouts.map((layout) =>
          layout.id === layoutId
            ? { ...layout, ...updates, updatedAt: new Date().toISOString() }
            : layout
        ),
        currentLayout: state.currentLayout?.id === layoutId
          ? { ...state.currentLayout, ...updates, updatedAt: new Date().toISOString() }
          : state.currentLayout,
        isSaving: false,
      }));
    } catch (error) {
      console.error('Failed to update layout:', error);
      set({ isSaving: false });
      throw error;
    }
  },

  deleteLayout: async (layoutId) => {
    set({ isSaving: true });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/restaurant/layout/${layoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete layout');
      }

      set((state) => ({
        layouts: state.layouts.filter((layout) => layout.id !== layoutId),
        currentLayout: state.currentLayout?.id === layoutId ? null : state.currentLayout,
        isSaving: false,
      }));
    } catch (error) {
      console.error('Failed to delete layout:', error);
      set({ isSaving: false });
      throw error;
    }
  },

  fetchMenuItems: async () => {
    set({ isLoading: true });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/menu`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Error fetching menu');
      }

      const data = await res.json();
      const menuItems = (data.menu_items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price) || 0,
        category: item.category || item.menuCategory?.name || 'General',
        isAvailable: item.is_available ?? item.isAvailable ?? true,
        sendTo: item.production_station ?? item.productionStation ?? item.station ?? 'kitchen',
      }));

      set({ menuItems, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      set({ menuItems: [], isLoading: false });
    }
  },

  updateMenuItemAvailability: async (itemId, isAvailable) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/menu/${itemId}/availability`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAvailable })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update availability');
      }

      set((state) => ({
        menuItems: state.menuItems.map((item) =>
          item.id === itemId ? { ...item, isAvailable } : item
        ),
      }));
    } catch (error) {
      console.error('Failed to update menu item availability:', error);
      throw error;
    }
  },
}));