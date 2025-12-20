import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { sanitizeUserContent } from '@/lib/sanitize';

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET environment variable is not set');
    }
    return secret;
}
const JWT_SECRET = getJwtSecret();

// Helper to get user from token
async function getUserFromToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { uid: string };
        return decoded.uid;
    } catch {
        return null;
    }
}

// GET /api/reviews - Get reviews for a restaurant or user's reviews
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const restaurantId = searchParams.get('restaurantId');
        const userId = searchParams.get('userId');

        // Security: If userId is requested, verify it's the authenticated user (IDOR protection)
        if (userId) {
            const authenticatedUserId = await getUserFromToken(req);
            if (userId !== authenticatedUserId) {
                return NextResponse.json(
                    { error: 'Cannot view reviews for other users' },
                    { status: 403 }
                );
            }
        }

        const where: any = {};
        if (restaurantId) where.restaurantId = restaurantId;
        if (userId) where.userId = userId;

        const reviews = await db.review.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                    }
                },
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // Calculate average rating for restaurant
        let averageRating: number | null = null;
        if (restaurantId) {
            const result = await db.review.aggregate({
                where: { restaurantId },
                _avg: { rating: true },
                _count: { rating: true }
            });
            averageRating = result._avg.rating;
        }

        return NextResponse.json({
            reviews: reviews.map(r => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                replyText: r.replyText,
                createdAt: r.createdAt,
                user: r.user?.fullName || 'Anónimo',
                restaurant: r.restaurant?.name
            })),
            averageRating,
            totalReviews: reviews.length
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/reviews - Create a new review
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserFromToken(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { restaurantId, rating } = body;
        // Sanitize comment to prevent XSS
        const comment = sanitizeUserContent(body.comment, 2000);

        if (!restaurantId || !rating) {
            return NextResponse.json({ error: 'Restaurant ID and rating required' }, { status: 400 });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
        }

        // Check if user already reviewed this restaurant
        const existingReview = await db.review.findFirst({
            where: { userId, restaurantId }
        });

        if (existingReview) {
            // Update existing review
            const updated = await db.review.update({
                where: { id: existingReview.id },
                data: { rating, comment }
            });
            return NextResponse.json({ review: updated, message: 'Review updated' });
        }

        // Create new review
        const review = await db.review.create({
            data: {
                userId,
                restaurantId,
                rating,
                comment
            }
        });

        return NextResponse.json({ review, message: 'Review created' }, { status: 201 });
    } catch (error) {
        console.error('Error creating review:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
