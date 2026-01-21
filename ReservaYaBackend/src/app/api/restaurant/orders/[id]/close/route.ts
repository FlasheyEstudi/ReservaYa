import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3001',
    'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// PATCH /api/restaurant/orders/[id]/close - Close an order
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('[CLOSE ORDER] Starting close order request');

    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
        console.log('[CLOSE ORDER] Auth failed');
        return authResult;
    }

    const user = authResult;
    console.log('[CLOSE ORDER] User authenticated:', user.email, 'role:', user.role);

    // Only managers and waiters can close orders
    const roleCheck = requireRole(['manager', 'waiter'])(user, null as any);
    if (roleCheck) {
        console.log('[CLOSE ORDER] Role check failed');
        return roleCheck;
    }

    const { rid } = user;

    let orderId: string;
    try {
        const resolvedParams = await params;
        orderId = resolvedParams.id;
        console.log('[CLOSE ORDER] Order ID:', orderId);
    } catch (err) {
        console.error('[CLOSE ORDER] Error resolving params:', err);
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400, headers: corsHeaders });
    }

    try {
        // Parse optional checkout data from request body
        let tip = 0;
        let discount = 0;
        let discountType: string | null = null;
        let paymentMethod: string | null = null;

        try {
            const bodyText = await request.text();
            if (bodyText) {
                const body = JSON.parse(bodyText);
                tip = parseFloat(body.tip) || 0;
                discount = parseFloat(body.discount) || 0;
                discountType = body.discountType || null;
                paymentMethod = body.paymentMethod || null;
                console.log('[CLOSE ORDER] Checkout data:', { tip, discount, discountType, paymentMethod });
            }
        } catch (parseErr) {
            console.log('[CLOSE ORDER] No body or invalid JSON, using defaults');
        }

        // Find the order and verify it belongs to this restaurant
        console.log('[CLOSE ORDER] Finding order:', orderId, 'for restaurant:', rid);
        const order = await db.order.findFirst({
            where: {
                id: orderId,
                restaurantId: rid
            }
        });

        if (!order) {
            console.log('[CLOSE ORDER] Order not found');
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        console.log('[CLOSE ORDER] Order found, current total:', order.total, 'status:', order.status);

        // Calculate final total with discount and tip
        let finalTotal = Number(order.total);
        if (discount > 0) {
            if (discountType === 'percentage') {
                finalTotal = finalTotal * (1 - discount / 100);
            } else {
                finalTotal = finalTotal - discount;
            }
        }
        finalTotal = Math.max(0, finalTotal) + tip;
        console.log('[CLOSE ORDER] Final total calculated:', finalTotal);

        // Update order status to closed with checkout data
        const updatedOrder = await db.order.update({
            where: { id: orderId },
            data: {
                status: 'closed',
                tip,
                discount,
                discountType,
                paymentMethod,
                total: finalTotal,
                updatedAt: new Date()
            }
        });

        console.log('[CLOSE ORDER] Order closed successfully:', updatedOrder.id);

        return NextResponse.json({
            message: 'Order closed successfully',
            order: {
                id: updatedOrder.id,
                status: updatedOrder.status,
                total: updatedOrder.total,
                tip: updatedOrder.tip,
                discount: updatedOrder.discount,
                paymentMethod: updatedOrder.paymentMethod
            }
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('[CLOSE ORDER] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Internal server error', details: errorMessage },
            { status: 500, headers: corsHeaders }
        );
    }
}
