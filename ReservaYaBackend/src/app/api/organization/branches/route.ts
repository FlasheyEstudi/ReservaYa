import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken } from '@/lib/middleware';

// GET /api/organization/branches - List all branches for the organization
export async function GET(request: NextRequest) {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const { rid } = authResult;

    try {
        // Get the restaurant to find its organization
        const restaurant = await db.restaurant.findUnique({
            where: { id: rid },
            include: { organization: true }
        });

        if (!restaurant?.organizationId) {
            // Single restaurant mode - return just this one
            return NextResponse.json({
                organization: null,
                branches: [{
                    id: restaurant?.id,
                    name: restaurant?.name,
                    businessCode: restaurant?.businessCode,
                    address: restaurant?.address,
                    status: restaurant?.status,
                    isCurrent: true
                }],
                totalBranches: 1
            });
        }

        // Multi-branch mode - get all branches
        const branches = await db.restaurant.findMany({
            where: { organizationId: restaurant.organizationId },
            select: {
                id: true,
                name: true,
                businessCode: true,
                address: true,
                phone: true,
                status: true,
                image: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({
            organization: {
                id: restaurant.organization?.id,
                name: restaurant.organization?.name
            },
            branches: branches.map(b => ({
                ...b,
                isCurrent: b.id === rid
            })),
            totalBranches: branches.length
        });

    } catch (error) {
        console.error('Error fetching branches:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/organization/branches - Create a new branch
export async function POST(request: NextRequest) {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) return authResult;

    const { uid, rid, role } = authResult;

    // Only managers can create branches (role = 'manager' from employee login OR 'RESTAURANT' from normal login)
    if (role !== 'manager' && role !== 'RESTAURANT') {
        return NextResponse.json({ error: 'Only managers can create branches' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, address, phone } = body;

        if (!name) {
            return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
        }

        // Get current restaurant and the employee (manager)
        const currentRestaurant = await db.restaurant.findUnique({
            where: { id: rid }
        });

        if (!currentRestaurant) {
            return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
        }

        // Get the employee to find or create a User for organization ownership
        const employee = await db.employee.findUnique({
            where: { id: uid }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // If restaurant doesn't have an organization, create one automatically
        let organizationId = currentRestaurant.organizationId;
        if (!organizationId) {
            // First, find or create a User for this employee
            let user = await db.user.findUnique({
                where: { email: employee.email }
            });

            if (!user) {
                // Create a User based on the employee
                user = await db.user.create({
                    data: {
                        email: employee.email,
                        fullName: employee.fullName,
                        passwordHash: employee.pinHash
                    }
                });
            }

            // Create organization with user as owner
            const organization = await db.organization.create({
                data: {
                    name: currentRestaurant.name,
                    ownerId: user.id
                }
            });
            organizationId = organization.id;

            // Link current restaurant to the new organization
            await db.restaurant.update({
                where: { id: rid },
                data: { organizationId: organization.id }
            });
        }

        // Generate unique business code
        let businessCode = `${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        let codeExists = await db.restaurant.findUnique({
            where: { businessCode }
        });

        while (codeExists) {
            businessCode = `${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
            codeExists = await db.restaurant.findUnique({
                where: { businessCode }
            });
        }

        // Create new branch
        const newBranch = await db.restaurant.create({
            data: {
                name,
                businessCode,
                address,
                phone,
                organizationId: organizationId,
                status: 'pending',
                config: currentRestaurant.config // Copy config from parent
            }
        });

        return NextResponse.json({
            message: 'Branch created successfully',
            branch: {
                id: newBranch.id,
                name: newBranch.name,
                businessCode: newBranch.businessCode,
                status: newBranch.status
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating branch:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
