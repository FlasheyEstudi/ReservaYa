import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

// GET /api/restaurant/staff/[id] - Get single employee
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const employee = await db.employee.findFirst({
            where: { id, restaurantId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        return NextResponse.json({ employee });
    } catch (error) {
        console.error('Error fetching employee:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/restaurant/staff/[id] - Update employee
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        const existing = await db.employee.findFirst({
            where: { id, restaurantId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const { fullName, role, isActive, pin } = body;

        const updateData: any = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (pin) updateData.pinHash = await bcrypt.hash(pin, 10);

        const employee = await db.employee.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true
            }
        });

        return NextResponse.json({ employee });
    } catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/restaurant/staff/[id] - Delete employee
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const existing = await db.employee.findFirst({
            where: { id, restaurantId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        await db.employee.delete({ where: { id } });

        return NextResponse.json({ message: 'Employee deleted' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
