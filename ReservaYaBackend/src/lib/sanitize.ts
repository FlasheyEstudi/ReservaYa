/**
 * Input sanitization utilities
 * Provides basic protection against XSS and injection attacks
 */

/**
 * Strips HTML tags from a string, keeping only plain text
 * @param input - The string to sanitize
 * @returns Plain text without HTML tags
 */
export function stripHtml(input: string | null | undefined): string {
    if (!input) return '';

    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Decode common HTML entities
    sanitized = sanitized
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');

    // Remove any remaining encoded entities
    sanitized = sanitized.replace(/&#\d+;/g, '');
    sanitized = sanitized.replace(/&\w+;/g, '');

    return sanitized.trim();
}

/**
 * Escapes HTML special characters for safe display
 * Use this when you need to display user input in HTML
 */
export function escapeHtml(input: string | null | undefined): string {
    if (!input) return '';

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Sanitizes user-generated content for storage
 * - Removes HTML/script tags
 * - Removes dangerous patterns (javascript:, data:, etc.)
 * - Removes event handlers
 * - Normalizes whitespace
 * - Limits length
 */
export function sanitizeUserContent(
    input: string | null | undefined,
    maxLength: number = 5000
): string {
    if (!input) return '';

    let sanitized = stripHtml(input);

    // Remove javascript: and data: URIs (common XSS vectors)
    sanitized = sanitized.replace(/javascript\s*:/gi, '');
    sanitized = sanitized.replace(/data\s*:/gi, '');
    sanitized = sanitized.replace(/vbscript\s*:/gi, '');

    // Remove event handler patterns (onclick, onerror, etc.)
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // Remove expression() which was used in old IE XSS
    sanitized = sanitized.replace(/expression\s*\(/gi, '');

    // Remove null bytes and control characters (except newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize multiple spaces/newlines
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Trim and limit length
    sanitized = sanitized.trim();
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Validates and sanitizes an email address
 */
export function sanitizeEmail(input: string | null | undefined): string | null {
    if (!input) return null;

    const trimmed = input.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmed)) {
        return null;
    }

    return trimmed;
}
