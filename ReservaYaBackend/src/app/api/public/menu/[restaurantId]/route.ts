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

// GET /api/public/menu/[restaurantId] - Public menu without authentication
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ restaurantId: string }> }
) {
    try {
        const { restaurantId } = await params;

        // Validate restaurantId
        if (!restaurantId) {
            return NextResponse.json(
                { error: 'Restaurant ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Get restaurant info (only public fields)
        const restaurant = await db.restaurant.findUnique({
            where: { id: restaurantId },
            select: {
                id: true,
                name: true,
                description: true,
                image: true,
                category: true,
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

        // Only show menu if restaurant is active
        if (restaurant.status !== 'active') {
            return NextResponse.json(
                { error: 'Restaurant is not available' },
                { status: 403, headers: corsHeaders }
            );
        }

        // Get menu categories with items
        const categories = await db.menuCategory.findMany({
            where: { restaurantId },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                name: true,
                sortOrder: true
            }
        });

        // Get menu items (only available ones)
        const menuItems = await db.menuItem.findMany({
            where: {
                restaurantId,
                isAvailable: true
            },
            orderBy: [
                { categoryId: 'asc' },
                { name: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
                categoryId: true,
                category: true // Legacy field
            }
        });

        // Group items by category
        const menuByCategory = categories.map(cat => ({
            ...cat,
            items: menuItems.filter(item => item.categoryId === cat.id)
        }));

        // Items without category
        const uncategorizedItems = menuItems.filter(item => !item.categoryId);
        if (uncategorizedItems.length > 0) {
            menuByCategory.push({
                id: 'uncategorized',
                name: 'Otros',
                sortOrder: 999,
                items: uncategorizedItems
            });
        }

        return NextResponse.json({
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                description: restaurant.description,
                image: restaurant.image,
                category: restaurant.category,
                address: restaurant.address,
                phone: restaurant.phone
            },
            menu: menuByCategory,
            totalItems: menuItems.length
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Error fetching public menu:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
