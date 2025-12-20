import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function getRestaurantFromToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { rid?: string; restaurantId?: string };
        return decoded.rid || decoded.restaurantId || null;
    } catch {
        return null;
    }
}

// POST /api/restaurant/inventory/[id]/movement - Register stock movement
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: itemId } = await params;
        const body = await req.json();
        const { type, quantity, reason } = body;

        if (!type || !['in', 'out', 'adjustment'].includes(type)) {
            return NextResponse.json({ error: 'Invalid movement type' }, { status: 400 });
        }

        if (!quantity || quantity <= 0) {
            return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
        }

        // Get current item
        const item = await db.inventoryItem.findFirst({
            where: { id: itemId, restaurantId }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Calculate new stock
        let newStock = Number(item.currentStock);
        if (type === 'in') {
            newStock += quantity;
        } else if (type === 'out') {
            newStock -= quantity;
            if (newStock < 0) {
                return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
            }
        } else if (type === 'adjustment') {
            newStock = quantity; // Direct set for adjustments
        }

        // Create movement and update stock in transaction
        const [movement] = await db.$transaction([
            db.inventoryMovement.create({
                data: {
                    itemId,
                    type,
                    quantity,
                    reason: reason || (type === 'in' ? 'Entrada de stock' : type === 'out' ? 'Salida de stock' : 'Ajuste de inventario')
                }
            }),
            db.inventoryItem.update({
                where: { id: itemId },
                data: { currentStock: newStock }
            })
        ]);

        return NextResponse.json({
            movement,
            newStock,
            message: 'Movement registered successfully'
        }, { status: 201 });
    } catch (error) {
        console.error('Error registering movement:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
