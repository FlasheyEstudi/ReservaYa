import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define allowed origins
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_APP_URL, // Production URL
].filter(Boolean) as string[];

// Public routes that don't require authentication
const PUBLIC_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/webhooks', // Payment webhooks usually need their own signature verification
    '/api/public',
    '/api/restaurants', // Public listing (unless it needs to be protected?)
    '/api/search'       // Searching is public
];

// Helper to check if path matches public patterns
function isPublicPath(path: string) {
    if (PUBLIC_PATHS.some(p => path === p)) return true;
    if (path.startsWith('/api/webhooks/')) return true; // Allow all webhook subpaths

    // Allow specific public GET patterns if needed
    // e.g., viewing a restaurant menu might be public
    if (path.startsWith('/api/restaurants/') && !path.includes('/orders')) {
        // Allow GET requests to restaurant details, but protect orders/management
        // This is a simplification; precise rules might be needed
        // For now, let's keep it simple: strict auth for everything else
        // or specific public endpoints.
    }

    return false;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Handle CORS
    const origin = request.headers.get('origin');
    const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
    const corsHeaders = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
    } as Record<string, string>;

    if (isAllowedOrigin) {
        corsHeaders['Access-Control-Allow-Origin'] = origin;
        corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    } else {
        // Default to first allowed or restrict? 
        // For strict security, if origin is not allowed, we don't return Allow-Origin.
        // However, for development convenience with tools (Postman), we might allow * if specifically configured.
        // But per audit, we want strictness.
    }

    // Handle preflight
    if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 });
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    // 2. Auth Verification (Only for /api/* routes)
    if (pathname.startsWith('/api/')) {
        // Skip auth for public paths
        if (isPublicPath(pathname)) {
            const response = NextResponse.next();
            // Apply CORS to public routes too
            if (isAllowedOrigin) {
                Object.entries(corsHeaders).forEach(([key, value]) => {
                    response.headers.set(key, value);
                });
            }
            return response;
        }

        // Also allow GET /api/restaurants/* for public viewing if intended
        // Custom logic: specific GETs are public? 
        // Let's assume restaurant details are public:
        const isRestaurantGet = pathname.match(/^\/api\/restaurants\/[^/]+$/) && request.method === 'GET';
        if (isRestaurantGet) {
            const response = NextResponse.next();
            if (isAllowedOrigin) Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
            return response;
        }

        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized: Missing or invalid token' },
                { status: 401, headers: isAllowedOrigin ? corsHeaders : undefined }
            );
        }

        const token = authHeader.split(' ')[1];
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);

        try {
            const { payload } = await jwtVerify(token, secret);

            // Pass user info to downstream via headers
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('X-User-Id', payload.uid as string);
            requestHeaders.set('X-User-Role', payload.role as string);

            const response = NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });

            if (isAllowedOrigin) {
                Object.entries(corsHeaders).forEach(([key, value]) => {
                    response.headers.set(key, value);
                });
            }

            return response;

        } catch (error) {
            console.error('Middleware Auth Error:', error);
            return NextResponse.json(
                { error: 'Unauthorized: Invalid token' },
                { status: 401, headers: isAllowedOrigin ? corsHeaders : undefined }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
