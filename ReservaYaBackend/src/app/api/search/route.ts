import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SearchRestaurantsSchema } from '@/lib/validation';
import { Prisma } from '@prisma/client';

// Extended restaurant type for search results
interface RestaurantWithExtras {
  id: string;
  name: string;
  businessCode: string;
  address: string | null;
  status: string;
  tables: { id: string; capacity: number; currentStatus: string }[];
  _count?: { reviews: number; likes: number };
  available_capacity: number;
  total_capacity: number;
  average_rating: number;
  review_count: number;
}

// GET /api/search - Search restaurants with availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const queryParams = {
      city: searchParams.get('city'),
      date: searchParams.get('date'),
      party: searchParams.get('party') ? parseInt(searchParams.get('party')!) : undefined,
      search: searchParams.get('search'), // Text search
      category: searchParams.get('category')
    };

    // Build base where clause
    const whereClause: Prisma.RestaurantWhereInput = {
      status: 'active'
    };

    // Text search (name or address)
    if (queryParams.search) {
      whereClause.OR = [
        { name: { contains: queryParams.search, mode: 'insensitive' } },
        { description: { contains: queryParams.search, mode: 'insensitive' } },
        { category: { contains: queryParams.search, mode: 'insensitive' } }
      ];
    }

    // Category filter
    if (queryParams.category && queryParams.category !== 'all') {
      whereClause.category = { contains: queryParams.category, mode: 'insensitive' };
    }

    // City filter
    if (queryParams.city) {
      // Assuming 'address' contains city or future city field
      // For now using name match as placeholder from original code, but address is better
      whereClause.address = { contains: queryParams.city, mode: 'insensitive' };
    }

    // Get total count for pagination
    const totalCount = await db.restaurant.count({ where: whereClause });

    // Get paginated restaurants
    const restaurants = await db.restaurant.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        tables: {
          select: {
            id: true,
            capacity: true,
            currentStatus: true
          }
        },
        reviews: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { fullName: true }
            }
          }
        },
        menuItems: {
          take: 4,
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            image: true
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: {
        // Boost promoted/verified or just newest?
        // Let's sort by popularity (reviews count) or newness
        reviews: { _count: 'desc' }
      }
    });

    // Get likes count separately (only for fetched IDs)
    const restaurantIds = restaurants.map(r => r.id);
    const likeCounts = await db.like.groupBy({
      by: ['restaurantId'],
      where: { restaurantId: { in: restaurantIds } },
      _count: { id: true }
    });
    const likeCountMap = new Map(likeCounts.map(l => [l.restaurantId, l._count.id]));

    // Availability Check Logic (Applied to current page only)
    type RestaurantWithRelations = typeof restaurants[0];

    interface ProcessedRestaurant extends RestaurantWithRelations {
      available_capacity: number;
      is_available: boolean;
      like_count: number;
    }

    let processedRestaurants: ProcessedRestaurant[] = [];

    if (queryParams.date && queryParams.party) {
      const searchDateTime = new Date(queryParams.date);
      const timeWindowStart = new Date(searchDateTime.getTime() - (1.5 * 60 * 60 * 1000));
      const timeWindowEnd = new Date(searchDateTime.getTime() + (1.5 * 60 * 60 * 1000));

      // Batch fetch reservations for this page
      const pageReservations = await db.reservation.findMany({
        where: {
          restaurantId: { in: restaurantIds },
          reservationTime: {
            gte: timeWindowStart,
            lte: timeWindowEnd
          },
          status: { in: ['confirmed', 'seated'] }
        }
      });

      // Create reservation lookup map
      const reservationsByRestaurant = new Map<string, typeof pageReservations>();
      pageReservations.forEach(r => {
        if (!reservationsByRestaurant.has(r.restaurantId)) {
          reservationsByRestaurant.set(r.restaurantId, []);
        }
        reservationsByRestaurant.get(r.restaurantId)!.push(r);
      });

      processedRestaurants = restaurants.map(restaurant => {
        const totalCapacity = restaurant.tables.reduce((sum, t) => sum + t.capacity, 0);
        const existingReservations = reservationsByRestaurant.get(restaurant.id) || [];
        const occupiedSeats = existingReservations.reduce((sum, r) => sum + r.partySize, 0);
        const availableCapacity = totalCapacity - occupiedSeats;

        const isAvailable = availableCapacity >= queryParams.party!;

        return {
          ...restaurant,
          available_capacity: availableCapacity,
          is_available: isAvailable, // Frontend can gray out if false
          like_count: likeCountMap.get(restaurant.id) || 0
        };
      });
    } else {
      // No date filter - all considered "open" based on generic status
      processedRestaurants = restaurants.map(r => ({
        ...r,
        available_capacity: r.tables.reduce((s, t) => s + t.capacity, 0),
        is_available: true,
        like_count: likeCountMap.get(r.id) || 0
      }));
    }

    // Transform for response
    const formattedRestaurants = processedRestaurants.map(restaurant => {
      const avgRating = restaurant.reviews.length > 0
        ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length
        : 0; // Or better, use stored aggregate in DB if available, but calculating for page is cheap

      return {
        id: restaurant.id,
        name: restaurant.name,
        business_code: restaurant.businessCode,
        category: restaurant.category || 'General',
        description: restaurant.description || '',
        address: restaurant.address,
        latitude: restaurant.latitude ? Number(restaurant.latitude) : null,
        longitude: restaurant.longitude ? Number(restaurant.longitude) : null,
        image: restaurant.image || null,
        status: restaurant.status,
        // Availability info
        available_capacity: restaurant.available_capacity,
        is_available: restaurant.is_available,

        total_capacity: restaurant.tables.reduce((s, t) => s + t.capacity, 0),
        average_rating: avgRating,
        review_count: restaurant._count.reviews,
        likes_count: restaurant.like_count,
        table_count: restaurant.tables.length,
        reviews: restaurant.reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          user_name: r.user?.fullName || 'Usuario',
          date: r.createdAt.toISOString().split('T')[0]
        })),
        featured_menu: restaurant.menuItems?.map(m => ({
          id: m.id,
          name: m.name,
          price: m.price,
          category: m.category,
          image: m.image
        })) || []
      };
    });

    return NextResponse.json({
      restaurants: formattedRestaurants,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}