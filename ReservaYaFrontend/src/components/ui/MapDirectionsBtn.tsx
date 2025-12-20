"use client";

import { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Compass, ExternalLink, Map as MapIcon } from 'lucide-react';

interface MapDirectionsBtnProps {
    latitude: number;
    longitude: number;
    restaurantName: string;
    variant?: 'primary' | 'outline' | 'ghost';
}

export default function MapDirectionsBtn({
    latitude,
    longitude,
    restaurantName,
    variant = 'primary'
}: MapDirectionsBtnProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // URL Schemes Inteligentes (Deep Linking)
    const links = [
        {
            name: 'Google Maps',
            url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
            icon: <MapPin className="w-4 h-4 text-red-500" />,
            color: "hover:bg-red-50"
        },
        {
            name: 'Waze',
            url: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
            icon: <Navigation className="w-4 h-4 text-blue-500" />,
            color: "hover:bg-blue-50"
        },
        {
            name: 'Apple Maps',
            url: `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
            icon: <Compass className="w-4 h-4 text-gray-500" />,
            color: "hover:bg-gray-50"
        }
    ];

    // Estilos base según variante
    const baseStyles = "flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm";
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
        outline: "border border-gray-300 hover:bg-gray-50 text-gray-700",
        ghost: "hover:bg-gray-100 text-gray-600"
    };

    // Si no hay coordenadas válidas, no mostrar el botón
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        return null;
    }

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            {/* Botón Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${baseStyles} ${variants[variant]}`}
                aria-label="Cómo llegar"
            >
                <MapIcon size={16} />
                <span>Cómo llegar</span>
            </button>

            {/* Menú Desplegable (Dropdown) */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-1">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                            Abrir con...
                        </div>
                        {links.map((link) => (
                            <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setIsOpen(false)}
                                className={`group flex items-center gap-3 px-4 py-3 text-sm text-gray-700 ${link.color} transition-colors`}
                            >
                                {link.icon}
                                <span className="flex-1">{link.name}</span>
                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-50" />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
