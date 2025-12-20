import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// CORS headers for public access
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/public/invoice/[id] - Public invoice view (no auth required)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: invoiceId } = await params;

    try {
        // Find the invoice
        const invoice = await db.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                restaurant: {
                    select: {
                        name: true,
                        address: true,
                        phone: true
                    }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Return invoice data in a structured format
        const responseData = {
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                date: invoice.createdAt.toISOString(),
                businessName: invoice.restaurant.name,
                businessAddress: invoice.restaurant.address || '',
                businessPhone: invoice.restaurant.phone || '',
                customerName: invoice.customerName,
                customerTaxId: invoice.customerTaxId || '',
                items: [{
                    description: `Orden #${invoice.orderId || 'N/A'}`,
                    quantity: 1,
                    unitPrice: Number(invoice.subtotal),
                    total: Number(invoice.subtotal)
                }],
                subtotal: Number(invoice.subtotal),
                tax: Number(invoice.tax),
                total: Number(invoice.total),
                status: invoice.status,
                paymentMethod: 'card' // Default, could be enhanced
            }
        };

        return NextResponse.json(responseData, { headers: corsHeaders });

    } catch (error) {
        console.error('Error fetching public invoice:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
