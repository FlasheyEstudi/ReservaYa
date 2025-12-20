import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.WEBSOCKET_PORT || 3002;
const HTTP_PORT = process.env.HTTP_PORT || 8002;

// Create HTTP server for health checks and emit endpoints
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', port: PORT, timestamp: new Date().toISOString() }));
  } else if (req.url === '/emit' && req.method === 'POST') {
    // Handle emit requests from API endpoints
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { room, event, data } = JSON.parse(body);
        io.to(room).emit(event, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, room, event }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Create Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// In-memory storage for user socket mappings
const userSockets = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, any>(); // socketId -> user data

// JWT verification (simplified - in production, use the same logic as backend)
const verifyToken = (token: string): any => {
  try {
    // In a real implementation, this would verify the JWT signature
    // For now, we'll decode it (NOT SECURE - FOR DEMO ONLY)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload;
  } catch (error) {
    return null;
  }
};

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication token required'));
  }

  const user = verifyToken(token);
  if (!user) {
    return next(new Error('Invalid authentication token'));
  }

  socket.data.user = user;
  next();
});

// Connection handler
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`User connected: ${user.email} (${user.role}) - Socket: ${socket.id}`);

  // Store socket mappings
  userSockets.set(user.uid, socket.id);
  socketUsers.set(socket.id, user);

  // Join user to appropriate rooms based on role and restaurant
  const restaurantId = user.rid;
  
  // Join personal room
  socket.join(`user_${user.uid}`);
  
  // Join restaurant-specific rooms based on role
  socket.join(`restaurant_${restaurantId}_all`);
  
  switch (user.role) {
    case 'manager':
      socket.join(`restaurant_${restaurantId}_admin`);
      socket.join(`restaurant_${restaurantId}_waiters`);
      break;
    case 'chef':
      socket.join(`restaurant_${restaurantId}_kitchen`);
      break;
    case 'waiter':
      socket.join(`restaurant_${restaurantId}_waiters`);
      break;
    case 'host':
      socket.join(`restaurant_${restaurantId}_host`);
      break;
  }

  // Join station-specific rooms for kitchen/bar staff
  if (user.role === 'chef') {
    socket.join(`restaurant_${restaurantId}_kitchen`);
    socket.join(`restaurant_${restaurantId}_bar`);
  }

  // Send welcome message
  socket.emit('connected', {
    message: 'Connected to ReservaYa WebSocket service',
    user: {
      id: user.uid,
      email: user.email,
      role: user.role,
      restaurantId: restaurantId
    },
    rooms: Array.from(socket.rooms)
  });

  // Handle joining a specific table (for customers viewing their bill)
  socket.on('join_table', (data) => {
    const { tableId } = data;
    if (tableId) {
      socket.join(`table_${tableId}`);
      socket.emit('joined_table', { tableId });
    }
  });

  // Handle leaving a table
  socket.on('leave_table', (data) => {
    const { tableId } = data;
    if (tableId) {
      socket.leave(`table_${tableId}`);
      socket.emit('left_table', { tableId });
    }
  });

  // Handle custom events for different operations
  socket.on('order_update', (data) => {
    const { orderId, status, tableId } = data;
    
    // Notify relevant rooms about order updates
    if (tableId) {
      io.to(`table_${tableId}`).emit('order_status_changed', {
        orderId,
        status,
        timestamp: new Date().toISOString()
      });
    }

    // Notify kitchen staff about order updates
    io.to(`restaurant_${restaurantId}_kitchen`).emit('kitchen_order_update', {
      orderId,
      status,
      updatedBy: user.email
    });
  });

  socket.on('menu_update', (data) => {
    const { itemId, isAvailable, name } = data;
    
    // Notify all waiters about menu changes
    io.to(`restaurant_${restaurantId}_waiters`).emit('menu_item_availability_changed', {
      itemId,
      isAvailable,
      name,
      updatedBy: user.email,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('new_ticket', (data) => {
    const { orderId, tableId, items, station } = data;
    
    // Send to appropriate station room
    if (station === 'kitchen') {
      io.to(`restaurant_${restaurantId}_kitchen`).emit('new_kitchen_ticket', {
        orderId,
        tableId,
        items: items.filter((item: any) => item.station === 'kitchen'),
        timestamp: new Date().toISOString()
      });
    } else if (station === 'bar') {
      io.to(`restaurant_${restaurantId}_bar`).emit('new_bar_ticket', {
        orderId,
        tableId,
        items: items.filter((item: any) => item.station === 'bar'),
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('order_ready', (data) => {
    const { orderId, tableNumber, itemName, quantity, waiterId } = data;
    
    // Notify specific waiter if waiterId is provided
    if (waiterId) {
      const waiterSocketId = userSockets.get(waiterId);
      if (waiterSocketId) {
        io.to(waiterSocketId).emit('order_item_ready', {
          orderId,
          tableNumber,
          itemName,
          quantity,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Also notify all waiters in the restaurant
    io.to(`restaurant_${restaurantId}_waiters`).emit('order_notification', {
      type: 'ready',
      orderId,
      tableNumber,
      itemName,
      quantity,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('table_status_changed', (data) => {
    const { tableId, newStatus, oldStatus } = data;
    
    // Notify all staff about table status changes
    io.to(`restaurant_${restaurantId}_all`).emit('table_status_update', {
      tableId,
      oldStatus,
      newStatus,
      updatedBy: user.email,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('reservation_update', (data) => {
    const { reservationId, status, partySize, tableId } = data;
    
    // Notify host and waiters about reservation changes
    io.to(`restaurant_${restaurantId}_host`).emit('reservation_status_changed', {
      reservationId,
      status,
      partySize,
      tableId,
      updatedBy: user.email,
      timestamp: new Date().toISOString()
    });
    
    io.to(`restaurant_${restaurantId}_waiters`).emit('reservation_notification', {
      type: 'update',
      reservationId,
      status,
      partySize,
      timestamp: new Date().toISOString()
    });
  });

  // Handle marketing broadcasts
  socket.on('marketing_broadcast', (data) => {
    const { campaignId, title, body, targetSegment, restaurantId: targetRestaurantId } = data;
    
    if (user.role === 'admin' || (user.role === 'manager' && targetRestaurantId === restaurantId)) {
      // Send to all connected clients or specific restaurant
      const targetRoom = targetRestaurantId ? `restaurant_${targetRestaurantId}_all` : 'all';
      
      io.to(targetRoom).emit('marketing_push', {
        campaignId,
        title,
        body,
        targetSegment,
        restaurantId: targetRestaurantId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${user.email} (${user.role}) - Reason: ${reason}`);
    
    // Clean up socket mappings
    userSockets.delete(user.uid);
    socketUsers.delete(socket.id);
    
    // Notify other users about disconnection if relevant
    io.to(`restaurant_${restaurantId}_admin`).emit('staff_disconnected', {
      userId: user.uid,
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString()
    });
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for user ${user.email}:`, error);
  });
});

// Start the server
httpServer.listen(HTTP_PORT, () => {
  console.log(`WebSocket service running on HTTP port ${HTTP_PORT}`);
  console.log(`Socket.IO server listening on port ${PORT}`);
  console.log(`Health check available at http://localhost:${HTTP_PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Export for testing
export { io, userSockets, socketUsers };