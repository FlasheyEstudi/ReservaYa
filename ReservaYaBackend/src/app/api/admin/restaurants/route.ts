import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';
import bcrypt from 'bcrypt';
import { handleOptions } from '@/lib/cors';


// Generate business code
function generateBusinessCode(name: string): string {
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
}

// GET /api/admin/restaurants - Get all restaurants (admin only)
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const user = authResult;

        // Only admin can access all restaurants
        const roleCheck = requireRole(['admin'])(user, null as any);
        if (roleCheck) {
            return roleCheck;
        }

        const restaurants = await db.restaurant.findMany({
            include: {
                employees: {
                    where: { role: 'manager' },
                    select: { email: true, fullName: true }
                },
                _count: {
                    select: {
                        tables: true,
                        employees: true,
                        reservations: true,
                        orders: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate revenue for each restaurant
        const restaurantsWithStats = await Promise.all(
            restaurants.map(async (restaurant) => {
                const revenueResult = await db.order.aggregate({
                    where: {
                        restaurantId: restaurant.id,
                        status: 'closed'
                    },
                    _sum: { total: true }
                });

                return {
                    id: restaurant.id,
                    name: restaurant.name,
                    businessCode: restaurant.businessCode,
                    address: restaurant.address,
                    status: restaurant.status,
                    createdAt: restaurant.createdAt,
                    manager: restaurant.employees[0] || null,
                    stats: {
                        tables: restaurant._count.tables,
                        employees: restaurant._count.employees,
                        reservations: restaurant._count.reservations,
                        orders: restaurant._count.orders,
                        revenue: Number(revenueResult._sum.total || 0)
                    }
                };
            })
        );

        return NextResponse.json({ restaurants: restaurantsWithStats });
    } catch (error) {
        console.error('Fetch restaurants error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/admin/restaurants - Create new restaurant (admin only)
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const user = authResult;

        const roleCheck = requireRole(['admin'])(user, null as any);
        if (roleCheck) {
            return roleCheck;
        }

        const body = await request.json();
        const { name, address, managerEmail, status = 'active' } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const businessCode = generateBusinessCode(name);

        const restaurant = await db.restaurant.create({
            data: {
                name,
                businessCode,
                address: address || null,
                status
            }
        });

        // If manager email provided, create employee record with hashed default PIN
        if (managerEmail) {
            const defaultPin = '0000';
            const hashedPin = await bcrypt.hash(defaultPin, 12);


            await db.employee.create({
                data: {
                    restaurantId: restaurant.id,
                    email: managerEmail,
                    role: 'manager',
                    pinHash: hashedPin
                }
            });

            // Send email to manager with temporary PIN
            const { sendEmail } = await import('@/lib/email');
            await sendEmail({
                to: managerEmail,
                subject: 'Bienvenido a ReservaYa - Tus Credenciales',
                text: `Bienvenido. Tu restaurante ${name} ha sido registrado. Tu PIN de acceso temporal es: ${defaultPin}. Por favor cámbialo al ingresar.`
            });

        }

        return NextResponse.json({
            success: true,
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                businessCode: restaurant.businessCode,
                status: restaurant.status
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Create restaurant error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/restaurants - Update restaurant (status, name, address, etc.)
export async function PATCH(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const user = authResult;

        const roleCheck = requireRole(['admin'])(user, null as any);
        if (roleCheck) {
            return roleCheck;
        }

        const body = await request.json();
        const { restaurantId, status, name, address, taxId, config } = body;

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'restaurantId is required' },
                { status: 400 }
            );
        }

        // Validate status if provided
        if (status && !['active', 'suspended', 'pending'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be active, suspended, or pending' },
                { status: 400 }
            );
        }

        // Build update data dynamically
        const updateData: Record<string, any> = {};
        if (status !== undefined) updateData.status = status;
        if (name !== undefined) updateData.name = name;
        if (address !== undefined) updateData.address = address;
        if (taxId !== undefined) updateData.taxId = taxId;
        if (config !== undefined) updateData.config = typeof config === 'string' ? config : JSON.stringify(config);

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }

        const updated = await db.restaurant.update({
            where: { id: restaurantId },
            data: updateData
        });

        return NextResponse.json({
            message: 'Restaurant updated successfully',
            restaurant: {
                id: updated.id,
                name: updated.name,
                address: updated.address,
                status: updated.status
            }
        });
    } catch (error) {
        console.error('Update restaurant error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle OPTIONS for CORS
// Handle OPTIONS for CORS
export { handleOptions as OPTIONS };

