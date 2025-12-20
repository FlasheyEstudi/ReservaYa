import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';
import { MenuItemSchema } from '@/lib/validation';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/menu - Get restaurant menu
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult;

    const menuItems = await db.menuItem.findMany({
      where: { restaurantId: user.rid },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      menu_items: menuItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        station: item.station,
        is_available: item.isAvailable
      }))
    });

  } catch (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/menu - Create new menu item
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const menuItemData = MenuItemSchema.parse(body);

    const menuItem = await db.menuItem.create({
      data: {
        restaurantId: user.rid,
        name: menuItemData.name,
        description: menuItemData.description,
        price: menuItemData.price,
        category: menuItemData.category,
        station: menuItemData.station,
        isAvailable: true
      }
    });

    return NextResponse.json({
      message: 'Menu item created successfully',
      menu_item: {
        id: menuItem.id,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        category: menuItem.category,
        station: menuItem.station,
        is_available: menuItem.isAvailable
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Menu item creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}