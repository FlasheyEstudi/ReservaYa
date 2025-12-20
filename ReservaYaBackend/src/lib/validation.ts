import { z } from 'zod';

// Role enums for validation
export const EmployeeRoleEnum = z.enum(['manager', 'chef', 'waiter', 'host', 'bartender']);
export const OrderStatusEnum = z.enum(['open', 'payment_pending', 'closed']);
export const OrderItemStatusEnum = z.enum(['pending', 'cooking', 'ready', 'served']);
export const TableStatusEnum = z.enum(['free', 'occupied', 'dirty', 'reserved']);
export const ReservationStatusEnum = z.enum(['confirmed', 'seated', 'cancelled', 'no_show']);
export const MenuItemStationEnum = z.enum(['kitchen', 'bar']);
export const RestaurantStatusEnum = z.enum(['pending', 'active', 'suspended']);

// Auth schemas
export const EmployeeLoginSchema = z.object({
  restaurant_code: z.string().min(1, 'Restaurant code is required'),
  email: z.string().email('Valid email is required'),
  pin: z.string().min(4, 'PIN must be at least 4 characters')
});

export const BusinessRegistrationSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  tax_id: z.string().optional(),
  owner_email: z.string().email('Valid email is required'),
  owner_password: z.string().min(8, 'Password must be at least 8 characters'),
  owner_full_name: z.string().optional()
});

// Restaurant management schemas
export const TableLayoutSchema = z.object({
  tables: z.array(z.object({
    id: z.string().optional(),
    table_number: z.string().optional(),
    capacity: z.number().min(1),
    pos_x: z.number(),
    pos_y: z.number(),
    shape: z.enum(['rectangle', 'circle', 'square']).optional().default('rectangle')
  }))
});

export const MenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0),
  category: z.string().min(1, 'Category is required'),
  station: MenuItemStationEnum
});

// Order schemas
export const CreateOrderSchema = z.object({
  table_id: z.string().min(1, 'Table ID is required'),
  items: z.array(z.object({
    menu_item_id: z.string().min(1, 'Menu item ID is required'),
    quantity: z.number().min(1),
    notes: z.string().optional()
  }))
});

export const UpdateOrderItemStatusSchema = z.object({
  status: OrderItemStatusEnum
});

// Reservation schemas
export const CreateReservationSchema = z.object({
  restaurant_id: z.string().min(1, 'Restaurant ID is required'),
  reservation_time: z.string().datetime(),
  party_size: z.number().min(1),
  user_id: z.string().optional(),
  table_id: z.string().optional()
});

export const SearchRestaurantsSchema = z.object({
  city: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  party: z.number().nullable().optional()
});


// Marketing schemas
export const MarketingCampaignSchema = z.object({
  restaurant_id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  target_segment: z.string().optional()
});

export type EmployeeLoginInput = z.infer<typeof EmployeeLoginSchema>;
export type BusinessRegistrationInput = z.infer<typeof BusinessRegistrationSchema>;
export type TableLayoutInput = z.infer<typeof TableLayoutSchema>;
export type MenuItemInput = z.infer<typeof MenuItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderItemStatusInput = z.infer<typeof UpdateOrderItemStatusSchema>;
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
export type SearchRestaurantsInput = z.infer<typeof SearchRestaurantsSchema>;
export type MarketingCampaignInput = z.infer<typeof MarketingCampaignSchema>;