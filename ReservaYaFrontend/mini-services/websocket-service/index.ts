import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const PORT = 3002;

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store connected users and their sessions
interface ConnectedUser {
  id: string;
  socketId: string;
  userId: string;
  userRole: string;
  restaurantId?: string;
  connectedAt: Date;
}

interface ActiveOrder {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  items: any[];
  status: 'pending' | 'cooking' | 'ready' | 'delivered';
  createdAt: Date;
  assignedTo?: string; // Chef or waiter ID
}

interface TableStatus {
  id: string;
  restaurantId: string;
  tableNumber: string;
  status: 'free' | 'occupied' | 'reserved' | 'payment_pending' | 'cleaning';
  lastUpdated: Date;
}

const connectedUsers = new Map<string, ConnectedUser>();
const activeOrders = new Map<string, ActiveOrder>();
const tableStatuses = new Map<string, TableStatus>();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User authentication and session setup
  socket.on('authenticate', (data: { userId: string; userRole: string; restaurantId?: string }) => {
    const user: ConnectedUser = {
      id: uuidv4(),
      socketId: socket.id,
      userId: data.userId,
      userRole: data.userRole,
      restaurantId: data.restaurantId,
      connectedAt: new Date()
    };

    connectedUsers.set(socket.id, user);
    console.log(`User authenticated:`, { userId: data.userId, role: data.userRole, restaurant: data.restaurantId });

    // Join appropriate rooms
    socket.join(`user:${data.userId}`);
    
    if (data.restaurantId) {
      socket.join(`restaurant:${data.restaurantId}`);
      socket.join(`role:${data.userRole}:${data.restaurantId}`);
    }

    // Send confirmation
    socket.emit('authenticated', { success: true, user });
  });

  // Kitchen events
  socket.on('join_kitchen', (restaurantId: string) => {
    socket.join(`kitchen:${restaurantId}`);
    console.log(`User ${socket.id} joined kitchen for restaurant ${restaurantId}`);
  });

  socket.on('order_status_update', (data: { orderId: string; status: string; itemId?: string }) => {
    const order = activeOrders.get(data.orderId);
    if (!order) return;

    // Update order status
    if (data.itemId) {
      // Update specific item status
      const item = order.items.find((item: any) => item.id === data.itemId);
      if (item) {
        item.status = data.status;
      }
    } else {
      // Update entire order status
      order.status = data.status as any;
    }

    // Broadcast to relevant parties
    const restaurantId = order.restaurantId;
    
    // Notify kitchen staff
    io.to(`kitchen:${restaurantId}`).emit('order_updated', {
      orderId: order.id,
      status: order.status,
      items: order.items,
      tableNumber: order.tableNumber
    });

    // Notify waiters if order is ready
    if (order.status === 'ready') {
      io.to(`role:WAITER:${restaurantId}`).emit('order_ready', {
        orderId: order.id,
        tableNumber: order.tableNumber,
        items: order.items.filter((item: any) => item.status === 'ready')
      });

      // Vibrate connected waiters (client-side implementation)
      io.to(`role:WAITER:${restaurantId}`).emit('vibrate', {
        pattern: [200, 100, 200]
      });
    }

    console.log(`Order ${data.orderId} status updated to:`, data.status);
  });

  // New order from waiter
  socket.on('new_order', (data: {
    restaurantId: string;
    tableId: string;
    tableNumber: string;
    items: any[];
    employeeId: string;
  }) => {
    const order: ActiveOrder = {
      id: uuidv4(),
      restaurantId: data.restaurantId,
      tableId: data.tableId,
      tableNumber: data.tableNumber,
      items: data.items.map((item: any) => ({
        ...item,
        status: 'pending'
      })),
      status: 'pending',
      createdAt: new Date(),
      assignedTo: data.employeeId
    };

    activeOrders.set(order.id, order);

    // Broadcast to kitchen
    io.to(`kitchen:${data.restaurantId}`).emit('new_ticket', {
      orderId: order.id,
      tableNumber: order.tableNumber,
      items: order.items,
      time: order.createdAt
    });

    // Notify host about table status change
    io.to(`role:HOST:${data.restaurantId}`).emit('table_status_change', {
      tableId: data.tableId,
      tableNumber: data.tableNumber,
      newStatus: 'occupied',
      timestamp: new Date()
    });

    console.log(`New order created:`, order);
  });

  // Table management events
  socket.on('table_status_change', (data: {
    restaurantId: string;
    tableId: string;
    tableNumber: string;
    newStatus: string;
    employeeId: string;
  }) => {
    const tableStatus: TableStatus = {
      id: uuidv4(),
      restaurantId: data.restaurantId,
      tableNumber: data.tableNumber,
      status: data.newStatus as any,
      lastUpdated: new Date()
    };

    tableStatuses.set(`${data.restaurantId}:${data.tableId}`, tableStatus);

    // Broadcast to all restaurant staff
    io.to(`restaurant:${data.restaurantId}`).emit('table_status_change', {
      tableId: data.tableId,
      tableNumber: data.tableNumber,
      newStatus: data.newStatus,
      updatedBy: data.employeeId,
      timestamp: new Date()
    });

    console.log(`Table ${data.tableNumber} status changed to:`, data.newStatus);
  });

  // Reservation events
  socket.on('new_reservation', (data: {
    restaurantId: string;
    customerName: string;
    people: number;
    time: string;
    date: string;
  }) => {
    // Notify restaurant staff
    io.to(`restaurant:${data.restaurantId}`).emit('new_reservation', data);
    io.to(`role:MANAGER:${data.restaurantId}`).emit('new_reservation', data);

    console.log(`New reservation:`, data);
  });

  // Marketing events (Admin to customers)
  socket.on('marketing_push', (data: {
    title: string;
    message: string;
    segment?: string;
    targetUserIds?: string[];
  }) => {
    if (data.targetUserIds) {
      // Send to specific users
      data.targetUserIds.forEach(userId => {
        io.to(`user:${userId}`).emit('marketing_push', {
          title: data.title,
          message: data.message
        });
      });
    } else {
      // Send to all connected customers
      // In a real implementation, you'd filter by segment
      connectedUsers.forEach(user => {
        if (user.userRole === 'CUSTOMER') {
          io.to(user.socketId).emit('marketing_push', {
            title: data.title,
            message: data.message
          });
        }
      });
    }

    console.log(`Marketing push sent:`, data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`User disconnected:`, { userId: user.userId, role: user.userRole });
      connectedUsers.delete(socket.id);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Health check endpoint
httpServer.on('request', (req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      connectedUsers: connectedUsers.size,
      activeOrders: activeOrders.size,
      uptime: process.uptime()
    }));
  }
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`WebSocket service running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});