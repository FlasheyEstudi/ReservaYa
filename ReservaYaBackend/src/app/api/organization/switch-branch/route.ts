import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, generateToken } from '@/lib/auth';

// POST /api/organization/switch-branch - Switch to a different branch
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        const body = await request.json();
        const { branchId } = body;

        if (!branchId) {
            return NextResponse.json({ error: 'branchId is required' }, { status: 400 });
        }

        // Get the current employee
        const employee = await db.employee.findFirst({
            where: {
                id: decoded.uid,
                isActive: true
            },
            include: { restaurant: true }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Get the target branch
        const targetBranch = await db.restaurant.findUnique({
            where: { id: branchId }
        });

        if (!targetBranch) {
            return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        // Verify same organization (if multi-branch)
        if (employee.restaurant.organizationId && targetBranch.organizationId) {
            if (employee.restaurant.organizationId !== targetBranch.organizationId) {
                return NextResponse.json({ error: 'Unauthorized - different organization' }, { status: 403 });
            }
        }

        // Generate new token for the target branch
        const newToken = generateToken({
            uid: employee.id,
            rid: targetBranch.id,
            oid: targetBranch.organizationId || undefined,
            role: employee.role,
            email: employee.email
        });

        return NextResponse.json({
            token: newToken,
            restaurant: {
                id: targetBranch.id,
                name: targetBranch.name,
                businessCode: targetBranch.businessCode,
                address: targetBranch.address
            },
            message: `Switched to ${targetBranch.name}`
        });
    } catch (error) {
        console.error('Error switching branch:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
