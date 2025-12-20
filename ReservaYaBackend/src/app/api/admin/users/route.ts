import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const user = authResult;

        const roleCheck = requireRole(['admin'])(user, null as any);
        if (roleCheck) {
            return roleCheck;
        }

        const users = await db.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                createdAt: true,
                _count: {
                    select: {
                        reservations: true,
                        reviews: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            users: users.map(u => ({
                id: u.id,
                email: u.email,
                fullName: u.fullName,
                phone: u.phone,
                createdAt: u.createdAt,
                reservations: u._count.reservations,
                reviews: u._count.reviews
            }))
        });
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
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
