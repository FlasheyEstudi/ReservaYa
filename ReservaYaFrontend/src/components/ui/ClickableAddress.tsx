"use client";

import { MapPin } from 'lucide-react';

interface ClickableAddressProps {
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    className?: string;
    showIcon?: boolean;
}

export default function ClickableAddress({
    address,
    latitude,
    longitude,
    className = '',
    showIcon = true
}: ClickableAddressProps) {
    // Build Google Maps URL
    const getMapsUrl = () => {
        if (latitude && longitude) {
            // Use exact coordinates
            return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        }
        // Fallback to address search
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    };

    if (!address) return null;

    return (
        <a
            href={getMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-stone-600 hover:text-blue-600 hover:underline transition-colors cursor-pointer ${className}`}
            onClick={(e) => e.stopPropagation()}
        >
            {showIcon && <MapPin className="h-3.5 w-3.5 flex-shrink-0" />}
            <span className="truncate">{address}</span>
        </a>
    );
}
