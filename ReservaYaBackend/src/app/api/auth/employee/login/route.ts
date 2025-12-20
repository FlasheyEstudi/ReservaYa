import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPin, generateToken, generateBusinessCode, hashPin } from '@/lib/auth';
import { EmployeeLoginSchema, BusinessRegistrationSchema } from '@/lib/validation';

// POST /api/auth/employee/login - Employee login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurant_code, email, pin } = EmployeeLoginSchema.parse(body);

    // Find restaurant by business code (include organization relation)
    const restaurant = await db.restaurant.findUnique({
      where: { businessCode: restaurant_code },
      include: { organization: { select: { id: true, name: true } } }
    });

    if (!restaurant || restaurant.status !== 'active') {
      return NextResponse.json(
        { error: 'Restaurant not found or inactive' },
        { status: 403 }
      );
    }

    // Find employee by restaurant and email
    const employee = await db.employee.findFirst({
      where: {
        restaurantId: restaurant.id,
        email: email,
        isActive: true
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify PIN
    const isValidPin = await verifyPin(pin, employee.pinHash);
    if (!isValidPin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token (includes organizationId if available)
    const token = generateToken({
      uid: employee.id,
      rid: restaurant.id,
      oid: restaurant.organizationId || undefined,
      role: employee.role,
      email: employee.email
    });

    return NextResponse.json({
      token,
      user: {
        id: employee.id,
        role: employee.role,
        email: employee.email,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        organizationId: restaurant.organizationId,
        organizationName: restaurant.organization?.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}