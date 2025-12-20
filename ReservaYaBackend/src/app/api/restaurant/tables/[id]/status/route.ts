import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET environment variable is not set');
    }
    return secret;
}
const JWT_SECRET = getJwtSecret();

// Helper to get restaurant ID from token
async function getRestaurantFromToken(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        // Support multiple field names for restaurantId
        return decoded.rid || decoded.restaurantId || decoded.restaurant_id || null;
    } catch {
        return null;
    }
}

// PATCH /api/restaurant/tables/[id]/status - Update table status
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { status } = await req.json();

        // Validate status
        const validStatuses = ['free', 'occupied', 'reserved', 'payment_pending'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Verify table belongs to this restaurant
        const table = await db.table.findFirst({
            where: { id, restaurantId }
        });

        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 });
        }


        // Zombie Check: If status is being set to 'free', verify there are no active orders
        if (status === 'free') {
            const activeOrder = await db.order.findFirst({
                where: {
                    tableId: id,
                    status: { in: ['open', 'payment_pending'] }
                }
            });

            if (activeOrder) {
                return NextResponse.json({
                    error: 'Cannot free table with active orders. Please close order first.',
                    activeOrder: activeOrder.id
                }, { status: 400 });
            }
        }




        const updatedTable = await db.table.update({
            where: { id },
            data: { currentStatus: status }
        });

        return NextResponse.json({
            success: true,
            table: {
                id: updatedTable.id,
                tableNumber: updatedTable.tableNumber,
                status: updatedTable.currentStatus
            }
        });
    } catch (error) {
        console.error('Error updating table status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
