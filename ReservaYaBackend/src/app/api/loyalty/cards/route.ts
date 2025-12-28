import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

function getTokenPayload(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET) as any;
    } catch {
        return null;
    }
}

// GET /api/loyalty/cards - Get user's loyalty cards across all restaurants
export async function GET(req: NextRequest) {
    try {
        const decoded = getTokenPayload(req);
        const userId = decoded?.uid || decoded?.userId || decoded?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const cards = await db.loyaltyCard.findMany({
            where: { userId },
            include: {
                loyaltyProgram: {
                    include: {
                        restaurant: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                category: true
                            }
                        }
                    }
                }
            },
            orderBy: { lastVisitAt: 'desc' }
        });

        // Transform for frontend
        const transformedCards = cards.map(card => ({
            id: card.id,
            restaurantId: card.loyaltyProgram.restaurantId,
            restaurantName: card.loyaltyProgram.restaurant.name,
            restaurantImage: card.loyaltyProgram.restaurant.image,
            restaurantCategory: card.loyaltyProgram.restaurant.category,
            currentVisits: card.currentVisits,
            totalVisits: card.totalVisits,
            visitsRequired: card.loyaltyProgram.visitsRequired,
            rewardTitle: card.loyaltyProgram.rewardTitle,
            rewardDescription: card.loyaltyProgram.rewardDescription,
            rewardsRedeemed: card.rewardsRedeemed,
            lastVisitAt: card.lastVisitAt,
            isRewardAvailable: card.currentVisits >= card.loyaltyProgram.visitsRequired
        }));

        return NextResponse.json({ cards: transformedCards }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error fetching loyalty cards:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}

// POST /api/loyalty/cards - Stamp a loyalty card (host/employee stamps when customer visits)
export async function POST(req: NextRequest) {
    try {
        const decoded = getTokenPayload(req);

        // Require employee role with restaurantId
        if (!decoded?.restaurantId) {
            return NextResponse.json({ error: 'Unauthorized - restaurant staff only' }, { status: 401, headers: corsHeaders });
        }

        const body = await req.json();
        const { userId, reservationId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400, headers: corsHeaders });
        }

        // Get or create loyalty program for this restaurant
        let program = await db.loyaltyProgram.findUnique({
            where: { restaurantId: decoded.restaurantId }
        });

        if (!program) {
            // Auto-create default program if doesn't exist
            program = await db.loyaltyProgram.create({
                data: {
                    restaurantId: decoded.restaurantId,
                    visitsRequired: 10,
                    rewardTitle: 'Recompensa especial'
                }
            });
        }

        if (!program.isActive) {
            return NextResponse.json({ error: 'Loyalty program is not active' }, { status: 400, headers: corsHeaders });
        }

        // Get or create card for this user at this restaurant
        let card = await db.loyaltyCard.findUnique({
            where: {
                userId_loyaltyProgramId: {
                    userId,
                    loyaltyProgramId: program.id
                }
            }
        });

        if (!card) {
            card = await db.loyaltyCard.create({
                data: {
                    userId,
                    loyaltyProgramId: program.id,
                    currentVisits: 0,
                    totalVisits: 0
                }
            });
        }

        // Stamp the card (+1 visit)
        const updatedCard = await db.loyaltyCard.update({
            where: { id: card.id },
            data: {
                currentVisits: card.currentVisits + 1,
                totalVisits: card.totalVisits + 1,
                lastVisitAt: new Date()
            }
        });

        const isRewardReady = updatedCard.currentVisits >= program.visitsRequired;

        return NextResponse.json({
            message: 'Visit stamped',
            card: {
                currentVisits: updatedCard.currentVisits,
                visitsRequired: program.visitsRequired,
                totalVisits: updatedCard.totalVisits,
                isRewardReady,
                rewardTitle: program.rewardTitle
            }
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error stamping loyalty card:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}
