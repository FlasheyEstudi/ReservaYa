import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SearchRestaurantsSchema } from '@/lib/validation';

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
    const queryParams = {
      city: searchParams.get('city'),
      date: searchParams.get('date'),
      party: searchParams.get('party') ? parseInt(searchParams.get('party')!) : undefined
    };

    const { city, date, party } = SearchRestaurantsSchema.parse(queryParams);

    // Build base where clause
    const whereClause: any = {
      status: 'active' // Only show active restaurants
    };

    // Add city filter if provided
    if (city) {
      // Note: In a real implementation, you'd have a city field in the restaurant table
      // For now, we'll search by name (this is a simplified implementation)
      whereClause.name = {
        contains: city,
        mode: 'insensitive'
      };
    }

    // Get all active restaurants with reviews and menu items
    const restaurants = await db.restaurant.findMany({
      where: whereClause,
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
      }
    });


    // Get likes count separately
    const likeCounts = await db.like.groupBy({
      by: ['restaurantId'],
      _count: { id: true }
    });
    const likeCountMap = new Map(likeCounts.map(l => [l.restaurantId, l._count.id]));

    // Process restaurants with extended info
    let availableRestaurants: RestaurantWithExtras[] = [];

    if (date && party) {
      const searchDateTime = new Date(date);
      const timeWindowStart = new Date(searchDateTime.getTime() - (1.5 * 60 * 60 * 1000)); // 1.5 hours before
      const timeWindowEnd = new Date(searchDateTime.getTime() + (1.5 * 60 * 60 * 1000)); // 1.5 hours after

      // OPTIMIZATION: Batch query for all reservations at once (Fix N+1)
      const restaurantIds = restaurants.map(r => r.id);
      const allReservations = await db.reservation.findMany({
        where: {
          restaurantId: { in: restaurantIds },
          reservationTime: {
            gte: timeWindowStart,
            lte: timeWindowEnd
          },
          status: { in: ['confirmed', 'seated'] }
        }
      });

      // OPTIMIZATION: Batch query for ratings using aggregate
      const ratingStats = await db.review.groupBy({
        by: ['restaurantId'],
        where: { restaurantId: { in: restaurantIds } },
        _avg: { rating: true },
        _count: { rating: true }
      });
      const ratingMap = new Map(ratingStats.map(r => [r.restaurantId, { avg: r._avg.rating || 0, count: r._count.rating }]));

      // Create reservation lookup map
      const reservationsByRestaurant = new Map<string, typeof allReservations>();
      allReservations.forEach(r => {
        if (!reservationsByRestaurant.has(r.restaurantId)) {
          reservationsByRestaurant.set(r.restaurantId, []);
        }
        reservationsByRestaurant.get(r.restaurantId)!.push(r);
      });

      for (const restaurant of restaurants) {
        // Calculate total restaurant capacity
        const totalCapacity = restaurant.tables.reduce((sum, table) => sum + table.capacity, 0);

        // Use pre-fetched reservations (O(1) lookup instead of query)
        const existingReservations = reservationsByRestaurant.get(restaurant.id) || [];

        // Calculate occupied seats
        const occupiedSeats = existingReservations.reduce((sum, reservation) => sum + reservation.partySize, 0);

        // Check if restaurant has availability
        const availableCapacity = totalCapacity - occupiedSeats;

        if (availableCapacity >= party) {
          // Use pre-fetched ratings (O(1) lookup instead of query)
          const ratingInfo = ratingMap.get(restaurant.id) || { avg: 0, count: 0 };

          availableRestaurants.push({
            id: restaurant.id,
            name: restaurant.name,
            businessCode: restaurant.businessCode,
            address: restaurant.address,
            status: restaurant.status,
            tables: restaurant.tables,
            _count: { reviews: restaurant._count.reviews, likes: likeCountMap.get(restaurant.id) || 0 },
            available_capacity: availableCapacity,
            total_capacity: totalCapacity,
            average_rating: ratingInfo.avg,
            review_count: ratingInfo.count
          });
        }
      }
    } else {
      // OPTIMIZATION: Batch query for ratings when no date/party filter
      const restaurantIds = restaurants.map(r => r.id);
      const ratingStats = await db.review.groupBy({
        by: ['restaurantId'],
        where: { restaurantId: { in: restaurantIds } },
        _avg: { rating: true },
        _count: { rating: true }
      });
      const ratingMap = new Map(ratingStats.map(r => [r.restaurantId, { avg: r._avg.rating || 0, count: r._count.rating }]));

      // Process all restaurants without N+1 queries
      availableRestaurants = restaurants.map((restaurant) => {
        const ratingInfo = ratingMap.get(restaurant.id) || { avg: 0, count: 0 };
        const totalCapacity = restaurant.tables.reduce((sum, table) => sum + table.capacity, 0);

        return {
          id: restaurant.id,
          name: restaurant.name,
          businessCode: restaurant.businessCode,
          address: restaurant.address,
          status: restaurant.status,
          tables: restaurant.tables,
          _count: { reviews: restaurant._count.reviews, likes: likeCountMap.get(restaurant.id) || 0 },
          available_capacity: totalCapacity,
          total_capacity: totalCapacity,
          average_rating: ratingInfo.avg,
          review_count: ratingInfo.count
        };
      });
    }

    return NextResponse.json({
      restaurants: restaurants.map(restaurant => {
        const totalCapacity = restaurant.tables.reduce((sum, table) => sum + table.capacity, 0);
        const avgRating = restaurant.reviews.length > 0
          ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length
          : 0;

        return {
          id: restaurant.id,
          name: restaurant.name,
          business_code: restaurant.businessCode,
          category: (restaurant as any).category || 'General',
          description: (restaurant as any).description || '',
          address: restaurant.address,
          latitude: (restaurant as any).latitude ? Number((restaurant as any).latitude) : null,
          longitude: (restaurant as any).longitude ? Number((restaurant as any).longitude) : null,
          image: (restaurant as any).image || null,
          status: restaurant.status,
          available_capacity: totalCapacity,
          total_capacity: totalCapacity,
          average_rating: avgRating,
          review_count: restaurant._count.reviews,
          likes_count: likeCountMap.get(restaurant.id) || 0,
          table_count: restaurant.tables.length,
          // Recent reviews for preview
          reviews: restaurant.reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            user_name: (r.user as any)?.fullName || 'Usuario',
            date: r.createdAt.toISOString().split('T')[0]
          })),
          // Featured menu items
          featured_menu: (restaurant as any).menuItems?.map((m: any) => ({
            id: m.id,
            name: m.name,
            price: m.price,
            category: m.category,
            image: m.image
          })) || []
        };
      }),

      filters: {
        city,
        date,
        party_size: party
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