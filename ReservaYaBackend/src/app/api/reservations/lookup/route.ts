import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reservations/lookup?code=xxx - Look up reservation by code/ID
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Code required' }, { status: 400 });
        }

        // Search by reservation ID or user phone
        let reservation = await db.reservation.findFirst({
            where: {
                OR: [
                    { id: code },
                    { user: { phone: { contains: code } } }
                ],
                status: { in: ['confirmed', 'pending'] }
            },
            include: {
                user: {
                    select: { fullName: true, phone: true }
                },
                table: {
                    select: { tableNumber: true, capacity: true }
                },
                restaurant: {
                    select: { name: true }
                }
            },
            orderBy: { reservationTime: 'asc' }
        });

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
        }

        return NextResponse.json({
            reservation: {
                id: reservation.id,
                customerName: reservation.user?.fullName || 'Cliente',
                phone: reservation.user?.phone,
                partySize: reservation.partySize,
                reservationTime: reservation.reservationTime,
                status: reservation.status,
                tableNumber: reservation.table?.tableNumber,
                restaurantName: reservation.restaurant?.name
            }
        });
    } catch (error) {
        console.error('Lookup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
