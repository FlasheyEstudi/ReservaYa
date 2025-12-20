import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET environment variable is not set');
    }
    return secret;
}
const JWT_SECRET = getJwtSecret();

async function getRestaurantFromToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { rid?: string; restaurantId?: string };
        return decoded.rid || decoded.restaurantId || null;
    } catch {
        return null;
    }
}

// GET /api/restaurant/settings - Get restaurant configuration
export async function GET(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const restaurant = await db.restaurant.findUnique({
            where: { id: restaurantId },
            select: {
                id: true,
                name: true,
                businessCode: true,
                taxId: true,
                address: true,
                status: true,
                config: true,
                createdAt: true,
                updatedAt: true,
                subscription: {
                    select: {
                        status: true,
                        plan: {
                            select: {
                                name: true,
                                displayName: true,
                                features: true
                            }
                        }
                    }
                }
            }
        });

        if (!restaurant) {
            return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
        }

        // Parse config JSON
        let config = {};
        try {
            config = JSON.parse(restaurant.config || '{}');
        } catch {
            config = {};
        }

        // Parse plan features
        let planFeatures = {};
        try {
            if (restaurant.subscription?.plan?.features) {
                planFeatures = JSON.parse(restaurant.subscription.plan.features);
            }
        } catch {
            planFeatures = {};
        }

        return NextResponse.json({
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                businessCode: restaurant.businessCode,
                taxId: restaurant.taxId,
                address: restaurant.address,
                status: restaurant.status,
                createdAt: restaurant.createdAt.toISOString()
            },
            settings: config,
            subscription: {
                status: restaurant.subscription?.status || 'free',
                planName: restaurant.subscription?.plan?.name || 'free',
                features: planFeatures
            }
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/restaurant/settings - Update restaurant configuration
export async function PATCH(req: NextRequest) {
    try {
        const restaurantId = await getRestaurantFromToken(req);
        if (!restaurantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, taxId, address, settings } = body;

        // Extract lat/lng from settings to save as columns
        const latitude = settings?.latitude !== undefined ? settings.latitude : undefined;
        const longitude = settings?.longitude !== undefined ? settings.longitude : undefined;

        // Get current config
        const current = await db.restaurant.findUnique({
            where: { id: restaurantId },
            select: { config: true }
        });

        let currentConfig = {};
        try {
            currentConfig = JSON.parse(current?.config || '{}');
        } catch {
            currentConfig = {};
        }

        // Merge settings (remove lat/lng from config since they're now columns)
        const { latitude: _, longitude: __, ...settingsWithoutCoords } = settings || {};
        const newConfig = settings ? { ...currentConfig, ...settingsWithoutCoords } : currentConfig;

        const restaurant = await db.restaurant.update({
            where: { id: restaurantId },
            data: {
                ...(name !== undefined && { name }),
                ...(taxId !== undefined && { taxId }),
                ...(address !== undefined && { address }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                config: JSON.stringify(newConfig)
            },
            select: {
                id: true,
                name: true,
                businessCode: true,
                taxId: true,
                address: true,
                latitude: true,
                longitude: true,
                config: true
            }
        });

        return NextResponse.json({
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                businessCode: restaurant.businessCode,
                taxId: restaurant.taxId,
                address: restaurant.address
            },
            settings: JSON.parse(restaurant.config || '{}'),
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
