import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const startTime = Date.now();

        // Check database connection
        let dbStatus = 'healthy';
        let dbLatency = 0;
        try {
            const dbStart = Date.now();
            await db.$queryRaw`SELECT 1`;
            dbLatency = Date.now() - dbStart;
        } catch {
            dbStatus = 'down';
        }

        // Get some stats
        const [restaurantCount, userCount, orderCount] = await Promise.all([
            db.restaurant.count(),
            db.user.count(),
            db.order.count()
        ]);

        const services = [
            {
                name: 'Backend API',
                status: 'healthy' as const,
                latency: Date.now() - startTime,
                uptime: '99.9%'
            },
            {
                name: 'PostgreSQL',
                status: dbStatus as 'healthy' | 'down',
                latency: dbLatency,
                uptime: '99.99%'
            },
            {
                name: 'WebSocket',
                status: 'healthy' as const,
                latency: 5,
                uptime: '99.8%'
            }
        ];

        return NextResponse.json({
            services,
            stats: {
                restaurants: restaurantCount,
                users: userCount,
                orders: orderCount
            }
        });
    } catch (error) {
        console.error('System status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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
