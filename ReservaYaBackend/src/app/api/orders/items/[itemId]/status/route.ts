import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';
import { UpdateOrderItemStatusSchema } from '@/lib/validation';
import { WebSocketService } from '@/lib/websocket';

// PATCH /api/orders/items/[itemId]/status - Update order item status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult;

    // Check if user has chef or manager role
    const roleCheck = requireRole(['chef', 'manager', 'waiter'])(user, null as any);
    if (roleCheck) {
      return roleCheck;
    }

    const { itemId } = params;
    const body = await request.json();
    const { status } = UpdateOrderItemStatusSchema.parse(body);

    // Get the order item with related data
    const orderItem = await db.orderItem.findFirst({
      where: {
        id: itemId
      },
      include: {
        order: {
          include: {
            waiter: true,
            table: true
          }
        },
        menuItem: true
      }
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Verify the item belongs to the user's restaurant
    if (orderItem.order.restaurantId !== user.rid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update the order item status
    const updatedItem = await db.orderItem.update({
      where: { id: itemId },
      data: { status }
    });

    // WebSocket notification to waiter when item is ready
    if (status === 'ready' && orderItem.order.waiterId) {
      await WebSocketService.emitOrderReady(
        user.rid,
        orderItem.orderId,
        orderItem.order.table?.tableNumber || '',
        orderItem.menuItem.name,
        orderItem.quantity,
        orderItem.order.waiterId
      );
    }

    return NextResponse.json({
      message: 'Order item status updated successfully',
      order_item: {
        id: updatedItem.id,
        status: updatedItem.status,
        order_id: orderItem.orderId,
        menu_item_name: orderItem.menuItem.name,
        table_number: orderItem.order.table?.tableNumber
      }
    });

  } catch (error) {
    console.error('Order item status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}