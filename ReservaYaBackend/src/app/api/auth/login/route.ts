import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { checkRateLimit, getClientIp, createRateLimitKey, RATE_LIMIT_PRESETS } from '@/lib/rateLimit';

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET environment variable is not set');
    }
    return secret;
}
const JWT_SECRET = getJwtSecret();

// Unified login - handles Admin, Customer, and Restaurant Manager by email
// POST /api/auth/login
export async function POST(request: NextRequest) {
    try {
        // Rate limiting - prevent brute force attacks
        const clientIp = getClientIp(request);
        const rateLimitKey = createRateLimitKey(clientIp, 'login');
        const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_PRESETS.auth);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Too many login attempts. Please try again later.',
                    retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
                },
                {
                    status: 429,
                    headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
                }
            );
        }

        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Dummy hash for timing attack mitigation (same cost as real hashes)
        // This hash was generated with bcrypt.hash('dummy', 12) to have valid format
        const DUMMY_HASH = '$2b$12$K4J5jVhG6X5zvHR8YjR3HOkEhMnMhU/5/.w5KhQ8YhPqHKzL6QOZK';

        // ============================================================
        // TIMING ATTACK MITIGATION: All bcrypt.compare calls execute
        // regardless of whether user exists to prevent enumeration
        // ============================================================

        // 1. Check Admin
        const admin = await db.admin.findUnique({
            where: { email }
        });
        const adminHash = (admin && admin.isActive) ? admin.passwordHash : DUMMY_HASH;
        const isValidAdminPassword = await bcrypt.compare(password, adminHash);

        if (admin && admin.isActive && isValidAdminPassword) {
            const token = jwt.sign(
                { uid: admin.id, role: 'ADMIN', email: admin.email },
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
        }

        // 2. Check Employee (manager) - TIMING SAFE
        const employee = await db.employee.findFirst({
            where: { email, role: 'manager', isActive: true },
            include: { restaurant: { include: { organization: true } } }
        });
        const employeeHash = employee ? employee.pinHash : DUMMY_HASH;
        const isValidEmployeePassword = await bcrypt.compare(password, employeeHash);

        if (employee && isValidEmployeePassword) {
            const token = jwt.sign(
                {
                    uid: employee.id,
                    rid: employee.restaurantId,
                    oid: employee.restaurant?.organizationId || undefined,
                    role: 'RESTAURANT',
                    email: employee.email
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            return NextResponse.json({
                token,
                user: {
                    id: employee.id,
                    role: 'RESTAURANT',
                    email: employee.email,
                    fullName: employee.fullName,
                    restaurantId: employee.restaurantId,
                    restaurant: employee.restaurant,
                    organizationId: employee.restaurant?.organizationId,
                    organization: employee.restaurant?.organization
                }
            });
        }

        // 3. Check User (customer) - TIMING SAFE
        const user = await db.user.findUnique({
            where: { email }
        });
        const userHash = user ? user.passwordHash : DUMMY_HASH;
        const isValidUserPassword = await bcrypt.compare(password, userHash);

        if (user && isValidUserPassword) {
            const token = jwt.sign(
                { uid: user.id, role: 'CUSTOMER', email: user.email },
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
        }

        // If none found or password invalid - response time is constant
        return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
        );

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle OPTIONS preflight request for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
        },
    });
}
