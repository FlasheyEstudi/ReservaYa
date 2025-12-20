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

// GET /api/restaurant/billing/summary - Get billing summary
export async function GET(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        // Get date range for the day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get closed orders for the day
        const closedOrders = await db.order.findMany({
            where: {
                restaurantId,
                status: 'closed',
                updatedAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                table: {
                    select: { tableNumber: true }
                },
                orderItems: {
                    include: {
                        menuItem: {
                            select: { name: true, price: true }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Calculate totals
        const totalSales = closedOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const orderCount = closedOrders.length;

        // Get all orders (including open) for the day
        const allOrders = await db.order.findMany({
            where: {
                restaurantId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                table: {
                    select: { tableNumber: true }
                },
                orderItems: {
                    include: {
                        menuItem: {
                            select: { name: true, price: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            date,
            summary: {
                totalSales,
                orderCount,
                openOrders: allOrders.filter(o => o.status === 'open').length,
                pendingPayment: allOrders.filter(o => o.status === 'payment_pending').length
            },
            orders: allOrders.map(o => ({
                id: o.id,
                tableNumber: o.table.tableNumber,
                status: o.status,
                total: Number(o.total),
                createdAt: o.createdAt.toISOString(),
                updatedAt: o.updatedAt.toISOString(),
                items: o.orderItems.map(item => ({
                    name: item.menuItem.name,
                    quantity: item.quantity,
                    price: Number(item.menuItem.price)
                }))
            }))
        });
    } catch (error) {
        console.error('Error fetching billing summary:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
