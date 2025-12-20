"use client";

import { useState } from 'react';
import { MapPin, ChevronDown, Search, X, Navigation } from 'lucide-react';
import { NICARAGUAN_CITIES } from '@/hooks/useUserLocation';

interface CitySelectorProps {
    currentCity?: string;
    onSelectCity: (cityId: string) => void;
    onRequestGPS: () => void;
    isLoading?: boolean;
}

export default function CitySelector({
    currentCity,
    onSelectCity,
    onRequestGPS,
    isLoading
}: CitySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCities = NICARAGUAN_CITIES.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedCity = NICARAGUAN_CITIES.find(c => c.id === currentCity);

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-xl hover:border-orange-300 transition-colors text-sm"
            >
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="text-stone-700 font-medium">
                    {isLoading ? 'Localizando...' : selectedCity?.name || 'Seleccionar ciudad'}
                </span>
                <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-100 z-50 overflow-hidden">
                        {/* GPS Option */}
                        <button
                            onClick={() => {
                                onRequestGPS();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors border-b border-stone-100"
                        >
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Navigation className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-stone-800">Usar mi ubicación</p>
                                <p className="text-xs text-stone-500">Activar GPS</p>
                            </div>
                        </button>

                        {/* Search */}
                        <div className="p-3 border-b border-stone-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar ciudad..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-orange-300"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        <X className="h-4 w-4 text-stone-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Cities List */}
                        <div className="max-h-64 overflow-y-auto">
                            {filteredCities.map(city => (
                                <button
                                    key={city.id}
                                    onClick={() => {
                                        onSelectCity(city.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors ${currentCity === city.id ? 'bg-orange-50' : ''
                                        }`}
                                >
                                    <MapPin className={`h-4 w-4 ${currentCity === city.id ? 'text-orange-500' : 'text-stone-400'}`} />
                                    <span className={`text-sm ${currentCity === city.id ? 'text-orange-600 font-medium' : 'text-stone-700'}`}>
                                        {city.name}
                                    </span>
                                    {currentCity === city.id && (
                                        <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                            Actual
                                        </span>
                                    )}
                                </button>
                            ))}
                            {filteredCities.length === 0 && (
                                <p className="px-4 py-6 text-center text-sm text-stone-400">
                                    No se encontró la ciudad
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
