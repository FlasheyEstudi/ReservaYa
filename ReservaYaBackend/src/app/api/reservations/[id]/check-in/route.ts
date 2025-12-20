import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// POST /api/reservations/[id]/check-in - Check in a reservation
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Decode JWT to get employee's restaurant
        const token = authHeader.substring(7);
        let employeeRestaurantId: string | null = null;

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            employeeRestaurantId = decoded.restaurantId || decoded.restaurant_id || null;
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const reservationId = params.id;

        // Find reservation first
        const existingReservation = await db.reservation.findUnique({
            where: { id: reservationId },
            include: { table: true, restaurant: true }
        });

        if (!existingReservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
        }

        // SECURITY: Verify reservation belongs to employee's restaurant
        if (employeeRestaurantId && existingReservation.restaurantId !== employeeRestaurantId) {
            return NextResponse.json({
                error: 'Esta reservación pertenece a otro restaurante',
                code: 'WRONG_RESTAURANT'
            }, { status: 403 });
        }

        // Update reservation status to 'seated'
        const reservation = await db.reservation.update({
            where: { id: reservationId },
            data: { status: 'seated' },
            include: {
                table: true,
                user: {
                    select: { fullName: true, phone: true, email: true }
                },
                restaurant: {
                    select: { name: true }
                }
            }
        });

        // If reservation has a table, mark it as occupied
        if (reservation.tableId) {
            await db.table.update({
                where: { id: reservation.tableId },
                data: { currentStatus: 'occupied' }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Check-in successful',
            reservation: {
                id: reservation.id,
                status: reservation.status,
                tableId: reservation.tableId,
                tableNumber: reservation.table?.tableNumber || null,
                customerName: reservation.user?.fullName || 'Cliente',
                customerEmail: reservation.user?.email || null,
                customerPhone: reservation.user?.phone || null,
                partySize: reservation.partySize,
                reservationTime: reservation.reservationTime,
                restaurantName: reservation.restaurant?.name || null
            }
        });
    } catch (error) {
        console.error('Check-in error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

