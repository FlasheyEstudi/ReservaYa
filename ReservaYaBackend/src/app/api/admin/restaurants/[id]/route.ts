import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/restaurants/[id] - Get restaurant details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const { id } = await params;

        const restaurant = await db.restaurant.findUnique({
            where: { id },
            include: {
                employees: {
                    where: { role: 'manager' },
                    select: { id: true, email: true, fullName: true }
                },
                tables: {
                    select: { id: true, tableNumber: true, capacity: true, currentStatus: true },
                    orderBy: { tableNumber: 'asc' }
                },
                reviews: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { fullName: true } } }
                },
                _count: {
                    select: { reservations: true, orders: true, reviews: true, employees: true }
                }
            }
        });

        if (!restaurant) {
            return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
        }

        // Get all employees for display
        const allEmployees = await db.employee.findMany({
            where: { restaurantId: id },
            select: { id: true, email: true, fullName: true, role: true }
        });

        // Get menu items
        const menuItems = await db.menuItem.findMany({
            where: { restaurantId: id },
            take: 20,
            orderBy: { name: 'asc' },
            select: { id: true, name: true, price: true, category: true }
        });

        return NextResponse.json({
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                businessCode: restaurant.businessCode,
                address: restaurant.address,
                status: restaurant.status,
                config: restaurant.config,
                tables: restaurant.tables.map(t => ({
                    id: t.id,
                    number: t.tableNumber,
                    capacity: t.capacity,
                    status: t.currentStatus
                })),
                employees: allEmployees.map(e => ({
                    id: e.id,
                    user: { fullName: e.fullName, email: e.email },
                    role: e.role
                })),
                manager: restaurant.employees[0] ? {
                    id: restaurant.employees[0].id,
                    email: restaurant.employees[0].email,
                    fullName: restaurant.employees[0].fullName
                } : null,
                menu: menuItems,
                reviews: restaurant.reviews,
                _count: restaurant._count
            }
        });
    } catch (error) {
        console.error('Fetch restaurant error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/restaurants/[id] - Update restaurant
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const { id } = await params;
        const body = await request.json();
        const { name, address, status, config } = body;

        const restaurant = await db.restaurant.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(address !== undefined && { address }),
                ...(status !== undefined && { status }),
                ...(config !== undefined && { config })
            }
        });

        return NextResponse.json({ success: true, restaurant });
    } catch (error) {
        console.error('Update restaurant error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/restaurants/[id] - Delete restaurant
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const { id } = await params;

        await db.restaurant.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete restaurant error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
