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

// GET /api/restaurant/inventory/[id] - Get single item
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const item = await db.inventoryItem.findFirst({
            where: { id, restaurantId },
            include: {
                movements: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ item });
    } catch (error) {
        console.error('Error fetching inventory item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/restaurant/inventory/[id] - Update item
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Verify item belongs to restaurant
        const existing = await db.inventoryItem.findFirst({
            where: { id, restaurantId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        const { name, sku, category, unit, minStock, unitCost } = body;

        const item = await db.inventoryItem.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(sku !== undefined && { sku }),
                ...(category !== undefined && { category }),
                ...(unit !== undefined && { unit }),
                ...(minStock !== undefined && { minStock }),
                ...(unitCost !== undefined && { unitCost })
            }
        });

        return NextResponse.json({ item });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/restaurant/inventory/[id] - Delete item
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify item belongs to restaurant
        const existing = await db.inventoryItem.findFirst({
            where: { id, restaurantId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        await db.inventoryItem.delete({ where: { id } });

        return NextResponse.json({ message: 'Item deleted' });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
