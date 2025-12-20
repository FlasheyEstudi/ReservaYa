import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/tables - Get all tables across all restaurants
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const tables = await db.table.findMany({
            include: {
                restaurant: { select: { id: true, name: true, businessCode: true } }
            },
            orderBy: [{ restaurantId: 'asc' }, { tableNumber: 'asc' }]
        });

        // Get today's reservations separately
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reservations = await db.reservation.findMany({
            where: {
                reservationTime: { gte: today },
                status: { in: ['confirmed', 'pending'] }
            },
            select: {
                id: true,
                tableId: true,
                reservationTime: true,
                partySize: true,
                status: true,
                user: { select: { fullName: true, email: true } }
            }
        });

        // Map reservations by tableId
        const reservationsByTable = reservations.reduce((acc, r) => {
            if (r.tableId) {
                if (!acc[r.tableId]) acc[r.tableId] = [];
                acc[r.tableId].push(r);
            }
            return acc;
        }, {} as Record<string, typeof reservations>);

        const formattedTables = tables.map(t => ({
            id: t.id,
            number: t.tableNumber || 'N/A',
            capacity: t.capacity,
            status: t.currentStatus,
            restaurant: t.restaurant,
            currentReservation: reservationsByTable[t.id]?.[0] || null,
            reservationsToday: reservationsByTable[t.id]?.length || 0
        }));

        const stats = {
            total: tables.length,
            available: tables.filter(t => t.currentStatus === 'free').length,
            occupied: tables.filter(t => t.currentStatus === 'occupied').length,
            reserved: Object.keys(reservationsByTable).length
        };

        return NextResponse.json({ tables: formattedTables, stats });
    } catch (error) {
        console.error('Fetch tables error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
