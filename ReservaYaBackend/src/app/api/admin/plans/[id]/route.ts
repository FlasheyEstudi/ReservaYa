import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// PUT /api/admin/plans/[id] - Update a plan
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole(['admin'])(authResult, null as any);
    if (roleCheck) return roleCheck;

    try {
        const { id } = params;
        const body = await request.json();

        // Destructure safely to avoid updating protected fields if any
        const {
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

        const updatedPlan = await db.plan.update({
            where: { id },
            data: {
                displayName,
                description,
                priceMonthly,
                priceYearly,
                maxTables,
                maxEmployees,
                maxReservationsMonth,
                features: features ? JSON.stringify(features) : undefined,
                sortOrder,
                isActive
            }
        });

        return NextResponse.json({ message: 'Plan updated successfully', plan: updatedPlan });

    } catch (error) {
        console.error('Error updating plan:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/plans/[id] - Delete a plan
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole(['admin'])(authResult, null as any);
    if (roleCheck) return roleCheck;

    try {
        const { id } = params;

        // Check if plan has active subscriptions
        const activeSubscriptions = await db.subscription.count({
            where: { planId: id }
        });

        if (activeSubscriptions > 0) {
            // Soft delete or error
            // Better to soft delete or archive. For now, we'll error out.
            return NextResponse.json({ error: 'Cannot delete plan with active subscriptions. Archive it instead.' }, { status: 400 });
        }

        await db.plan.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Plan deleted successfully' });

    } catch (error) {
        console.error('Error deleting plan:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
