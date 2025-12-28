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
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    // Only managers and waiters can close orders
    const roleCheck = requireRole(['manager', 'waiter'])(user, null as any);
    if (roleCheck) return roleCheck;

    const { rid } = user;
    const { id: orderId } = await params;

    try {
        // Parse optional checkout data from request body
        let tip = 0;
        let discount = 0;
        let discountType: string | null = null;
        let paymentMethod: string | null = null;

        try {
            const body = await request.json();
            tip = parseFloat(body.tip) || 0;
            discount = parseFloat(body.discount) || 0;
            discountType = body.discountType || null;
            paymentMethod = body.paymentMethod || null;
        } catch {
            // No body or invalid JSON - use defaults
        }

        // Find the order and verify it belongs to this restaurant
        const order = await db.order.findFirst({
            where: {
                id: orderId,
                restaurantId: rid
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404, headers: corsHeaders }
            );
        }

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

        // If there's a table associated, we DO NOT automatically free it anymore.
        // The frontend handles the transition to 'reserved' (cleaning) or 'free'.
        // This prevents the "zombie state" race condition where the table flips to free
        // while the waiter is setting it to cleaning.
        /*
        if (order.tableId) {
            await db.table.update({
                where: { id: order.tableId },
                data: { currentStatus: 'free' }
            });
        }
        */

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
        console.error('Error closing order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
