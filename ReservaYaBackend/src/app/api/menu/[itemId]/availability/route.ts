import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';
import { WebSocketService } from '@/lib/websocket';

// PATCH /api/menu/[itemId]/availability - Update menu item availability
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

    // Check if user has manager role
    const roleCheck = requireRole(['manager'])(user, null as any);
    if (roleCheck) {
      return roleCheck;
    }

    const { itemId } = params;
    const body = await request.json();
    const { is_available } = body;

    if (typeof is_available !== 'boolean') {
      return NextResponse.json(
        { error: 'is_available must be a boolean' },
        { status: 400 }
      );
    }

    // Update menu item availability
    const updatedItem = await db.menuItem.update({
      where: {
        id: itemId,
        restaurantId: user.rid // Ensure user can only update their restaurant's items
      },
      data: {
        isAvailable: is_available
      }
    });

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Trigger WebSocket event to notify waiters
    await WebSocketService.emitMenuUpdate(
      user.rid,
      itemId,
      is_available,
      updatedItem.name
    );

    return NextResponse.json({
      message: 'Menu item availability updated successfully',
      menu_item: {
        id: updatedItem.id,
        name: updatedItem.name,
        is_available: updatedItem.isAvailable
      }
    });

  } catch (error) {
    console.error('Menu item availability update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}