
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const restaurantId = params.id;
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const time = searchParams.get('time');
        const partySizeParam = searchParams.get('partySize');

        if (!restaurantId) {
            return NextResponse.json(
                { message: 'Restaurant ID is required' },
                { status: 400 }
            );
        }

        // Base query for tables in the restaurant
        const whereClause: any = {
            restaurantId: restaurantId,
            currentStatus: 'free', // Only show tables that are currently marked as free if immediate seating, but really we want capacity check
        };

        if (partySizeParam) {
            const partySize = parseInt(partySizeParam, 10);
            if (!isNaN(partySize)) {
                whereClause.capacity = { gte: partySize };
            }
        }

        // Fetch all tables matching criteria
        const tables = await db.table.findMany({
            where: whereClause,
            orderBy: {
                capacity: 'asc'
            }
        });

        // If date and time are provided, we should filter out reserved tables
        if (date && time) {
            // 1. Calculate the requested time window
            const requestedDateTime = new Date(`${date}T${time}:00`);
            // Assumption: A reservation blocks the table for 1.5 hours (90 mins)
            const windowStart = new Date(requestedDateTime.getTime() - 90 * 60000); // 90 mins before
            const windowEnd = new Date(requestedDateTime.getTime() + 90 * 60000);   // 90 mins after

            // 2. Find reservations for this restaurant in the window
            const blockingReservations = await db.reservation.findMany({
                where: {
                    restaurantId: restaurantId,
                    reservationTime: {
                        gte: windowStart,
                        lte: windowEnd
                    },
                    status: {
                        in: ['confirmed', 'seated']
                    },
                    tableId: {
                        not: null
                    }
                },
                select: {
                    tableId: true
                }
            });

            const blockedTableIds = new Set(blockingReservations.map(r => r.tableId));

            // 3. Filter tables available
            const availableTables = tables.filter(t => !blockedTableIds.has(t.id));

            return NextResponse.json({ tables: availableTables });
        }

        return NextResponse.json({ tables });
    } catch (error) {
        console.error('Error fetching tables:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
