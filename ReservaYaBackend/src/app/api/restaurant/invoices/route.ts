import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

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

// GET /api/restaurant/invoices - Get all invoices
export async function GET(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status'); // filter by status

        const invoices = await db.invoice.findMany({
            where: {
                restaurantId,
                ...(status && { status })
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        return NextResponse.json({
            invoices: invoices.map(inv => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                orderId: inv.orderId,
                customerName: inv.customerName,
                customerTaxId: inv.customerTaxId,
                subtotal: Number(inv.subtotal),
                tax: Number(inv.tax),
                total: Number(inv.total),
                status: inv.status,
                createdAt: inv.createdAt.toISOString()
            }))
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/restaurant/invoices - Create invoice
export async function POST(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, customerName, customerTaxId, subtotal, tax } = body;

        if (!customerName || subtotal === undefined) {
            return NextResponse.json({ error: 'Customer name and subtotal required' }, { status: 400 });
        }

        // Generate invoice number
        const count = await db.invoice.count({ where: { restaurantId } });
        const invoiceNumber = `INV-${(count + 1).toString().padStart(6, '0')}`;

        const taxAmount = tax ?? (subtotal * 0.16); // Default 16% tax
        const total = subtotal + taxAmount;

        const invoice = await db.invoice.create({
            data: {
                restaurantId,
                invoiceNumber,
                orderId: orderId || null,
                customerName,
                customerTaxId: customerTaxId || null,
                subtotal,
                tax: taxAmount,
                total,
                status: 'pending'
            }
        });

        return NextResponse.json({ invoice }, { status: 201 });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/restaurant/invoices - Update invoice status
export async function PATCH(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const invoiceId = searchParams.get('id');

        if (!invoiceId) {
            return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
        }

        const body = await req.json();
        const { status } = body;

        if (!status || !['pending', 'paid', 'cancelled'].includes(status)) {
            return NextResponse.json({ error: 'Valid status required' }, { status: 400 });
        }

        const existing = await db.invoice.findFirst({
            where: { id: invoiceId, restaurantId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const invoice = await db.invoice.update({
            where: { id: invoiceId },
            data: { status }
        });

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
