# ReservaYa Backend API Documentation

## Overview
ReservaYa is a comprehensive restaurant management system with real-time capabilities. This backend provides REST APIs for all restaurant operations and WebSocket services for real-time communication.

## Base URL
- API: `http://localhost:3000/api`
- WebSocket: `http://localhost:3002` (via gateway: use `/?XTransformPort=3002`)

## Authentication
All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

## API Endpoints

### Authentication Module

#### Employee Login
**POST** `/api/auth/employee/login`

Login for restaurant employees using PIN authentication.

**Request Body:**
```json
{
  "restaurant_code": "REST-001",
  "email": "employee@restaurant.com",
  "pin": "123456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "employee_id",
    "role": "waiter",
    "email": "employee@restaurant.com",
    "restaurantId": "restaurant_id",
    "restaurantName": "Restaurant Name"
  }
}
```

#### Business Registration
**POST** `/api/auth/register-business`

Register a new restaurant and create a manager account.

**Request Body:**
```json
{
  "name": "My Restaurant",
  "tax_id": "123456789",
  "owner_email": "owner@restaurant.com",
  "owner_pin": "123456",
  "owner_full_name": "John Owner"
}
```

**Response:**
```json
{
  "message": "Restaurant registered successfully. Pending approval.",
  "business_code": "MYR-001",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "restaurant": {
    "id": "restaurant_id",
    "name": "My Restaurant",
    "businessCode": "MYR-001",
    "status": "pending"
  },
  "manager": {
    "id": "manager_id",
    "email": "owner@restaurant.com",
    "role": "manager"
  }
}
```

### Restaurant Management Module

#### Layout Management
**GET** `/api/restaurant/layout`

Get restaurant table layout.

**Response:**
```json
{
  "tables": [
    {
      "id": "table_id",
      "table_number": "T1",
      "capacity": 4,
      "pos_x": 100,
      "pos_y": 200,
      "current_status": "free"
    }
  ]
}
```

**POST** `/api/restaurant/layout`

Update restaurant table layout (Manager only).

**Request Body:**
```json
{
  "tables": [
    {
      "id": "existing_table_id",
      "table_number": "T1",
      "capacity": 4,
      "pos_x": 100,
      "pos_y": 200
    },
    {
      "table_number": "T2",
      "capacity": 2,
      "pos_x": 300,
      "pos_y": 200
    }
  ]
}
```

#### Menu Management
**GET** `/api/menu`

Get restaurant menu.

**Response:**
```json
{
  "menu_items": [
    {
      "id": "item_id",
      "name": "Hamburger",
      "description": "Delicious beef burger",
      "price": 12.50,
      "category": "Main Course",
      "station": "kitchen",
      "is_available": true
    }
  ]
}
```

**POST** `/api/menu`

Create new menu item (Manager only).

**Request Body:**
```json
{
  "name": "New Dish",
  "description": "Description of the dish",
  "price": 15.00,
  "category": "Main Course",
  "station": "kitchen"
}
```

**PATCH** `/api/menu/[itemId]/availability`

Update menu item availability (Manager only).

**Request Body:**
```json
{
  "is_available": false
}
```

### Operations Module

#### Order Management
**POST** `/api/orders`

Create new order (Waiter/Manager).

**Request Body:**
```json
{
  "table_id": "table_id",
  "items": [
    {
      "menu_item_id": "item_id",
      "quantity": 2,
      "notes": "Extra cheese"
    }
  ]
}
```

**GET** `/api/orders`

Get orders (filtered by user role).

**Query Parameters:**
- `status`: Filter by order status
- `table_id`: Filter by table

**Response:**
```json
{
  "orders": [
    {
      "id": "order_id",
      "table_id": "table_id",
      "table_number": "T1",
      "waiter_id": "waiter_id",
      "waiter_email": "waiter@restaurant.com",
      "status": "open",
      "total": 25.00,
      "created_at": "2023-10-20T18:30:00Z",
      "items": [
        {
          "id": "item_id",
          "menu_item_id": "menu_item_id",
          "menu_item_name": "Hamburger",
          "quantity": 2,
          "notes": "Extra cheese",
          "status": "pending",
          "station": "kitchen",
          "price": 12.50
        }
      ]
    }
  ]
}
```

#### Order Item Status
**PATCH** `/api/orders/items/[itemId]/status`

Update order item status (Chef/Manager/Waiter).

**Request Body:**
```json
{
  "status": "ready"
}
```

### User-Facing Module

#### Restaurant Search
**GET** `/api/search`

Search restaurants with availability checking.

**Query Parameters:**
- `city`: Filter by city
- `date`: Search date (ISO string)
- `party`: Party size

**Response:**
```json
{
  "restaurants": [
    {
      "id": "restaurant_id",
      "name": "Restaurant Name",
      "business_code": "RES-001",
      "status": "active",
      "available_capacity": 20,
      "total_capacity": 50,
      "average_rating": 4.5,
      "review_count": 150,
      "table_count": 15
    }
  ],
  "filters": {
    "city": "New York",
    "date": "2023-10-20T19:00:00Z",
    "party_size": 4
  }
}
```

#### Reservations
**POST** `/api/reservations`

Create new reservation.

**Request Body:**
```json
{
  "restaurant_id": "restaurant_id",
  "reservation_time": "2023-10-20T19:00:00Z",
  "party_size": 4,
  "user_id": "user_id",
  "table_id": "table_id"
}
```

**GET** `/api/reservations`

Get reservations (with filtering).

**Query Parameters:**
- `restaurant_id`: Filter by restaurant
- `user_id`: Filter by user
- `status`: Filter by status
- `date`: Filter by date

### Admin Module

#### Dashboard Stats
**GET** `/api/admin/stats`

Get dashboard KPIs (Admin/Manager).

**Response:**
```json
{
  "stats": {
    "overview": {
      "total_revenue": 15000.00,
      "total_orders": 250,
      "active_restaurants": 5,
      "total_employees": 50,
      "total_tables": 100
    },
    "today": {
      "orders": 25,
      "reservations": 15,
      "revenue": 1500.00
    },
    "orders_by_status": {
      "open": 5,
      "payment_pending": 3,
      "closed": 17
    },
    "recent_orders": [...],
    "restaurant_details": {...}
  },
  "generated_at": "2023-10-20T18:30:00Z",
  "user_role": "manager"
}
```

#### Marketing Campaigns
**POST** `/api/admin/marketing/broadcast`

Send marketing campaign (Admin/Manager).

**Request Body:**
```json
{
  "restaurant_id": "restaurant_id",
  "title": "Special Offer!",
  "body": "Get 20% off this weekend",
  "target_segment": "all_customers"
}
```

**GET** `/api/admin/marketing/broadcast`

Get marketing campaigns.

## WebSocket Events

### Connection
Connect to WebSocket server with JWT authentication:
```javascript
import { socket } from '@/lib/socket';

// Authenticate
socket.authenticate(token);

// Listen for events
socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

### Room Structure
- `restaurant_{id}_admin`: Managers only
- `restaurant_{id}_kitchen`: Kitchen staff
- `restaurant_{id}_bar`: Bar staff  
- `restaurant_{id}_waiters`: All waiters
- `restaurant_{id}_host`: Host staff
- `user_{id}`: Private user channel
- `table_{id}`: Table-specific channel

### Key Events

#### Order Events
- `new_kitchen_ticket`: New order for kitchen
- `new_bar_ticket`: New order for bar
- `order_item_ready`: Item ready for pickup
- `order_status_changed`: Order status updated

#### Menu Events
- `menu_item_availability_changed`: Menu item availability updated

#### Table Events
- `table_status_update`: Table status changed
- `joined_table`: User joined table channel
- `left_table`: User left table channel

#### Reservation Events
- `reservation_status_changed`: Reservation status updated

#### Marketing Events
- `marketing_push`: New marketing campaign

### Emitting Events
```javascript
// Update order status
socket.updateOrderStatus('order_id', 'ready');

// Notify order ready
socket.notifyOrderReady('order_id', 'T5', 'Hamburger', 2, 'waiter_id');

// Update menu item availability
socket.updateMenuItemAvailability('item_id', false, 'Hamburger');

// Update table status
socket.updateTableStatus('table_id', 'occupied', 'free');
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Database Schema

The system uses the following main entities:
- **Restaurants**: Restaurant information and configuration
- **Employees**: Staff accounts with role-based permissions
- **Users**: Customer accounts
- **Tables**: Restaurant table layout and status
- **MenuItems**: Restaurant menu with station assignments
- **Orders**: Customer orders with items
- **Reservations**: Customer reservations
- **Reviews**: Customer feedback
- **MarketingCampaigns**: Promotional campaigns

## Security Features

- JWT-based authentication
- Role-based access control
- PIN-based employee login
- SQL injection prevention via Prisma ORM
- Input validation with Zod schemas
- CORS protection
- Serializable transactions for reservation booking

## Real-time Features

- Live order status updates
- Kitchen display system (KDS) integration
- Table status synchronization
- Menu availability updates
- Reservation notifications
- Marketing campaign broadcasts

## Deployment Notes

- WebSocket service runs on port 3002
- Main API runs on port 3000
- Environment variables needed for JWT secret and database connection
- Redis caching recommended for production stats calculations