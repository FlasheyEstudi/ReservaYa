import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { checkFeature, featureBlockedResponse } from '@/lib/featureGate';

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET environment variable is not set');
    }
    return secret;
}
const JWT_SECRET = getJwtSecret();

// Helper to get restaurant from token
async function getRestaurantFromToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { rid?: string; restaurantId?: string };
        return decoded.rid || decoded.restaurantId || null;
    } catch {
        return null;
    }
}

// GET /api/restaurant/inventory - Get all inventory items
export async function GET(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if inventory feature is enabled for this plan
        const featureCheck = await checkFeature(restaurantId, 'inventory');
        if (!featureCheck.allowed) {
            return NextResponse.json(
                featureBlockedResponse('Inventario', featureCheck.requiredPlan || 'Profesional'),
                { status: 403 }
            );
        }

        const items = await db.inventoryItem.findMany({
            where: { restaurantId },
            include: {
                movements: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                sku: item.sku,
                category: item.category,
                unit: item.unit,
                currentStock: Number(item.currentStock),
                minStock: Number(item.minStock),
                unitCost: Number(item.unitCost),
                lastUpdated: item.updatedAt.toISOString(),
                recentMovements: item.movements.map(m => ({
                    id: m.id,
                    type: m.type,
                    quantity: Number(m.quantity),
                    reason: m.reason,
                    date: m.createdAt.toISOString()
                }))
            }))
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/restaurant/inventory - Create new inventory item
export async function POST(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, sku, category, unit, currentStock, minStock, unitCost } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const item = await db.inventoryItem.create({
            data: {
                restaurantId,
                name,
                sku: sku || null,
                category: category || null,
                unit: unit || 'unidad',
                currentStock: currentStock || 0,
                minStock: minStock || 5,
                unitCost: unitCost || 0
            }
        });

        // Log initial stock as movement if > 0
        if (currentStock > 0) {
            await db.inventoryMovement.create({
                data: {
                    itemId: item.id,
                    type: 'in',
                    quantity: currentStock,
                    reason: 'Stock inicial'
                }
            });
        }

        return NextResponse.json({ item }, { status: 201 });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
