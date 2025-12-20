import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/notifications - Get admin notifications from real system events
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Get recent users (new registrations)
        const newUsers = await db.user.findMany({
            where: { createdAt: { gte: last7Days } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, email: true, fullName: true, createdAt: true }
        });

        // Get recent restaurants
        const newRestaurants = await db.restaurant.findMany({
            where: { createdAt: { gte: last7Days } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, name: true, status: true, createdAt: true }
        });

        // Get recent reviews (potential alerts for trending/vulgar)
        const recentReviews = await db.review.findMany({
            where: { createdAt: { gte: last7Days } },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                restaurant: { select: { name: true } },
                user: { select: { fullName: true, email: true } }
            }
        });

        // Get restaurants with many recent reviews (trending)
        const restaurantReviewCounts = await db.review.groupBy({
            by: ['restaurantId'],
            where: { createdAt: { gte: last7Days } },
            _count: { id: true },
            _avg: { rating: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        const trendingRestaurants = await Promise.all(
            restaurantReviewCounts
                .filter(r => r._count.id >= 3) // At least 3 reviews in last week
                .map(async (r) => {
                    const restaurant = await db.restaurant.findUnique({
                        where: { id: r.restaurantId },
                        select: { id: true, name: true }
                    });
                    return {
                        restaurant,
                        reviewCount: r._count.id,
                        avgRating: r._avg.rating
                    };
                })
        );

        // Get low-rated reviews (potential issues)
        const lowRatedReviews = recentReviews.filter(r => r.rating <= 2);

        // Get today's reservations count
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const reservationsToday = await db.reservation.count({
            where: { createdAt: { gte: todayStart } }
        });

        // Build notifications array
        const notifications: any[] = [];

        // New user registrations
        newUsers.forEach(user => {
            notifications.push({
                id: `user-${user.id}`,
                type: 'user_registration',
                title: 'Nuevo usuario registrado',
                message: `${user.fullName || user.email} se ha registrado`,
                data: { userId: user.id, email: user.email },
                createdAt: user.createdAt,
                read: false,
                icon: '👤',
                color: 'blue'
            });
        });

        // New restaurants
        newRestaurants.forEach(restaurant => {
            notifications.push({
                id: `restaurant-${restaurant.id}`,
                type: 'restaurant_created',
                title: 'Nuevo restaurante creado',
                message: `${restaurant.name} se ha registrado (${restaurant.status})`,
                data: { restaurantId: restaurant.id },
                createdAt: restaurant.createdAt,
                read: false,
                icon: '🏪',
                color: 'green'
            });
        });

        // Trending restaurants
        trendingRestaurants.forEach(item => {
            if (item.restaurant) {
                notifications.push({
                    id: `trending-${item.restaurant.id}`,
                    type: 'restaurant_trending',
                    title: '🔥 Restaurante en racha',
                    message: `${item.restaurant.name} tiene ${item.reviewCount} reseñas esta semana (${item.avgRating?.toFixed(1)}★)`,
                    data: { restaurantId: item.restaurant.id },
                    createdAt: new Date(), // Current
                    read: false,
                    icon: '🔥',
                    color: 'orange'
                });
            }
        });

        // Low rated reviews (potential issues)
        lowRatedReviews.forEach(review => {
            notifications.push({
                id: `review-${review.id}`,
                type: 'low_rating',
                title: 'Reseña con baja calificación',
                message: `${review.user.fullName || review.user.email} dio ${review.rating}★ a ${review.restaurant.name}`,
                data: { reviewId: review.id, restaurantId: review.restaurantId },
                createdAt: review.createdAt,
                read: false,
                icon: '⚠️',
                color: 'red'
            });
        });

        // Sort by date (newest first)
        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Stats
        const stats = {
            unread: notifications.length,
            newUsers: newUsers.length,
            newRestaurants: newRestaurants.length,
            lowRatings: lowRatedReviews.length,
            trending: trendingRestaurants.length,
            reservationsToday
        };

        return NextResponse.json({
            notifications: notifications.slice(0, 50), // Limit to 50 most recent
            stats
        });
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
