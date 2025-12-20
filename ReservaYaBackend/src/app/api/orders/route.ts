import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';
import { CreateOrderSchema } from '@/lib/validation';
import { WebSocketService } from '@/lib/websocket';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3001',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult;

    // Check if user has waiter role
    const roleCheck = requireRole(['waiter', 'manager'])(user, null as any);
    if (roleCheck) {
      return roleCheck;
    }

    const body = await request.json();
    const { table_id, items } = CreateOrderSchema.parse(body);

    // Start transaction for ACID compliance
    const result = await db.$transaction(async (tx) => {
      // Check if there's already an open order for this table
      let order = await tx.order.findFirst({
        where: {
          tableId: table_id,
          restaurantId: user.rid,
          status: 'open'
        },
        include: {
          orderItems: true
        }
      });

      // If no open order exists, ensuring table is not occupied by race condition
      if (!order) {
        // Double check table status atomically within transaction
        const tableToCheck = await tx.table.findFirst({
          where: { id: table_id, restaurantId: user.rid }
        });

        // If table is occupied but we didn't find an open order above, it means:
        // 1. Another transaction just took it (Race condition)
        // 2. It's in a zombie state (Occupied but no order) - in this case we might want to allow forcing, but for safety we block.
        if (tableToCheck?.currentStatus === 'occupied') {
          throw new Error('Table is currently occupied. Please refresh.');
        }

        order = await tx.order.create({
          data: {
            restaurantId: user.rid,
            tableId: table_id,
            waiterId: user.uid,
            status: 'open',
            total: 0
          },
          include: {
            orderItems: true
          }
        });
      }

      // Get menu items to calculate prices and stations
      const menuItemIds = items.map(item => item.menu_item_id);
      const menuItems = await tx.menuItem.findMany({
        where: {
          id: { in: menuItemIds },
          restaurantId: user.rid,
          isAvailable: true
        }
      });

      if (menuItems.length !== menuItemIds.length) {
        throw new Error('Some menu items are not available');
      }

      // Create order items
      const orderItemsToCreate = items.map(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
        if (!menuItem) {
          throw new Error(`Menu item ${item.menu_item_id} not found`);
        }

        return {
          orderId: order.id,
          menuItemId: item.menu_item_id,
          quantity: item.quantity,
          notes: item.notes || '',
          status: 'pending',
          station: menuItem.station || 'kitchen' // Default to kitchen if null
        };
      });

      await tx.orderItem.createMany({
        data: orderItemsToCreate
      });

      // Update table status to occupied
      await tx.table.update({
        where: {
          id: table_id,
          restaurantId: user.rid
        },
        data: {
          currentStatus: 'occupied'
        }
      });

      // Calculate order total
      const allOrderItems = await tx.orderItem.findMany({
        where: { orderId: order.id },
        include: {
          menuItem: true
        }
      });

      const total = allOrderItems.reduce((sum, item) => {
        return sum + (Number(item.menuItem.price) * item.quantity);
      }, 0);

      await tx.order.update({
        where: { id: order.id },
        data: { total }
      });

      return {
        order: {
          ...order,
          total
        },
        orderItems: orderItemsToCreate,
        menuItems
      };
    });

    // WebSocket notifications - Emit new tickets to kitchen/bar
    await WebSocketService.emitNewTicket(
      user.rid,
      result.order.id,
      table_id,
      result.orderItems
    );

    return NextResponse.json({
      message: 'Order created successfully',
      order: {
        id: result.order.id,
        table_id: result.order.tableId,
        waiter_id: result.order.waiterId,
        status: result.order.status,
        total: result.order.total,
        created_at: result.order.createdAt
      },
      items: result.orderItems.map(item => ({
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes,
        status: item.status,
        station: item.station
      }))
    }, { status: 201 });

  } catch (error) {
    console.error('Order creation error:', error);

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/orders - Get orders (filtered by role)
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const table_id = searchParams.get('table_id');

    // Build where clause based on user role
    let whereClause: any = {
      restaurantId: user.rid
    };

    if (status) {
      whereClause.status = status;
    }

    if (table_id) {
      whereClause.tableId = table_id;
    }

    // Waiters can only see their own orders
    if (user.role === 'waiter') {
      whereClause.waiterId = user.uid;
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        table: true,
        waiter: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        table_id: order.tableId,
        table_number: order.table.tableNumber,
        waiter_id: order.waiterId,
        waiter_email: order.waiter?.email,
        status: order.status,
        total: order.total,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        items: order.orderItems.map(item => ({
          id: item.id,
          menu_item_id: item.menuItemId,
          menu_item_name: item.menuItem.name,
          quantity: item.quantity,
          notes: item.notes,
          status: item.status,
          station: item.station,
          price: item.menuItem.price
        }))
      }))
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}