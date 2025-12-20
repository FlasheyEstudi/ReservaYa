import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST /api/auth/user/login - Customer/User login
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

        // Find user by email
        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                uid: user.id,
                role: 'CUSTOMER',
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                role: 'CUSTOMER',
                email: user.email,
                fullName: user.fullName,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error('User login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
