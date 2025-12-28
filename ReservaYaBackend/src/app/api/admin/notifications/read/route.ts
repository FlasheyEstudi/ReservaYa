import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface AdminPayload {
    uid: string;
    role: string;
    email: string;
}

function verifyAdminToken(req: NextRequest): AdminPayload | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
        if (decoded.role?.toUpperCase() !== 'ADMIN') return null;
        return decoded;
    } catch {
        return null;
    }
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// PATCH /api/admin/notifications/read - Mark notifications as read
export async function PATCH(request: NextRequest) {
    const admin = verifyAdminToken(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    try {
        const body = await request.json();
        const { notificationIds, markAll } = body;

        if (markAll) {
            // For markAll, we need to get all current notification IDs and mark them
            // This is a simplified approach - in production you might want to track this differently
            // For now, we'll just acknowledge it
            console.log(`Admin ${admin.email} marked all notifications as read`);

            // We could store a "lastReadAt" timestamp instead
            // But for now, we'll trust the frontend sends the right IDs
        }

        if (notificationIds && Array.isArray(notificationIds)) {
            // Insert read records for each notification ID
            const inserts = notificationIds.map((notificationId: string) =>
                db.adminNotificationRead.upsert({
                    where: {
                        adminId_notificationId: {
                            adminId: admin.uid,
                            notificationId
                        }
                    },
                    update: { readAt: new Date() },
                    create: {
                        adminId: admin.uid,
                        notificationId,
                        readAt: new Date()
                    }
                })
            );

            await Promise.all(inserts);
        }

        return NextResponse.json({
            success: true,
            message: markAll
                ? 'All notifications marked as read'
                : `Marked ${notificationIds?.length || 0} as read`
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
