import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Helper to get employee info from token
async function getEmployeeFromToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as {
            uid?: string;
            id?: string;
            restaurantId?: string;
            role?: string;
        };
        return {
            id: decoded.uid || decoded.id,
            restaurantId: decoded.restaurantId,
            role: decoded.role
        };
    } catch {
        return null;
    }
}

// GET /api/reservations/today - Get today's reservations for the restaurant (for host/employee)
export async function GET(request: NextRequest) {
    try {
        const employee = await getEmployeeFromToken(request);

        // Check for search query parameter
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const dateParam = searchParams.get('date');
        const allDates = searchParams.get('allDates') === 'true';

        // Build where clause
        const whereClause: any = {};

        // If not searching all dates, filter by date
        if (!allDates) {
            // Set date range (today or specified date)
            let targetDate: Date;
            if (dateParam) {
                targetDate = new Date(dateParam);
            } else {
                targetDate = new Date();
            }

            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            whereClause.reservationTime = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        // If employee has restaurantId, filter by it
        if (employee?.restaurantId) {
            whereClause.restaurantId = employee.restaurantId;
        }

        // Add search filter if provided - search by name, email or phone
        if (search && search.trim()) {
            whereClause.OR = [
                { user: { fullName: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const reservations = await db.reservation.findMany({
            where: whereClause,
            include: {
                restaurant: {
                    select: {
                        name: true,
                        businessCode: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        phone: true
                    }
                },
                table: {
                    select: {
                        id: true,
                        tableNumber: true,
                        capacity: true
                    }
                }
            },
            orderBy: {
                reservationTime: 'asc'
            }
        });

        // Transform to frontend-friendly format
        const transformedReservations = reservations.map(reservation => ({
            id: reservation.id,
            customerName: reservation.user?.fullName || 'Cliente',
            clientName: reservation.user?.fullName || 'Cliente',
            email: reservation.user?.email,
            phone: reservation.user?.phone || '',
            pax: reservation.partySize,
            partySize: reservation.partySize,
            reservationDate: reservation.reservationTime,
            reservationTime: reservation.reservationTime,
            status: reservation.status,
            tableId: reservation.tableId,
            tableNumber: reservation.table?.tableNumber,
            restaurantId: reservation.restaurantId,
            restaurantName: reservation.restaurant?.name,
            notes: reservation.notes || '',
            createdAt: reservation.createdAt
        }));

        return NextResponse.json(transformedReservations, { headers: corsHeaders });

    } catch (error) {
        console.error('Error fetching today reservations:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
