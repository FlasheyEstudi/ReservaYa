import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// CORS headers for public endpoint
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/public/restaurant/[id]/locations - Get all locations/branches for a restaurant
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: restaurantId } = await params;

        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Get the restaurant
        const restaurant = await db.restaurant.findUnique({
            where: { id: restaurantId },
            select: {
                id: true,
                name: true,
                organizationId: true,
                address: true,
                phone: true,
                status: true
            }
        });

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // If no organization, return just this restaurant as the only location
        if (!restaurant.organizationId) {
            return NextResponse.json({
                hasMultipleLocations: false,
                locations: [{
                    id: restaurant.id,
                    name: restaurant.name,
                    address: restaurant.address,
                    phone: restaurant.phone,
                    isActive: restaurant.status === 'active'
                }]
            }, { headers: corsHeaders });
        }

        // Get all active locations in the organization
        const locations = await db.restaurant.findMany({
            where: {
                organizationId: restaurant.organizationId,
                status: 'active'
            },
            select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                image: true,
                description: true
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            hasMultipleLocations: locations.length > 1,
            organizationName: restaurant.name.split(' ')[0], // Use first word as org name
            locations: locations.map(loc => ({
                ...loc,
                isActive: true
            }))
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Error fetching locations:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
