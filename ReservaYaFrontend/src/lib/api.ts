'use client';

/**
 * Returns the API base URL.
 * - Always prioritizes NEXT_PUBLIC_API_URL if set (for production)
 * - Falls back to localhost for local development
 */
export function getApiUrl(): string {
    // Always check env var first - this is set at build time
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // Fallback for local development only
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        // For local network testing (e.g., 192.168.x.x)
        if (hostname.match(/^192\.168\.\d+\.\d+$/)) {
            return `http://${hostname}:3000/api`;
        }
    }

    // Final fallback
    return 'http://localhost:3000/api';
}

/**
 * Returns the Socket URL.
 * - Always prioritizes NEXT_PUBLIC_SOCKET_URL if set (for production)
 * - Falls back to localhost for local development
 */
export function getSocketUrl(): string {
    // Always check env var first
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
        return process.env.NEXT_PUBLIC_SOCKET_URL;
    }

    // Fallback for local development only
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3002';
        }
        if (hostname.match(/^192\.168\.\d+\.\d+$/)) {
            return `http://${hostname}:3002`;
        }
    }

    return 'http://localhost:3002';
}

