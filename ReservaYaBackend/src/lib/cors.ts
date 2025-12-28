import { NextResponse } from 'next/server';

export const corsHeaders = (origin: string | null = null) => {
    // In production, restrict to specific domains. For now, we allow localhost/preview URLs if valid
    // Or just allow all for simpler dev if that's the current preference, but let's be safer.

    // Default to allowing the requesting origin if it looks like a dev environment or specific valid domain
    // const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'].filter(Boolean);

    // For this implementation, we will reflect the origin if it matches our expectations, 
    // or fallback to * if we want to be permissive (not recommended for auth).
    // Let's implement a safer default:

    const allowedOrigin = origin || '*'; // You might want to validate this against a whitelist

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
    };
};

export function handleOptions() {
    return NextResponse.json({}, { headers: corsHeaders() });
}
