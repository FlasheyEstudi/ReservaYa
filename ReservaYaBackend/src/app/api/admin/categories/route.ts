import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/categories - Get cuisine categories (aggregated from menu categories)
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        // Get unique category names from menu items across all restaurants
        const menuCategories = await db.menuItem.groupBy({
            by: ['category'],
            where: { category: { not: null } },
            _count: { id: true }
        });

        // Build categories list with restaurant counts
        const categories = menuCategories.map((cat, index) => ({
            id: `cat-${index}`,
            name: cat.category || 'Sin categoría',
            restaurants: cat._count.id
        }));

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Fetch categories error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/categories - Create is handled locally for now (no global categories table)
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        // For now, categories are managed in-memory on frontend
        // A future enhancement would add a global Categories table
        return NextResponse.json({
            success: true,
            message: 'Categories are managed locally. Consider adding a global Categories table for persistence.'
        });
    } catch (error) {
        console.error('Create category error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
