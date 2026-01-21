import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { corsHeaders, handleOptions } from '@/lib/cors';

const JWT_SECRET = getJwtSecret();

export { handleOptions as OPTIONS };


// POST /api/auth/register - Register new customer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, fullName, phone } = body;

        // Validate required fields
        if (!email || !password || !fullName) {
            return NextResponse.json(
                { error: 'Email, password and fullName are required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Validate password strength
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Check if email already exists
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409, headers: corsHeaders() }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await db.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                phone: phone || null
            }
        });

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
        }, { status: 201, headers: corsHeaders() });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
