import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/plans - List all subscription plans
export async function GET(request: NextRequest) {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) return authResult;

    // Only Admin can list all plans via this endpoint (public plans might have another endpoint)
    const roleCheck = requireRole(['admin'])(authResult, null as any);
    if (roleCheck) return roleCheck;

    try {
        const plans = await db.plan.findMany({
            orderBy: { sortOrder: 'asc' }
        });

        return NextResponse.json({
            plans: plans.map(plan => ({
                ...plan,
                features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
            }))
        });

    } catch (error) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/plans - Create a new plan
export async function POST(request: NextRequest) {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole(['admin'])(authResult, null as any);
    if (roleCheck) return roleCheck;

    try {
        const body = await request.json();
        const {
            name,
            displayName,
            description,
            priceMonthly,
            priceYearly,
            maxTables,
            maxEmployees,
            maxReservationsMonth,
            features,
            sortOrder,
            isActive
        } = body;

        if (!name || !displayName) {
            return NextResponse.json({ error: 'Name and Display Name are required' }, { status: 400 });
        }

        const existingPlan = await db.plan.findUnique({ where: { name } });
        if (existingPlan) {
            return NextResponse.json({ error: 'Plan name already exists' }, { status: 400 });
        }

        const plan = await db.plan.create({
            data: {
                name,
                displayName,
                description,
                priceMonthly: priceMonthly || 0,
                priceYearly: priceYearly || 0,
                maxTables: maxTables || 5,
                maxEmployees: maxEmployees || 1,
                maxReservationsMonth: maxReservationsMonth || 100,
                features: JSON.stringify(features || {}),
                sortOrder: sortOrder || 0,
                isActive: isActive ?? true
            }
        });

        return NextResponse.json({ message: 'Plan created successfully', plan }, { status: 201 });

    } catch (error) {
        console.error('Error creating plan:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
