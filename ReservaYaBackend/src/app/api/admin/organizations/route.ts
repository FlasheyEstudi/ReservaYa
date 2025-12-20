import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/organizations - List all organizations
export async function GET(request: NextRequest) {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole(['admin'])(authResult, null as any);
    if (roleCheck) return roleCheck;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    try {
        const whereClause: any = {};
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { owner: { email: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [organizations, total] = await Promise.all([
            db.organization.findMany({
                where: whereClause,
                include: {
                    owner: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    },
                    restaurants: {
                        select: {
                            id: true,
                            name: true,
                            businessCode: true,
                            status: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            db.organization.count({ where: whereClause })
        ]);

        return NextResponse.json({
            organizations: organizations.map(org => ({
                id: org.id,
                name: org.name,
                ownerName: org.owner.fullName,
                ownerEmail: org.owner.email,
                createdAt: org.createdAt,
                branches: org.restaurants.length,
                restaurants: org.restaurants
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Error fetching organizations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
