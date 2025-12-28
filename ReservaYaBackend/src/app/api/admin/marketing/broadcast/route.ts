import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';
import { MarketingCampaignSchema } from '@/lib/validation';
import { WebSocketService } from '@/lib/websocket';

// POST /api/admin/marketing/broadcast - Send marketing campaign
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult;

    // Check if user has admin or manager role
    const roleCheck = requireRole(['admin', 'manager'])(user, null as any);
    if (roleCheck) {
      return roleCheck;
    }

    const body = await request.json();
    const { restaurant_id, title, body: campaignBody, target_segment } = MarketingCampaignSchema.parse(body);

    // If user is manager, they can only send campaigns for their restaurant
    let targetRestaurantId = restaurant_id;
    if (user.role === 'manager') {
      targetRestaurantId = user.rid;
      if (restaurant_id && restaurant_id !== user.rid) {
        return NextResponse.json(
          { error: 'Managers can only send campaigns for their own restaurant' },
          { status: 403 }
        );
      }
    }

    // Create the campaign record
    const campaign = await db.marketingCampaign.create({
      data: {
        restaurantId: targetRestaurantId,
        title,
        body: campaignBody,
        targetSegment: target_segment,
        sentAt: new Date()
      }
    });

    // WebSocket notification
    await WebSocketService.emitMarketingBroadcast(
      campaign.id,
      title,
      campaignBody,
      target_segment,
      targetRestaurantId
    );

    // TODO: Implement actual notification sending
    // This would typically involve:
    // 1. Get target users based on segment
    // 2. Send push notifications via FCM (for mobile apps)
    // 3. Send email notifications
    // 4. Emit WebSocket events to connected clients

    // Get target users for the campaign
    let targetUsers: { id?: string; userId?: string; email?: string | null }[] = [];

    if (targetRestaurantId) {
      // Restaurant-specific campaign
      const rawTargetUsers = await db.reservation.findMany({
        where: {
          restaurantId: targetRestaurantId,
          userId: { not: null }
        },
        distinct: ['userId'],
        select: {
          userId: true,
          user: { select: { email: true } }
        }
      });
      targetUsers = rawTargetUsers.map(r => ({
        userId: r.userId ?? undefined,
        email: r.user?.email
      }));
    } else {
      // Global campaign (admin only)
      const rawTargetUsers = await db.user.findMany({
        select: {
          id: true,
          email: true
        }
      });
      targetUsers = rawTargetUsers.map(u => ({ userId: u.id, email: u.email }));
    }

    // TODO: FCM Push Notifications (if mobile app exists)
    // const fcmTokens = await getFCMTokensForUsers(targetUsers.map(u => u.id));
    // await sendFCMNotification(fcmTokens, {
    //   title,
    //   body: campaignBody,
    //   data: { campaign_id: campaign.id }
    // });

    // Send emails to target users
    const { sendEmail } = await import('@/lib/email');

    // Process in batches to avoid overwhelming the mock logger or service
    const BATCH_SIZE = 50;
    for (let i = 0; i < targetUsers.length; i += BATCH_SIZE) {
      const batch = targetUsers.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (u) => {
        if (u.email) {
          await sendEmail({
            to: u.email,
            subject: title,
            text: campaignBody
          });
        }
      }));
    }


    return NextResponse.json({
      message: 'Marketing campaign sent successfully',
      campaign: {
        id: campaign.id,
        restaurant_id: campaign.restaurantId,
        title: campaign.title,
        body: campaign.body,
        target_segment: campaign.targetSegment,
        sent_at: campaign.sentAt,
        created_at: campaign.createdAt
      },
      stats: {
        target_users_count: targetUsers.length,
        // These would be actual counts after implementation
        push_notifications_sent: 0,
        emails_sent: 0,
        websocket_notifications_sent: 0
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Marketing broadcast error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/marketing/broadcast - Get marketing campaigns
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult;

    // Check if user has admin or manager role
    const roleCheck = requireRole(['admin', 'manager'])(user, null as any);
    if (roleCheck) {
      return roleCheck;
    }

    let whereClause: any = {};

    // If user is manager, only show campaigns for their restaurant
    if (user.role === 'manager') {
      whereClause.restaurantId = user.rid;
    }

    const campaigns = await db.marketingCampaign.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: {
            name: true,
            businessCode: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      campaigns: campaigns.map(campaign => ({
        id: campaign.id,
        restaurant_id: campaign.restaurantId,
        restaurant_name: campaign.restaurant?.name,
        restaurant_code: campaign.restaurant?.businessCode,
        title: campaign.title,
        body: campaign.body,
        target_segment: campaign.targetSegment,
        sent_at: campaign.sentAt,
        created_at: campaign.createdAt
      }))
    });

  } catch (error) {
    console.error('Marketing campaigns fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}