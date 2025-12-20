import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/subscriptions - List all subscriptions
export async function GET(request: NextRequest) {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole(['admin'])(authResult, null as any);
    if (roleCheck) return roleCheck;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const restaurantId = searchParams.get('restaurantId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    try {
        const whereClause: any = {};
        if (status) whereClause.status = status;
        if (restaurantId) whereClause.restaurantId = restaurantId;

        const [subscriptions, total] = await Promise.all([
            db.subscription.findMany({
                where: whereClause,
                include: {
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                            businessCode: true,
                            // email does not exist on Restaurant model
                            organization: {
                                select: {
                                    owner: {
                                        select: {
                                            email: true,
                                            fullName: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    plan: {
                        select: {
                            id: true,
                            displayName: true,
                            priceMonthly: true,
                            priceYearly: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            db.subscription.count({ where: whereClause })
        ]);

        return NextResponse.json({
            subscriptions: subscriptions.map((sub: any) => ({
                id: sub.id,
                restaurantName: sub.restaurant?.name || 'Unknown',
                businessCode: sub.restaurant?.businessCode || 'N/A',
                ownerEmail: sub.restaurant?.organization?.owner?.email || 'N/A',
                planName: sub.plan?.displayName || 'Unknown',
                status: sub.status,
                currentPeriodStart: sub.currentPeriodStart,
                currentPeriodEnd: sub.currentPeriodEnd,
                price: sub.plan?.priceMonthly || 0 // For now showing monthly price, might need adjustment logic
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
