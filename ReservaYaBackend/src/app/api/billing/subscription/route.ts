import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getUsageStats } from '@/lib/featureGate';

/**
 * GET /api/billing/subscription - Get current restaurant subscription
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded || !decoded.rid) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const restaurantId = decoded.rid;

        // Get full usage stats
        const usageStats = await getUsageStats(restaurantId);

        return NextResponse.json(usageStats);
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json({ error: 'Error al obtener suscripción' }, { status: 500 });
    }
}

/**
 * POST /api/billing/subscription - Start a trial or subscribe to a plan
 * Body: { planName: 'starter' | 'professional' | 'enterprise' }
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded || !decoded.rid) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const restaurantId = decoded.rid;
        const body = await request.json();
        const { planName } = body;

        if (!planName) {
            return NextResponse.json({ error: 'planName requerido' }, { status: 400 });
        }

        // Find the plan
        const plan = await db.plan.findUnique({ where: { name: planName } });
        if (!plan) {
            return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
        }

        // Check if restaurant already has subscription
        const existingSubscription = await db.subscription.findUnique({
            where: { restaurantId }
        });

        const now = new Date();
        const trialEndsAt = plan.trialDays > 0
            ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
            : null;

        if (existingSubscription) {
            // Update existing subscription
            const updated = await db.subscription.update({
                where: { restaurantId },
                data: {
                    planId: plan.id,
                    status: plan.trialDays > 0 ? 'trialing' : 'active',
                    trialEndsAt,
                    currentPeriodStart: now,
                    currentPeriodEnd: trialEndsAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    canceledAt: null
                },
                include: { plan: true }
            });

            return NextResponse.json({
                success: true,
                message: `Plan actualizado a ${plan.displayName}`,
                subscription: updated
            });
        }

        // Create new subscription
        const subscription = await db.subscription.create({
            data: {
                restaurantId,
                planId: plan.id,
                status: plan.trialDays > 0 ? 'trialing' : 'active',
                trialEndsAt,
                currentPeriodStart: now,
                currentPeriodEnd: trialEndsAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            },
            include: { plan: true }
        });

        return NextResponse.json({
            success: true,
            message: plan.trialDays > 0
                ? `Prueba gratuita de ${plan.trialDays} días activada para ${plan.displayName}`
                : `Suscrito a ${plan.displayName}`,
            subscription
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json({ error: 'Error al crear suscripción' }, { status: 500 });
    }
}

/**
 * PATCH /api/billing/subscription - Cancel subscription
 * Body: { action: 'cancel' }
 */
export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded || !decoded.rid) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const restaurantId = decoded.rid;
        const body = await request.json();
        const { action } = body;

        if (action === 'cancel') {
            // Get free plan to downgrade to
            const freePlan = await db.plan.findUnique({ where: { name: 'free' } });

            const updated = await db.subscription.update({
                where: { restaurantId },
                data: {
                    status: 'canceled',
                    canceledAt: new Date(),
                    planId: freePlan?.id // Downgrade to free
                },
                include: { plan: true }
            });

            return NextResponse.json({
                success: true,
                message: 'Suscripción cancelada. Tu plan ha sido cambiado a Gratis.',
                subscription: updated
            });
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    } catch (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ error: 'Error al actualizar suscripción' }, { status: 500 });
    }
}
