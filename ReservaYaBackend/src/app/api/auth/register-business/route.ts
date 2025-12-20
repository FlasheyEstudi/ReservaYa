import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBusinessCode, hashPin, generateToken } from '@/lib/auth';
import { BusinessRegistrationSchema } from '@/lib/validation';

// POST /api/auth/register-business - Business registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tax_id, owner_email, owner_password, owner_full_name } = BusinessRegistrationSchema.parse(body);

    // Check if restaurant with same name already exists
    const existingRestaurant = await db.restaurant.findFirst({
      where: { name }
    });

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'Restaurant with this name already exists' },
        { status: 400 }
      );
    }

    // Generate unique business code
    let businessCode = generateBusinessCode(name);
    let codeExists = await db.restaurant.findUnique({
      where: { businessCode }
    });

    // Ensure uniqueness
    while (codeExists) {
      businessCode = generateBusinessCode(name);
      codeExists = await db.restaurant.findUnique({
        where: { businessCode }
      });
    }

    // Create organization, restaurant and manager in a transaction
    const result = await db.$transaction(async (tx) => {
      // First, create a User for the owner (to link Organization)
      const existingUser = await tx.user.findUnique({
        where: { email: owner_email }
      });

      let ownerId: string;
      if (existingUser) {
        ownerId = existingUser.id;
      } else {
        const owner = await tx.user.create({
          data: {
            email: owner_email,
            passwordHash: await hashPin(owner_password),
            fullName: owner_full_name
          }
        });
        ownerId = owner.id;
      }

      // Create organization
      const organization = await tx.organization.create({
        data: {
          name,
          ownerId
        }
      });

      // Create restaurant linked to organization
      const restaurant = await tx.restaurant.create({
        data: {
          name,
          businessCode,
          taxId: tax_id,
          organizationId: organization.id,
          status: 'pending', // Requires approval
          config: JSON.stringify({
            service_charge: 10,
            currency: 'USD'
          })
        }
      });

      // Hash the owner's password
      const hashedPin = await hashPin(owner_password);

      // Create manager employee
      const manager = await tx.employee.create({
        data: {
          restaurantId: restaurant.id,
          email: owner_email,
          pinHash: hashedPin,
          role: 'manager',
          isActive: true
        }
      });

      return { organization, restaurant, manager };
    });

    // Generate token for the new manager (includes organizationId)
    const token = generateToken({
      uid: result.manager.id,
      rid: result.restaurant.id,
      oid: result.organization.id,
      role: result.manager.role,
      email: result.manager.email
    });

    return NextResponse.json({
      message: 'Restaurant registered successfully. Pending approval.',
      business_code: result.restaurant.businessCode,
      token,
      organization: {
        id: result.organization.id,
        name: result.organization.name
      },
      restaurant: {
        id: result.restaurant.id,
        name: result.restaurant.name,
        businessCode: result.restaurant.businessCode,
        status: result.restaurant.status
      },
      manager: {
        id: result.manager.id,
        email: result.manager.email,
        role: result.manager.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}