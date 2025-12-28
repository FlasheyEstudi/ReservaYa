import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface AdminPayload {
    uid: string;
    role: string;
    email: string;
}

function verifyAdminToken(req: NextRequest): AdminPayload | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
        if (decoded.role?.toUpperCase() !== 'ADMIN') return null;
        return decoded;
    } catch {
        return null;
    }
}

// GET /api/admin/notifications - Get admin notifications from real system events
export async function GET(request: NextRequest) {
    const admin = verifyAdminToken(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get IDs this admin has already read
        const readNotifications = await db.adminNotificationRead.findMany({
            where: { adminId: admin.uid },
            select: { notificationId: true }
        });
        const readIds = new Set(readNotifications.map(r => r.notificationId));

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

        // Get recent reviews
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
                .filter(r => r._count.id >= 3)
                .map(async (r) => {
                    const restaurant = await db.restaurant.findUnique({
                        where: { id: r.restaurantId },
                        select: { id: true, name: true }
                    });
                    return { restaurant, reviewCount: r._count.id, avgRating: r._avg.rating };
                })
        );

        // Get low-rated reviews
        const lowRatedReviews = recentReviews.filter(r => r.rating <= 2);

        // Get today's reservations count
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const reservationsToday = await db.reservation.count({
            where: { createdAt: { gte: todayStart } }
        });

        // Build notifications array
        const notifications: any[] = [];

        newUsers.forEach(user => {
            const id = `user-${user.id}`;
            notifications.push({
                id,
                type: 'user_registration',
                title: 'Nuevo usuario registrado',
                message: `${user.fullName || user.email} se ha registrado`,
                data: { userId: user.id, email: user.email },
                createdAt: user.createdAt,
                read: readIds.has(id),
                icon: '👤',
                color: 'blue'
            });
        });

        newRestaurants.forEach(restaurant => {
            const id = `restaurant-${restaurant.id}`;
            notifications.push({
                id,
                type: 'restaurant_created',
                title: 'Nuevo restaurante creado',
                message: `${restaurant.name} se ha registrado (${restaurant.status})`,
                data: { restaurantId: restaurant.id },
                createdAt: restaurant.createdAt,
                read: readIds.has(id),
                icon: '🏪',
                color: 'green'
            });
        });

        trendingRestaurants.forEach(item => {
            if (item.restaurant) {
                const id = `trending-${item.restaurant.id}`;
                notifications.push({
                    id,
                    type: 'restaurant_trending',
                    title: '🔥 Restaurante en racha',
                    message: `${item.restaurant.name} tiene ${item.reviewCount} reseñas esta semana (${item.avgRating?.toFixed(1)}★)`,
                    data: { restaurantId: item.restaurant.id },
                    createdAt: new Date(),
                    read: readIds.has(id),
                    icon: '🔥',
                    color: 'orange'
                });
            }
        });

        lowRatedReviews.forEach(review => {
            const id = `review-${review.id}`;
            notifications.push({
                id,
                type: 'low_rating',
                title: 'Reseña con baja calificación',
                message: `${review.user.fullName || review.user.email} dio ${review.rating}★ a ${review.restaurant.name}`,
                data: { reviewId: review.id, restaurantId: review.restaurantId },
                createdAt: review.createdAt,
                read: readIds.has(id),
                icon: '⚠️',
                color: 'red'
            });
        });

        // Sort by date (newest first)
        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Calculate unread count from database
        const unreadCount = notifications.filter(n => !n.read).length;

        const stats = {
            unread: unreadCount,
            newUsers: newUsers.length,
            newRestaurants: newRestaurants.length,
            lowRatings: lowRatedReviews.length,
            trending: trendingRestaurants.length,
            reservationsToday
        };

        return NextResponse.json({
            notifications: notifications.slice(0, 50),
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
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
