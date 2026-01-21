import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Helper to decode JWT
function getTokenPayload(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET) as any;
    } catch {
        return null;
    }
}

// GET /api/loyalty/program - Get loyalty program for a restaurant
// For manager: get their restaurant's program
// For user: get program by restaurantId query param
export async function GET(req: NextRequest) {
    try {
        const decoded = getTokenPayload(req);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const { searchParams } = new URL(req.url);
        // Support both rid (employee token) and restaurantId (query param for users)
        const restaurantId = searchParams.get('restaurantId') || decoded.rid;

        if (!restaurantId) {
            return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400, headers: corsHeaders });
        }

        const program = await db.loyaltyProgram.findUnique({
            where: { restaurantId },
            include: {
                restaurant: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        });

        return NextResponse.json({ program }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error fetching loyalty program:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}

// POST /api/loyalty/program - Create/Update loyalty program (manager only)
export async function POST(req: NextRequest) {
    try {
        const decoded = getTokenPayload(req);
        // Use rid from employee token
        if (!decoded?.rid) {
            return NextResponse.json({ error: 'Unauthorized - restaurant access required' }, { status: 401, headers: corsHeaders });
        }

        const body = await req.json();
        const { visitsRequired, rewardTitle, rewardDescription, isActive } = body;

        const program = await db.loyaltyProgram.upsert({
            where: { restaurantId: decoded.rid },
            create: {
                restaurantId: decoded.rid,
                visitsRequired: visitsRequired || 10,
                rewardTitle: rewardTitle || 'Postre gratis',
                rewardDescription: rewardDescription,
                isActive: isActive !== false
            },
            update: {
                visitsRequired: visitsRequired,
                rewardTitle: rewardTitle,
                rewardDescription: rewardDescription,
                isActive: isActive
            }
        });

        return NextResponse.json({
            message: 'Loyalty program saved',
            program
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error saving loyalty program:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}
