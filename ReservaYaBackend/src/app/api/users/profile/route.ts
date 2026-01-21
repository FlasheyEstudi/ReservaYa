import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

// Helper to get user ID from token
function getUserFromToken(req: NextRequest): { uid: string; role: string } | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production') as any;
        return { uid: decoded.uid, role: decoded.role };
    } catch {
        return null;
    }
}

// GET /api/users/profile - Get current user profile
export async function GET(req: NextRequest) {
    try {
        const auth = getUserFromToken(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: auth.uid },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                preferences: true,
                createdAt: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.fullName,
                phone: user.phone,
                preferences: user.preferences,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/users/profile - Update current user profile
export async function PUT(req: NextRequest) {
    try {
        const auth = getUserFromToken(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, bio, preferences } = body;

        // Build update data
        const updateData: any = {};
        if (name !== undefined) updateData.fullName = name;
        if (phone !== undefined) updateData.phone = phone;
        if (preferences !== undefined) updateData.preferences = JSON.stringify(preferences);

        // Update user
        const updatedUser = await db.user.update({
            where: { id: auth.uid },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                preferences: true
            }
        });

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.fullName,
                phone: updatedUser.phone,
                preferences: updatedUser.preferences
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
