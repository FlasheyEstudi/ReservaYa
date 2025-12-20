import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// DELETE /api/admin/reservations/[id] - Delete a reservation
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

        await db.reservation.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete reservation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/reservations/[id] - Update reservation status
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
        const { status } = await request.json();

        const reservation = await db.reservation.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, reservation });
    } catch (error) {
        console.error('Update reservation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
