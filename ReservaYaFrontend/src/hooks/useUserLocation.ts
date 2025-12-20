"use client";

import { useState, useEffect, useCallback } from 'react';

export interface UserLocation {
    latitude: number;
    longitude: number;
    source: 'gps' | 'city' | 'default';
    cityName?: string;
}

export interface LocationState {
    location: UserLocation | null;
    status: 'loading' | 'granted' | 'denied' | 'unavailable' | 'city_selected';
    error: string | null;
}

// Ciudades principales de Nicaragua con coordenadas del centro
export const NICARAGUAN_CITIES = [
    { id: 'managua', name: 'Managua', lat: 12.1149, lng: -86.2362 },
    { id: 'leon', name: 'León', lat: 12.4379, lng: -86.8780 },
    { id: 'granada', name: 'Granada', lat: 11.9299, lng: -85.9560 },
    { id: 'masaya', name: 'Masaya', lat: 11.9740, lng: -86.0943 },
    { id: 'chinandega', name: 'Chinandega', lat: 12.6294, lng: -87.1311 },
    { id: 'matagalpa', name: 'Matagalpa', lat: 12.9256, lng: -85.9178 },
    { id: 'esteli', name: 'Estelí', lat: 13.0911, lng: -86.3540 },
    { id: 'jinotega', name: 'Jinotega', lat: 13.0904, lng: -85.9995 },
    { id: 'rivas', name: 'Rivas', lat: 11.4400, lng: -85.8340 },
    { id: 'bluefields', name: 'Bluefields', lat: 12.0138, lng: -83.7636 },
] as const;

// Default: Managua
const DEFAULT_LOCATION: UserLocation = {
    latitude: 12.1149,
    longitude: -86.2362,
    source: 'default',
    cityName: 'Managua'
};

export function useUserLocation() {
    const [state, setState] = useState<LocationState>({
        location: null,
        status: 'loading',
        error: null
    });

    // Request GPS permission and get location
    const requestGPS = useCallback(() => {
        if (!navigator.geolocation) {
            setState({
                location: DEFAULT_LOCATION,
                status: 'unavailable',
                error: 'Geolocalización no disponible en este navegador'
            });
            return;
        }

        setState(prev => ({ ...prev, status: 'loading', error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    location: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        source: 'gps'
                    },
                    status: 'granted',
                    error: null
                });
            },
            (error) => {
                let errorMessage = 'Error al obtener ubicación';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'Permiso de ubicación denegado';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = 'Ubicación no disponible';
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = 'Tiempo de espera agotado';
                }

                setState({
                    location: null,
                    status: 'denied',
                    error: errorMessage
                });
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes cache
            }
        );
    }, []);

    // Select city manually
    const selectCity = useCallback((cityId: string) => {
        const city = NICARAGUAN_CITIES.find(c => c.id === cityId);
        if (city) {
            setState({
                location: {
                    latitude: city.lat,
                    longitude: city.lng,
                    source: 'city',
                    cityName: city.name
                },
                status: 'city_selected',
                error: null
            });
        }
    }, []);

    // Set default location
    const useDefault = useCallback(() => {
        setState({
            location: DEFAULT_LOCATION,
            status: 'city_selected',
            error: null
        });
    }, []);

    // Auto-request GPS on mount
    useEffect(() => {
        // Check if we have a saved preference
        const savedCity = localStorage.getItem('userCity');
        if (savedCity) {
            selectCity(savedCity);
        } else {
            requestGPS();
        }
    }, [requestGPS, selectCity]);

    // Save city preference
    const saveCityPreference = useCallback((cityId: string) => {
        localStorage.setItem('userCity', cityId);
        selectCity(cityId);
    }, [selectCity]);

    return {
        ...state,
        requestGPS,
        selectCity: saveCityPreference,
        useDefault,
        cities: NICARAGUAN_CITIES
    };
}
