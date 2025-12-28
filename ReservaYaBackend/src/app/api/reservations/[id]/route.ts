import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Helper to get user from token
function getUserFromToken(req: NextRequest): { uid: string; role: string } | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; role: string };
        return { uid: decoded.uid, role: decoded.role };
    } catch {
        return null;
    }
}

// GET /api/reservations/[id] - Get single reservation
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const reservation = await db.reservation.findUnique({
            where: { id },
            include: {
                restaurant: { select: { id: true, name: true, businessCode: true } },
                table: { select: { tableNumber: true } },
                user: { select: { fullName: true, email: true, phone: true } }
            }
        });

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404, headers: corsHeaders });
        }

        return NextResponse.json({ reservation }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error fetching reservation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}

// DELETE /api/reservations/[id] - Cancel reservation
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const { id } = await params;

        // Find reservation
        const reservation = await db.reservation.findUnique({
            where: { id }
        });

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404, headers: corsHeaders });
        }

        // Check permission: user can only cancel their own reservations
        if (user.role === 'CUSTOMER' && reservation.userId !== user.uid) {
            return NextResponse.json({ error: 'Cannot cancel other users reservations' }, { status: 403, headers: corsHeaders });
        }

        // Cannot cancel already cancelled or completed reservations
        if (reservation.status === 'cancelled') {
            return NextResponse.json({ error: 'Reservation already cancelled' }, { status: 400, headers: corsHeaders });
        }

        if (reservation.status === 'completed' || reservation.status === 'no_show') {
            return NextResponse.json({ error: 'Cannot cancel completed reservations' }, { status: 400, headers: corsHeaders });
        }

        // Update reservation status to cancelled
        const updated = await db.reservation.update({
            where: { id },
            data: { status: 'cancelled' }
        });

        return NextResponse.json({
            success: true,
            message: 'Reservation cancelled successfully',
            reservation: {
                id: updated.id,
                status: updated.status
            }
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}
