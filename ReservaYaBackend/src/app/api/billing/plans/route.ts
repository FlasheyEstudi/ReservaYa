import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/billing/plans - Get all available subscription plans
 * Public endpoint - no auth required
 */
export async function GET(request: NextRequest) {
    try {
        const plans = await db.plan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                name: true,
                displayName: true,
                description: true,
                priceMonthly: true,
                priceYearly: true,
                maxTables: true,
                maxEmployees: true,
                maxReservationsMonth: true,
                features: true,
                trialDays: true
            }
        });

        // Parse features JSON for each plan
        const formattedPlans = plans.map(plan => ({
            ...plan,
            priceMonthly: Number(plan.priceMonthly),
            priceYearly: Number(plan.priceYearly),
            features: JSON.parse(plan.features || '{}')
        }));

        return NextResponse.json({ plans: formattedPlans });
    } catch (error) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ error: 'Error al obtener planes' }, { status: 500 });
    }
}
