import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import { db } from '@/lib/db';

// GET /api/auth/verify - Verify JWT token and return user info
export async function GET(request: NextRequest) {
    const authResult = await authenticateToken(request);

    if (authResult instanceof NextResponse) {
        return authResult; // Token invalid or missing
    }

    const { uid, role, email, rid } = authResult;

    // Define user data type
    interface VerifiedUser {
        id: string;
        email: string;
        fullName: string | null;
        role: string;
        isActive?: boolean;
        restaurantId?: string;
    }

    try {
        // Fetch fresh user data based on role
        let userData: VerifiedUser | null = null;

        if (role === 'ADMIN' || role === 'admin') {
            const admin = await db.admin.findUnique({
                where: { id: uid },
                select: { id: true, email: true, fullName: true, isActive: true }
            });
            if (admin && admin.isActive) {
                userData = { ...admin, role: 'ADMIN' };
            }
        } else if (role === 'RESTAURANT' || role === 'manager') {
            const employee = await db.employee.findUnique({
                where: { id: uid },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    isActive: true,
                    restaurantId: true
                }
            });
            if (employee && employee.isActive) {
                userData = {
                    ...employee,
                    role: employee.role.toUpperCase()
                };
            }
        } else if (role === 'CUSTOMER' || role === 'customer') {
            const user = await db.user.findUnique({
                where: { id: uid },
                select: { id: true, email: true, fullName: true }
            });
            if (user) {
                userData = { ...user, role: 'CUSTOMER' };
            }
        } else {
            // Employee with other roles (waiter, chef, etc.)
            const employee = await db.employee.findUnique({
                where: { id: uid },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    isActive: true,
                    restaurantId: true
                }
            });
            if (employee && employee.isActive) {
                userData = {
                    ...employee,
                    role: employee.role.toUpperCase()
                };
            }
        }

        if (!userData) {
            return NextResponse.json(
                { error: 'User not found or inactive' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            valid: true,
            user: userData,
            role: userData.role
        });

    } catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}

// Handle OPTIONS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
