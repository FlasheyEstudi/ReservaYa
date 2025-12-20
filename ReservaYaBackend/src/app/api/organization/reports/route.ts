import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken } from '@/lib/middleware';

// GET /api/organization/reports - Get comparative reports across branches
export async function GET(request: NextRequest) {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const { rid, role } = authResult;

    // Only managers can view org reports
    if (role !== 'manager') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
        // Get current restaurant's organization
        const restaurant = await db.restaurant.findUnique({
            where: { id: rid }
        });

        if (!restaurant?.organizationId) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
        }

        // Get all branches
        const branches = await db.restaurant.findMany({
            where: { organizationId: restaurant.organizationId },
            select: {
                id: true,
                name: true,
                businessCode: true,
                status: true
            }
        });

        // Get stats for each branch
        const branchStats = await Promise.all(branches.map(async (branch) => {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            // Reservations count
            const reservationsToday = await db.reservation.count({
                where: {
                    restaurantId: branch.id,
                    date: { gte: startOfDay }
                }
            });

            const reservationsMonth = await db.reservation.count({
                where: {
                    restaurantId: branch.id,
                    date: { gte: startOfMonth }
                }
            });

            // Orders count and revenue
            const ordersMonth = await db.order.findMany({
                where: {
                    restaurantId: branch.id,
                    createdAt: { gte: startOfMonth }
                },
                select: { total: true, status: true }
            });

            const revenueMonth = ordersMonth
                .filter(o => o.status === 'completed' || o.status === 'paid')
                .reduce((sum, o) => sum + (parseFloat(o.total?.toString() || '0')), 0);

            // Tables count
            const tables = await db.table.count({
                where: { restaurantId: branch.id }
            });

            // Employees count
            const employees = await db.employee.count({
                where: { restaurantId: branch.id, isActive: true }
            });

            // Average rating
            const reviews = await db.review.aggregate({
                where: { restaurantId: branch.id },
                _avg: { rating: true },
                _count: { id: true }
            });

            return {
                ...branch,
                stats: {
                    reservationsToday,
                    reservationsMonth,
                    ordersMonth: ordersMonth.length,
                    revenueMonth: Math.round(revenueMonth * 100) / 100,
                    tables,
                    employees,
                    avgRating: reviews._avg.rating || 0,
                    reviewCount: reviews._count.id
                }
            };
        }));

        // Calculate totals
        const totals = {
            reservationsToday: branchStats.reduce((sum, b) => sum + b.stats.reservationsToday, 0),
            reservationsMonth: branchStats.reduce((sum, b) => sum + b.stats.reservationsMonth, 0),
            ordersMonth: branchStats.reduce((sum, b) => sum + b.stats.ordersMonth, 0),
            revenueMonth: Math.round(branchStats.reduce((sum, b) => sum + b.stats.revenueMonth, 0) * 100) / 100,
            tables: branchStats.reduce((sum, b) => sum + b.stats.tables, 0),
            employees: branchStats.reduce((sum, b) => sum + b.stats.employees, 0)
        };

        return NextResponse.json({
            organizationId: restaurant.organizationId,
            branches: branchStats,
            totals,
            currentBranchId: rid
        });

    } catch (error) {
        console.error('Error fetching org reports:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
