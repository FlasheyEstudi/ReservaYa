/**
 * Simple in-memory rate limiter for API endpoints
 * For production, consider using Redis-based rate limiting
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// Store rate limit entries by IP address
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
    windowMs?: number;  // Time window in milliseconds (default: 60000 = 1 minute)
    maxRequests?: number;  // Max requests per window (default: 10)
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Check if a request is within rate limits
 * @param identifier - Unique identifier (usually IP or user ID)
 * @param options - Rate limit configuration
 * @returns RateLimitResult with allowed status and remaining requests
 */
export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions = {}
): RateLimitResult {
    const windowMs = options.windowMs ?? 60000; // 1 minute default
    const maxRequests = options.maxRequests ?? 10;
    const now = Date.now();

    const entry = rateLimitStore.get(identifier);

    // If no entry or window has expired, start fresh
    if (!entry || now > entry.resetTime) {
        const resetTime = now + windowMs;
        rateLimitStore.set(identifier, { count: 1, resetTime });
        return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    // If within window, check count
    if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    // Increment count
    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

/**
 * Get client IP from request headers (handles proxies)
 */
export function getClientIp(request: Request): string {
    // Check various headers for proxied requests
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback - in Next.js this might not work, but provides a default
    return 'unknown';
}

/**
 * Create a rate limit key combining IP and endpoint
 */
export function createRateLimitKey(ip: string, endpoint: string): string {
    return `${ip}:${endpoint}`;
}

// Preset configurations for different endpoints
export const RATE_LIMIT_PRESETS = {
    // Strict: for login/auth endpoints
    auth: { windowMs: 60000, maxRequests: 5 },  // 5 per minute

    // Moderate: for write operations
    write: { windowMs: 60000, maxRequests: 30 }, // 30 per minute

    // Lenient: for read operations
    read: { windowMs: 60000, maxRequests: 100 }, // 100 per minute
} as const;
