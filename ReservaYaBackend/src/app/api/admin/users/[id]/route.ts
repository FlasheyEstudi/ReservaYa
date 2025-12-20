import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/users/[id] - Get user details with reservations and reviews
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const { id } = await params;

        const user = await db.user.findUnique({
            where: { id },
            include: {
                reservations: {
                    include: {
                        restaurant: { select: { id: true, name: true } },
                        table: { select: { tableNumber: true } }
                    },
                    orderBy: { reservationTime: 'desc' },
                    take: 20
                },
                reviews: {
                    include: {
                        restaurant: { select: { id: true, name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Format response - omit passwordHash
        const formattedUser = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            createdAt: user.createdAt,
            reservations: user.reservations.map(r => ({
                id: r.id,
                date: r.reservationTime,
                time: new Date(r.reservationTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                partySize: r.partySize,
                status: r.status,
                restaurant: r.restaurant,
                table: r.table ? { number: r.table.tableNumber } : null
            })),
            reviews: user.reviews
        };

        return NextResponse.json({ user: formattedUser });
    } catch (error) {
        console.error('Fetch user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/users/[id] - Update user profile
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const { id } = await params;
        const body = await request.json();
        const { fullName, phone, email } = body;

        const user = await db.user.update({
            where: { id },
            data: {
                ...(fullName !== undefined && { fullName }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email })
            }
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const { id } = await params;

        await db.user.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
