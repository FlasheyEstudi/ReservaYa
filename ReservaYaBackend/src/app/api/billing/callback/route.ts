import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pagadito } from '@/lib/pagadito';

/**
 * GET /api/billing/callback
 * URL de retorno después del pago en Pagadito
 * Redirige a la página de suscripción con el resultado
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Parámetros que Pagadito envía de vuelta
    const token = searchParams.get('token') || searchParams.get('value');
    const ern = searchParams.get('ern') || searchParams.get('ern_value');

    // Parámetros de simulación
    const simulated = searchParams.get('payment') === 'simulated';
    const amount = searchParams.get('amount');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    try {
        if (simulated || !pagadito.isConfigured()) {
            // Modo simulación - activar suscripción directamente
            if (ern) {
                // Extraer restaurantId del ERN (SUB-{restaurantId}-{timestamp})
                const parts = ern.split('-');
                if (parts.length >= 2) {
                    const restaurantId = parts.slice(1, -1).join('-');

                    // Buscar suscripción pendiente y activarla
                    const subscription = await db.subscription.findUnique({
                        where: { restaurantId }
                    });

                    if (subscription) {
                        await db.subscription.update({
                            where: { restaurantId },
                            data: {
                                status: 'active',
                                currentPeriodStart: new Date(),
                                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 días
                            }
                        });
                    }
                }
            }

            return NextResponse.redirect(
                `${frontendUrl}/manage/subscription?payment=success&simulated=true`
            );
        }

        // Modo producción - verificar estado con Pagadito
        if (!token) {
            return NextResponse.redirect(
                `${frontendUrl}/manage/subscription?payment=error&reason=no_token`
            );
        }

        const status = await pagadito.getPaymentStatus(token);

        if (status.success && status.status === 'completed') {
            // Pago exitoso - activar suscripción
            if (ern) {
                const parts = ern.split('-');
                if (parts.length >= 2) {
                    const restaurantId = parts.slice(1, -1).join('-');

                    await db.subscription.update({
                        where: { restaurantId },
                        data: {
                            status: 'active',
                            currentPeriodStart: new Date(),
                            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        }
                    });
                }
            }

            return NextResponse.redirect(
                `${frontendUrl}/manage/subscription?payment=success&amount=${status.amount}`
            );
        } else if (status.status === 'pending') {
            return NextResponse.redirect(
                `${frontendUrl}/manage/subscription?payment=pending`
            );
        } else {
            return NextResponse.redirect(
                `${frontendUrl}/manage/subscription?payment=failed&reason=${status.error || 'unknown'}`
            );
        }

    } catch (error) {
        console.error('Error en callback de pago:', error);
        return NextResponse.redirect(
            `${frontendUrl}/manage/subscription?payment=error&reason=server_error`
        );
    }
}

/**
 * POST /api/billing/callback
 * Webhook para notificaciones de Pagadito (IPN)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, status, ern, amount } = body;

        console.log('[Pagadito Webhook] Notificación recibida:', { token, status, ern, amount });

        if (status === 'COMPLETED' && ern) {
            const parts = ern.split('-');
            if (parts.length >= 2) {
                const restaurantId = parts.slice(1, -1).join('-');

                await db.subscription.update({
                    where: { restaurantId },
                    data: {
                        status: 'active',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                });

                console.log(`[Pagadito Webhook] ✅ Suscripción activada para ${restaurantId}`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[Pagadito Webhook] Error:', error);
        return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
    }
}
