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

// GET /api/restaurant/customers - Get all customer profiles
export async function GET(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const customers = await db.customerProfile.findMany({
            where: { restaurantId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        phone: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({
            customers: customers.map(c => ({
                id: c.id,
                name: c.name || c.user?.fullName || 'Sin nombre',
                email: c.email || c.user?.email,
                phone: c.phone || c.user?.phone,
                isVIP: c.isVIP,
                isBlocked: c.isBlocked,
                notes: c.notes,
                totalVisits: c.totalVisits,
                noShows: c.noShows,
                lastVisit: c.lastVisit?.toISOString() || null
            }))
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/restaurant/customers - Create customer profile
export async function POST(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, phone, notes, isVIP } = body;

        if (!name && !email) {
            return NextResponse.json({ error: 'Name or email is required' }, { status: 400 });
        }

        // Check if customer with email already exists
        if (email) {
            const existing = await db.customerProfile.findFirst({
                where: { restaurantId, email }
            });
            if (existing) {
                return NextResponse.json({ error: 'Customer with this email already exists' }, { status: 400 });
            }
        }

        const customer = await db.customerProfile.create({
            data: {
                restaurantId,
                name: name || email,
                email,
                phone,
                notes,
                isVIP: isVIP || false
            }
        });

        return NextResponse.json({ customer }, { status: 201 });
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/restaurant/customers - Update customer (using query param ?id=xxx)
export async function PATCH(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get('id');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        const body = await req.json();
        const { name, phone, notes, isVIP, isBlocked, totalVisits, noShows, lastVisit } = body;

        // Verify customer belongs to restaurant
        const existing = await db.customerProfile.findFirst({
            where: { id: customerId, restaurantId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const customer = await db.customerProfile.update({
            where: { id: customerId },
            data: {
                ...(name !== undefined && { name }),
                ...(phone !== undefined && { phone }),
                ...(notes !== undefined && { notes }),
                ...(isVIP !== undefined && { isVIP }),
                ...(isBlocked !== undefined && { isBlocked }),
                ...(totalVisits !== undefined && { totalVisits }),
                ...(noShows !== undefined && { noShows }),
                ...(lastVisit !== undefined && { lastVisit: new Date(lastVisit) })
            }
        });

        return NextResponse.json({ customer });
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
