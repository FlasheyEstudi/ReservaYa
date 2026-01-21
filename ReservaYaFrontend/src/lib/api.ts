'use client';

/**
 * Returns the API base URL dynamically based on the browser's hostname.
 * - If accessed via localhost, uses localhost:3000
 * - If accessed via IP (e.g., 192.168.x.x), uses that same IP:3000
 */
export function getApiUrl(): string {
    if (typeof window === 'undefined') {
        // Server-side: use env variable or fallback
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    }

    const hostname = window.location.hostname;

    // If localhost, use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }

    // Otherwise, use the same hostname (IP) with backend port
    return `http://${hostname}:3000/api`;
}

/**
 * Returns the Socket URL dynamically based on the browser's hostname.
 */
export function getSocketUrl(): string {
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';
    }

    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3002';
    }

    return `http://${hostname}:3002`;
}
