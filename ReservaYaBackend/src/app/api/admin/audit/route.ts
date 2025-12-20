import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        // Fetch all activity logs from all restaurants for admin view
        const logs = await db.activityLog.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            include: {
                employee: {
                    select: { fullName: true, email: true }
                },
                restaurant: {
                    select: { name: true }
                }
            }
        });

        const auditLogs = logs.map(log => ({
            id: log.id,
            action: log.action,
            entity: log.restaurant?.name || 'System',
            userEmail: log.employee?.email || 'System',
            details: log.description,
            timestamp: log.createdAt.toISOString(),
            ipAddress: (log.metadata as any)?.ipAddress || '0.0.0.0'
        }));

        return NextResponse.json({ auditLogs });
    } catch (error) {
        console.error('Fetch audit logs error:', error);
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
