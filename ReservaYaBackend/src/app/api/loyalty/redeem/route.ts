import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

// POST /api/loyalty/redeem - Redeem a reward (host/employee validates)
export async function POST(req: NextRequest) {
    try {
        const decoded = getTokenPayload(req);

        // Require employee role with restaurantId
        if (!decoded?.restaurantId) {
            return NextResponse.json({ error: 'Unauthorized - restaurant staff only' }, { status: 401, headers: corsHeaders });
        }

        const body = await req.json();
        const { userId, cardId } = body;

        if (!userId && !cardId) {
            return NextResponse.json({ error: 'User ID or Card ID required' }, { status: 400, headers: corsHeaders });
        }

        // Get loyalty program for this restaurant
        const program = await db.loyaltyProgram.findUnique({
            where: { restaurantId: decoded.restaurantId }
        });

        if (!program || !program.isActive) {
            return NextResponse.json({ error: 'No active loyalty program' }, { status: 400, headers: corsHeaders });
        }

        // Find the card
        const card = cardId
            ? await db.loyaltyCard.findUnique({ where: { id: cardId } })
            : await db.loyaltyCard.findUnique({
                where: {
                    userId_loyaltyProgramId: {
                        userId,
                        loyaltyProgramId: program.id
                    }
                }
            });

        if (!card) {
            return NextResponse.json({ error: 'Loyalty card not found' }, { status: 404, headers: corsHeaders });
        }

        // Check if reward is available
        if (card.currentVisits < program.visitsRequired) {
            return NextResponse.json({
                error: `Not enough visits. ${card.currentVisits}/${program.visitsRequired}`
            }, { status: 400, headers: corsHeaders });
        }

        // Redeem the reward: reset current visits, increment rewards redeemed
        const updatedCard = await db.loyaltyCard.update({
            where: { id: card.id },
            data: {
                currentVisits: card.currentVisits - program.visitsRequired,
                rewardsRedeemed: card.rewardsRedeemed + 1
            }
        });

        return NextResponse.json({
            message: '¡Recompensa canjeada!',
            reward: {
                title: program.rewardTitle,
                description: program.rewardDescription,
                rewardsRedeemed: updatedCard.rewardsRedeemed,
                remainingVisits: updatedCard.currentVisits
            }
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error redeeming reward:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}
