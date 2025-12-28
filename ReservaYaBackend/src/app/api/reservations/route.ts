import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CreateReservationSchema } from '@/lib/validation';

// Retry helper for serializable transactions (handles P2034 serialization failures)
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 100
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // P2034 = Transaction failed due to a write conflict or a deadlock
      if (error.code === 'P2034' && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// POST /api/reservations - Create new reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (process.env.NODE_ENV === 'development') {
      console.log('RESERVATION REQUEST BODY:', JSON.stringify(body, null, 2));
    }
    const { restaurant_id, reservation_time, party_size, user_id, table_id, notes } = CreateReservationSchema.parse(body);


    // Use serializable transaction with retry logic for concurrent requests
    const result = await withRetry(() => db.$transaction(async (tx) => {
      // Verify restaurant exists and is active
      const restaurant = await tx.restaurant.findUnique({
        where: {
          id: restaurant_id,
          status: 'active'
        },
        include: {
          tables: true
        }
      });

      if (!restaurant) {
        throw new Error('Restaurant not found or inactive');
      }

      // Calculate total capacity and existing reservations
      const totalCapacity = restaurant.tables.reduce((sum, table) => sum + table.capacity, 0);

      const timeWindowStart = new Date(new Date(reservation_time).getTime() - (1.5 * 60 * 60 * 1000));
      const timeWindowEnd = new Date(new Date(reservation_time).getTime() + (1.5 * 60 * 60 * 1000));

      const existingReservations = await tx.reservation.findMany({
        where: {
          restaurantId: restaurant_id,
          reservationTime: {
            gte: timeWindowStart,
            lte: timeWindowEnd
          },
          status: {
            in: ['confirmed', 'seated']
          }
        }
      });

      const occupiedSeats = existingReservations.reduce((sum, reservation) => sum + reservation.partySize, 0);
      const availableCapacity = totalCapacity - occupiedSeats;

      if (availableCapacity < party_size) {
        throw new Error('Insufficient capacity for requested party size');
      }

      // If specific table is requested, check if it's available
      if (table_id) {
        const table = await tx.table.findFirst({
          where: {
            id: table_id,
            restaurantId: restaurant_id,
            capacity: {
              gte: party_size
            }
          }
        });

        if (!table) {
          throw new Error('Requested table not found or insufficient capacity');
        }

        // Check if table is already reserved for this time
        const tableConflict = await tx.reservation.findFirst({
          where: {
            tableId: table_id,
            reservationTime: {
              gte: timeWindowStart,
              lte: timeWindowEnd
            },
            status: {
              in: ['confirmed', 'seated']
            }
          }
        });

        if (tableConflict) {
          throw new Error('Requested table is already reserved for this time');
        }
      }

      // Create the reservation
      const reservation = await tx.reservation.create({
        data: {
          restaurantId: restaurant_id,
          userId: user_id,
          tableId: table_id,
          reservationTime: new Date(reservation_time),
          partySize: party_size,
          notes: notes,
          status: 'confirmed'
        },
        include: {
          restaurant: {
            select: {
              name: true,
              businessCode: true
            }
          },
          table: {
            select: {
              tableNumber: true,
              capacity: true
            }
          }
        }
      });

      return reservation;
    }, {
      isolationLevel: 'Serializable' // Prevent double booking
    }));

    // Send confirmation email
    const { sendEmail } = await import('@/lib/email');
    if (result.user?.email) { // Assuming we can get user email, but result.user is not included in the transaction result by default unless select is updated
      // However, we have user_id. We might need to fetch user, or just trust the auth. 
      // For now, let's skip user details if not available or assume we need to join it.
      // The transaction above includes restaurant and table.
      // Let's modify the transaction include to fetch user email if possible, or fetch it separately.
      // Actually, we can fetch it after.
      const user = await db.user.findUnique({ where: { id: user_id }, select: { email: true, fullName: true } });
      if (user && user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Confirmación de Reserva - ReservaYa',
          text: `Hola ${user.fullName}, tu reserva en ${result.restaurant?.name} para ${party_size} personas el ${new Date(reservation_time).toLocaleString()} ha sido confirmada. Código de mesa: ${result.table?.tableNumber || 'N/A'}.`
        });
      }
    }

    return NextResponse.json({
      message: 'Reservation created successfully',
      reservation: {
        id: result.id,
        restaurant_id: result.restaurantId,
        restaurant_name: result.restaurant?.name,
        restaurant_code: result.restaurant?.businessCode,
        user_id: result.userId,
        table_id: result.tableId,
        table_number: result.table?.tableNumber,
        reservation_time: result.reservationTime,
        party_size: result.partySize,
        status: result.status,
        created_at: result.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Reservation creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

import jwt from 'jsonwebtoken';

import { getJwtSecret } from '@/lib/auth';

const JWT_SECRET = getJwtSecret();

// Helper to get user from token
async function getUserFromToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string };
    return decoded.uid;
  } catch {
    return null;
  }
}

// GET /api/reservations - Get reservations (filtered by authenticated user)
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurant_id = searchParams.get('restaurant_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    // Always filter by the authenticated user
    let whereClause: any = {
      userId: userId
    };

    if (restaurant_id) {
      whereClause.restaurantId = restaurant_id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      whereClause.reservationTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const reservations = await db.reservation.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: {
            name: true,
            businessCode: true,
            image: true // Include image for frontend display
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        },
        table: {
          select: {
            tableNumber: true,
            capacity: true
          }
        }
      },
      orderBy: {
        reservationTime: 'asc'
      }
    });

    return NextResponse.json({
      reservations: reservations.map(reservation => ({
        id: reservation.id,
        restaurant_id: reservation.restaurantId,
        restaurant_name: reservation.restaurant?.name,
        restaurant_code: reservation.restaurant?.businessCode,
        restaurant_image: (reservation.restaurant as any)?.image,
        user_id: reservation.userId,
        user_email: reservation.user?.email,
        user_name: reservation.user?.fullName,
        table_id: reservation.tableId,
        table_number: reservation.table?.tableNumber,
        table_capacity: reservation.table?.capacity,
        reservation_time: reservation.reservationTime,
        party_size: reservation.partySize,
        status: reservation.status,
        created_at: reservation.createdAt,
        updated_at: reservation.updatedAt
      }))
    });

  } catch (error) {
    console.error('Reservations fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}