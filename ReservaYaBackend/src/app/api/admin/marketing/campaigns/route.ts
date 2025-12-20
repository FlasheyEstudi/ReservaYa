import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/marketing/campaigns - Get all marketing campaigns
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const user = authResult;

        const roleCheck = requireRole(['admin'])(user, null as any);
        if (roleCheck) {
            return roleCheck;
        }

        const campaigns = await db.marketingCampaign.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            campaigns: campaigns.map(c => ({
                id: c.id,
                title: c.title,
                message: c.body, // Map 'body' to 'message' for frontend
                segment: c.targetSegment || 'all',
                status: c.sentAt ? 'sent' : 'pending', // Derive status from sentAt
                sentAt: c.sentAt,
                createdAt: c.createdAt
            }))
        });
    } catch (error) {
        console.error('Fetch campaigns error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/admin/marketing/campaigns - Create new campaign
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateToken(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const user = authResult;

        const roleCheck = requireRole(['admin'])(user, null as any);
        if (roleCheck) {
            return roleCheck;
        }

        const body = await request.json();
        const { title, message, segment } = body;

        if (!title || !message) {
            return NextResponse.json(
                { error: 'Title and message are required' },
                { status: 400 }
            );
        }

        // Create campaign - here we'd also integrate with WebSocket to push notifications
        const campaign = await db.marketingCampaign.create({
            data: {
                title,
                body: message, // Map 'message' from frontend to 'body' in DB
                targetSegment: segment || 'all',
                sentAt: new Date()
            }
        });

        return NextResponse.json({
            message: 'Campaign created and sent successfully',
            campaign: {
                id: campaign.id,
                title: campaign.title,
                status: campaign.sentAt ? 'sent' : 'pending'
            }
        });
    } catch (error) {
        console.error('Create campaign error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
