import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { checkLimit, limitExceededResponse } from '@/lib/featureGate';

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

// GET /api/restaurant/staff - Get all employees
export async function GET(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const employees = await db.employee.findMany({
            where: { restaurantId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            employees: employees.map(e => ({
                id: e.id,
                name: e.fullName || e.email,
                email: e.email,
                role: e.role,
                isActive: e.isActive,
                createdAt: e.createdAt.toISOString()
            }))
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/restaurant/staff - Create new employee
export async function POST(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { email, fullName, role, pin } = body;

        if (!email || !role || !pin) {
            return NextResponse.json({ error: 'Email, role, and PIN are required' }, { status: 400 });
        }

        if (!['manager', 'chef', 'waiter', 'host', 'bartender'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check employee limit based on subscription plan
        const limitCheck = await checkLimit(restaurantId, 'employees');
        if (!limitCheck.allowed) {
            return NextResponse.json(
                limitExceededResponse('empleados', limitCheck.current, limitCheck.max, limitCheck.planName),
                { status: 403 }
            );
        }

        // Check if employee already exists
        const existing = await db.employee.findFirst({
            where: { restaurantId, email }
        });

        if (existing) {
            return NextResponse.json({ error: 'Employee with this email already exists' }, { status: 400 });
        }

        const pinHash = await bcrypt.hash(pin, 10);

        const employee = await db.employee.create({
            data: {
                restaurantId,
                email,
                fullName: fullName || null,
                role,
                pinHash,
                isActive: true
            }
        });

        return NextResponse.json({
            employee: {
                id: employee.id,
                name: employee.fullName || employee.email,
                email: employee.email,
                role: employee.role,
                isActive: employee.isActive
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
