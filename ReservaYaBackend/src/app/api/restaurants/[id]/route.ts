import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/restaurants/[id] - Get public restaurant details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch restaurant with details
        const restaurant = await db.restaurant.findUnique({
            where: { id },
            include: {
                tables: {
                    select: {
                        id: true,
                        capacity: true,
                        currentStatus: true
                    }
                },
                reviews: {
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        user: {
                            select: {
                                fullName: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5 // Limit recent reviews
                },
                menuItems: {
                    where: { isAvailable: true },
                    orderBy: [
                        { category: 'asc' },
                        { name: 'asc' }
                    ]
                },
                _count: {
                    select: {
                        reviews: true,
                        likes: true
                    }
                }
            }
        });

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        // Calculate rating
        const averageRating = restaurant.reviews.length > 0
            ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length
            : 0;

        return NextResponse.json({
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                description: restaurant.description || 'Una experiencia culinaria única.',
                address: restaurant.address,
                phone: restaurant.phone,
                business_code: restaurant.businessCode,
                image: restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop',
                rating: averageRating,
                review_count: restaurant._count.reviews,
                likes_count: restaurant._count.likes,
                category: restaurant.category || 'Restaurante',
                tables: restaurant.tables,
                menu_items: restaurant.menuItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    category: item.category,
                    image: item.image || `https://source.unsplash.com/400x300/?food,${item.category}`
                })),
                reviews: restaurant.reviews.map(review => ({
                    id: review.id,
                    user: review.user.fullName || 'Usuario',
                    rating: review.rating,
                    comment: review.comment,
                    date: review.createdAt.toISOString().split('T')[0]
                }))
            }
        });

    } catch (error) {
        console.error('Restaurant details fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
