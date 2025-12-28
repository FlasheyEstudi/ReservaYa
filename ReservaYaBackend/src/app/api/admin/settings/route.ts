import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Default settings values
const DEFAULT_SETTINGS: Record<string, string> = {
    platformName: 'ReservaYa',
    supportEmail: 'soporte@reservaya.com',
    logoUrl: '',
    maxReservationDays: '30',
    sessionTimeoutHours: '24',
    maintenanceMode: 'false',
    allowNewRegistrations: 'true',
    emailAlertsEnabled: 'true',
    slackWebhookUrl: ''
};

interface AdminPayload {
    uid: string;
    role: string;
    email: string;
}

// Helper to verify admin token
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

// GET /api/admin/settings - Get all platform settings
export async function GET(request: NextRequest) {
    const admin = verifyAdminToken(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    try {
        // Fetch all settings from database
        const dbSettings = await db.platformSettings.findMany();

        // Merge with defaults (DB values override defaults)
        const settings: Record<string, any> = { ...DEFAULT_SETTINGS };

        for (const setting of dbSettings) {
            // Parse boolean and number values
            if (setting.value === 'true') {
                settings[setting.key] = true;
            } else if (setting.value === 'false') {
                settings[setting.key] = false;
            } else if (!isNaN(Number(setting.value)) && setting.value !== '') {
                settings[setting.key] = setting.value; // Keep as string for frontend
            } else {
                settings[setting.key] = setting.value;
            }
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching admin settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/settings - Update platform settings
export async function PATCH(request: NextRequest) {
    const admin = verifyAdminToken(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Upsert each setting
        const updates: Promise<any>[] = [];

        for (const [key, value] of Object.entries(body)) {
            // Only update known settings
            if (key in DEFAULT_SETTINGS || key === 'platformName' || key === 'supportEmail') {
                const stringValue = typeof value === 'boolean' ? String(value) : String(value);

                updates.push(
                    db.platformSettings.upsert({
                        where: { key },
                        update: {
                            value: stringValue,
                            updatedBy: admin.uid
                        },
                        create: {
                            key,
                            value: stringValue,
                            updatedBy: admin.uid
                        }
                    })
                );
            }
        }

        await Promise.all(updates);

        // Log the change
        console.log(`Admin ${admin.email} updated settings:`, Object.keys(body));

        return NextResponse.json({
            message: 'Settings updated successfully',
            updatedKeys: Object.keys(body)
        });
    } catch (error) {
        console.error('Error updating admin settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
