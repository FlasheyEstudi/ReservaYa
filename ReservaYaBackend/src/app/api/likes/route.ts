import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper to get user from token
async function getUserFromToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.split(' ')[1];
        // The payload uses 'uid' not 'userId' based on login implementation
        const decoded = jwt.verify(token, JWT_SECRET) as { uid: string };
        return decoded.uid;
    } catch {
        return null;
    }
}

// GET /api/likes - Get user's liked restaurants
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserFromToken(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const likes = await db.like.findMany({
            where: { userId },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        category: true,
                        image: true,
                        description: true
                    }
                }
            }
        });

        return NextResponse.json({
            likes,
            likedRestaurantIds: likes.map(l => l.restaurantId),
            // Include restaurant details for profile display
            likedRestaurants: likes.map(l => ({
                id: l.restaurant.id,
                name: l.restaurant.name,
                address: l.restaurant.address,
                category: (l.restaurant as any).category || 'General',
                image: (l.restaurant as any).image || null,
                description: (l.restaurant as any).description || ''
            }))
        });
    } catch (error) {
        console.error('Error fetching likes:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


// POST /api/likes - Like or unlike a restaurant
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserFromToken(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { restaurantId } = await req.json();
        if (!restaurantId) {
            return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
        }

        // Check if already liked
        const existingLike = await db.like.findUnique({
            where: {
                userId_restaurantId: { userId, restaurantId }
            }
        });

        if (existingLike) {
            // Unlike - remove the like
            await db.like.delete({
                where: { id: existingLike.id }
            });
            return NextResponse.json({ liked: false, message: 'Like removed' });
        } else {
            // Like - add new like
            await db.like.create({
                data: { userId, restaurantId }
            });
            return NextResponse.json({ liked: true, message: 'Restaurant liked' });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
