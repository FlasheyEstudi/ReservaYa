import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';
import { TableLayoutSchema } from '@/lib/validation';
import { checkLimit, limitExceededResponse } from '@/lib/featureGate';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST /api/restaurant/layout - Update restaurant layout
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
    const { tables } = TableLayoutSchema.parse(body);

    // Get existing tables for this restaurant
    const existingTables = await db.table.findMany({
      where: { restaurantId: user.rid }
    });

    // Check table limit for new tables being added
    const existingTableIds = new Set(existingTables.map(t => t.id));
    const newTablesCount = tables.filter(t => !t.id || !existingTableIds.has(t.id)).length;

    if (newTablesCount > 0) {
      const limitCheck = await checkLimit(user.rid, 'tables');
      const wouldExceed = existingTables.length + newTablesCount > limitCheck.max;

      if (wouldExceed) {
        return NextResponse.json(
          limitExceededResponse('mesas', existingTables.length, limitCheck.max, limitCheck.planName),
          { status: 403 }
        );
      }
    }
    const incomingTableIds = new Set(tables.filter(t => t.id).map(t => t.id!));

    // Find tables to delete (exist in DB but not in incoming array)
    const tablesToDelete = Array.from(existingTableIds).filter(id => !incomingTableIds.has(id));

    // Use transaction for atomic operations
    await db.$transaction(async (tx) => {
      // Delete tables that are not in the incoming array
      if (tablesToDelete.length > 0) {
        await tx.table.deleteMany({
          where: {
            id: { in: tablesToDelete },
            restaurantId: user.rid
          }
        });
      }

      // Upsert tables
      for (const tableData of tables) {
        if (tableData.id) {
          // Update existing table
          await tx.table.update({
            where: {
              id: tableData.id,
              restaurantId: user.rid
            },
            data: {
              tableNumber: tableData.table_number,
              capacity: tableData.capacity,
              posX: tableData.pos_x,
              posY: tableData.pos_y
            }
          });
        } else {
          // Create new table
          await tx.table.create({
            data: {
              restaurantId: user.rid,
              tableNumber: tableData.table_number,
              capacity: tableData.capacity,
              posX: tableData.pos_x,
              posY: tableData.pos_y,
              currentStatus: 'free'
            }
          });
        }
      }
    });

    // Return updated layout
    const updatedTables = await db.table.findMany({
      where: { restaurantId: user.rid },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      message: 'Layout updated successfully',
      tables: updatedTables.map(table => ({
        id: table.id,
        table_number: table.tableNumber,
        capacity: table.capacity,
        pos_x: table.posX,
        pos_y: table.posY,
        current_status: table.currentStatus
      }))
    });

  } catch (error) {
    console.error('Layout update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/restaurant/layout - Get restaurant layout
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult;

    const tables = await db.table.findMany({
      where: { restaurantId: user.rid },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      tables: tables.map(table => ({
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        posX: table.posX,
        posY: table.posY,
        currentStatus: table.currentStatus
      }))
    });

  } catch (error) {
    console.error('Layout fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}