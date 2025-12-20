import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';
import { checkFeature, featureBlockedResponse } from '@/lib/featureGate';

export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['manager', 'admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const restaurantId = authResult.rid;

        // Check if marketing feature is enabled for this plan
        const featureCheck = await checkFeature(restaurantId, 'marketing');
        if (!featureCheck.allowed) {
            return NextResponse.json(
                featureBlockedResponse('Marketing', featureCheck.requiredPlan || 'Profesional'),
                { status: 403 }
            );
        }

        const campaigns = await db.marketingCampaign.findMany({
            where: { restaurantId },
            orderBy: { createdAt: 'desc' }
        });

        // Map to frontend expected format
        const mappedCampaigns = campaigns.map(c => ({
            id: c.id,
            name: c.title,
            description: c.body,
            type: 'promotion',
            isActive: !c.sentAt, // Not sent = still active
            startDate: c.createdAt,
            endDate: c.sentAt,
            targetSegment: c.targetSegment
        }));

        return NextResponse.json({ campaigns: mappedCampaigns });
    } catch (error) {
        console.error('Error fetching marketing campaigns:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['manager', 'admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const restaurantId = authResult.rid;
        const body = await request.json();
        const { name, description, targetSegment } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const campaign = await db.marketingCampaign.create({
            data: {
                restaurantId,
                title: name,
                body: description || '',
                targetSegment: targetSegment || null
            }
        });

        return NextResponse.json({
            campaign: {
                id: campaign.id,
                name: campaign.title,
                description: campaign.body,
                type: 'promotion',
                isActive: true
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) return authResult;

        const roleCheck = requireRole(['manager', 'admin'])(authResult, null as any);
        if (roleCheck) return roleCheck;

        const restaurantId = authResult.rid;
        const body = await request.json();
        const { id, name, description, sendNow } = body;

        if (!id) {
            return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
        }

        // Verify ownership
        const existing = await db.marketingCampaign.findFirst({
            where: { id, restaurantId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (name) updateData.title = name;
        if (description) updateData.body = description;
        if (sendNow) updateData.sentAt = new Date();

        const campaign = await db.marketingCampaign.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            campaign: {
                id: campaign.id,
                name: campaign.title,
                description: campaign.body,
                isActive: !campaign.sentAt
            }
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
