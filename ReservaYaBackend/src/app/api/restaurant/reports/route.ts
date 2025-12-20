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

// GET /api/restaurant/reports - Get restaurant statistics
export async function GET(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'day'; // day, week, month

        // Calculate date range
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            default: // day
                startDate.setHours(0, 0, 0, 0);
        }

        // Get orders in period
        const orders = await db.order.findMany({
            where: {
                restaurantId,
                createdAt: { gte: startDate }
            }
        });

        const closedOrders = orders.filter(o => o.status === 'closed');
        const totalRevenue = closedOrders.reduce((sum, o) => sum + Number(o.total), 0);

        // Get reservations in period
        const reservations = await db.reservation.findMany({
            where: {
                restaurantId,
                reservationTime: { gte: startDate }
            }
        });

        const confirmedReservations = reservations.filter(r => r.status === 'confirmed');
        const seatedReservations = reservations.filter(r => r.status === 'seated');
        const noShows = reservations.filter(r => r.status === 'no_show');

        // Get table stats
        const tables = await db.table.findMany({
            where: { restaurantId }
        });

        const occupiedTables = tables.filter(t => t.currentStatus === 'occupied');

        // Get inventory alerts
        const lowStockItems = await db.inventoryItem.findMany({
            where: {
                restaurantId,
                currentStock: { lte: db.inventoryItem.fields.minStock }
            }
        });

        // Get top selling items (from order items)
        const orderItems = await db.orderItem.findMany({
            where: {
                order: {
                    restaurantId,
                    createdAt: { gte: startDate }
                }
            },
            include: {
                menuItem: {
                    select: { name: true }
                }
            }
        });

        // Aggregate by menu item
        const itemCounts: Record<string, number> = {};
        orderItems.forEach(item => {
            const name = item.menuItem.name;
            itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
        });

        const topItems = Object.entries(itemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, quantity]) => ({ name, quantity }));

        return NextResponse.json({
            period,
            dateRange: {
                from: startDate.toISOString(),
                to: now.toISOString()
            },
            sales: {
                totalRevenue,
                orderCount: closedOrders.length,
                averageOrderValue: closedOrders.length > 0 ? totalRevenue / closedOrders.length : 0,
                openOrders: orders.filter(o => o.status === 'open').length
            },
            reservations: {
                total: reservations.length,
                confirmed: confirmedReservations.length,
                seated: seatedReservations.length,
                noShows: noShows.length,
                totalGuests: reservations.reduce((sum, r) => sum + r.partySize, 0)
            },
            tables: {
                total: tables.length,
                occupied: occupiedTables.length,
                occupancyRate: tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0
            },
            inventory: {
                lowStockAlerts: lowStockItems.length,
                lowStockItems: lowStockItems.map(i => ({
                    name: i.name,
                    currentStock: Number(i.currentStock),
                    minStock: Number(i.minStock)
                }))
            },
            topSellingItems: topItems
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
