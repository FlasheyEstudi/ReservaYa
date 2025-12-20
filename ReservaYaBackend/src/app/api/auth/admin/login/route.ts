
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST /api/auth/admin/login - Platform Administrator login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find admin by email
        const admin = await db.admin.findUnique({
            where: { email }
        });

        if (!admin || !admin.isActive) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                uid: admin.id,
                role: 'ADMIN',
                email: admin.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return NextResponse.json({
            token,
            user: {
                id: admin.id,
                role: 'ADMIN',
                email: admin.email,
                fullName: admin.fullName
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
