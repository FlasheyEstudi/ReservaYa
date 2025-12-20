import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Haversine formula constants
const EARTH_RADIUS_KM = 6371;
const DEFAULT_RADIUS_KM = 20;

interface NearbyRestaurant {
    id: string;
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    distance: number;
    image: string | null;
    category: string | null;
    description: string | null;
    phone: string | null;
}

// GET /api/restaurants/nearby - Get restaurants near user location
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const latStr = searchParams.get('lat');
        const lngStr = searchParams.get('lng');
        const radiusStr = searchParams.get('radius');

        // Validate coordinates
        if (!latStr || !lngStr) {
            return NextResponse.json(
                { error: 'lat and lng query parameters are required' },
                { status: 400 }
            );
        }

        const userLat = parseFloat(latStr);
        const userLng = parseFloat(lngStr);
        const radiusKm = radiusStr ? parseFloat(radiusStr) : DEFAULT_RADIUS_KM;

        // Validate numeric values
        if (isNaN(userLat) || isNaN(userLng) || isNaN(radiusKm)) {
            return NextResponse.json(
                { error: 'lat, lng, and radius must be valid numbers' },
                { status: 400 }
            );
        }

        // Validate coordinate ranges
        if (userLat < -90 || userLat > 90) {
            return NextResponse.json(
                { error: 'lat must be between -90 and 90' },
                { status: 400 }
            );
        }

        if (userLng < -180 || userLng > 180) {
            return NextResponse.json(
                { error: 'lng must be between -180 and 180' },
                { status: 400 }
            );
        }

        /**
         * Haversine Formula in SQL (PostgreSQL)
         * 
         * distance = 2 * R * asin(sqrt(
         *   sin²((lat2 - lat1) / 2) + 
         *   cos(lat1) * cos(lat2) * sin²((lng2 - lng1) / 2)
         * ))
         * 
         * Where R = 6371 km (Earth's radius)
         */
        const restaurants = await db.$queryRaw<NearbyRestaurant[]>`
            SELECT 
                id,
                name,
                address,
                CAST(latitude AS FLOAT) as latitude,
                CAST(longitude AS FLOAT) as longitude,
                image,
                category,
                description,
                phone,
                (
                    ${EARTH_RADIUS_KM} * 2 * ASIN(
                        SQRT(
                            POWER(SIN(RADIANS(CAST(latitude AS FLOAT) - ${userLat}) / 2), 2) +
                            COS(RADIANS(${userLat})) * 
                            COS(RADIANS(CAST(latitude AS FLOAT))) * 
                            POWER(SIN(RADIANS(CAST(longitude AS FLOAT) - ${userLng}) / 2), 2)
                        )
                    )
                ) AS distance
            FROM restaurants
            WHERE 
                latitude IS NOT NULL 
                AND longitude IS NOT NULL
                AND status = 'active'
                AND (
                    ${EARTH_RADIUS_KM} * 2 * ASIN(
                        SQRT(
                            POWER(SIN(RADIANS(CAST(latitude AS FLOAT) - ${userLat}) / 2), 2) +
                            COS(RADIANS(${userLat})) * 
                            COS(RADIANS(CAST(latitude AS FLOAT))) * 
                            POWER(SIN(RADIANS(CAST(longitude AS FLOAT) - ${userLng}) / 2), 2)
                        )
                    )
                ) <= ${radiusKm}
            ORDER BY distance ASC
            LIMIT 50
        `;

        return NextResponse.json({
            restaurants: restaurants.map(r => ({
                ...r,
                distance: Math.round(r.distance * 100) / 100 // Round to 2 decimals
            })),
            meta: {
                userLocation: { lat: userLat, lng: userLng },
                radiusKm,
                count: restaurants.length
            }
        });

    } catch (error) {
        console.error('Nearby restaurants error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle OPTIONS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
