import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { pagadito, PaymentDetail } from '@/lib/pagadito';

/**
 * POST /api/billing/checkout
 * Inicia el proceso de pago con Pagadito
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
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
        const { planId, billingPeriod = 'monthly' } = body;

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID requerido' }, { status: 400 });
        }

        // Obtener el plan
        const plan = await db.plan.findUnique({ where: { id: planId } });
        if (!plan) {
            return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
        }

        // No se puede comprar el plan gratuito
        if (plan.name === 'free') {
            return NextResponse.json({ error: 'El plan gratuito no requiere pago' }, { status: 400 });
        }

        // Calcular precio según período
        const price = billingPeriod === 'yearly'
            ? Number(plan.priceYearly)
            : Number(plan.priceMonthly);

        // Crear referencia única de transacción
        const ern = `SUB-${restaurantId}-${Date.now()}`;

        // Detalles del pago
        const details: PaymentDetail[] = [{
            quantity: 1,
            description: `${plan.displayName} - ${billingPeriod === 'yearly' ? 'Anual' : 'Mensual'}`,
            price: price
        }];

        // Crear pago en Pagadito
        const paymentResult = await pagadito.createPayment(ern, details, 'USD');

        if (!paymentResult.success) {
            return NextResponse.json({
                error: paymentResult.error || 'Error creando pago'
            }, { status: 500 });
        }

        // Guardar intento de pago en base de datos
        // Actualizar o crear suscripción con estado pending
        await db.subscription.upsert({
            where: { restaurantId },
            update: {
                planId: plan.id,
                status: 'pending',
                paymentCustomerId: ern,
                paymentSubscriptionId: paymentResult.transactionId
            },
            create: {
                restaurantId,
                planId: plan.id,
                status: 'pending',
                paymentCustomerId: ern,
                paymentSubscriptionId: paymentResult.transactionId
            }
        });

        return NextResponse.json({
            success: true,
            redirectUrl: paymentResult.redirectUrl,
            transactionId: paymentResult.transactionId,
            simulationMode: !pagadito.isConfigured(),
            plan: {
                name: plan.displayName,
                price,
                period: billingPeriod
            }
        });

    } catch (error) {
        console.error('Error en checkout:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

/**
 * GET /api/billing/checkout
 * Verifica si Pagadito está configurado
 */
export async function GET() {
    return NextResponse.json({
        configured: pagadito.isConfigured(),
        mode: process.env.PAGADITO_MODE || 'sandbox',
        message: pagadito.isConfigured()
            ? 'Pagadito configurado correctamente'
            : 'Pagadito en modo simulación - Configure PAGADITO_UID y PAGADITO_WSK'
    });
}
