import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function getRestaurantFromToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { rid?: string; uid?: string; restaurantId?: string; employeeId?: string };
        return { restaurantId: decoded.rid || decoded.restaurantId, employeeId: decoded.uid || decoded.employeeId };
    } catch {
        return null;
    }
}

// GET /api/restaurant/journal - Get activity logs
export async function GET(req: NextRequest) {
    try {
        const auth = await getRestaurantFromToken(req);
        if (!auth?.restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const action = searchParams.get('action'); // filter by action type

        const logs = await db.activityLog.findMany({
            where: {
                restaurantId: auth.restaurantId,
                ...(action && { action })
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json({
            entries: logs.map(log => ({
                id: log.id,
                action: log.action,
                description: log.description,
                metadata: JSON.parse(log.metadata || '{}'),
                employee: log.employee ? {
                    name: log.employee.fullName || log.employee.email,
                    role: log.employee.role
                } : null,
                createdAt: log.createdAt.toISOString()
            }))
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/restaurant/journal - Create activity log entry
export async function POST(req: NextRequest) {
    try {
        const auth = await getRestaurantFromToken(req);
        if (!auth?.restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, description, metadata } = body;

        if (!action || !description) {
            return NextResponse.json({ error: 'Action and description required' }, { status: 400 });
        }

        const log = await db.activityLog.create({
            data: {
                restaurantId: auth.restaurantId,
                employeeId: auth.employeeId || null,
                action,
                description,
                metadata: metadata ? JSON.stringify(metadata) : '{}'
            }
        });

        return NextResponse.json({ log }, { status: 201 });
    } catch (error) {
        console.error('Error creating activity log:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
