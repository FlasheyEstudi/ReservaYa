'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Utensils, MapPin, Phone, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: string | number;
    image?: string;
}

interface MenuCategory {
    id: string;
    name: string;
    items: MenuItem[];
}

interface Restaurant {
    id: string;
    name: string;
    description?: string;
    image?: string;
    category?: string;
    address?: string;
    phone?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function PublicMenuPage() {
    const params = useParams();
    const restaurantId = params?.restaurantId as string;

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menu, setMenu] = useState<MenuCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (restaurantId) {
            fetchMenu();
        }
    }, [restaurantId]);

    const fetchMenu = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/public/menu/${restaurantId}`);

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Restaurante no encontrado');
                }
                throw new Error('Error al cargar el menú');
            }

            const data = await res.json();
            setRestaurant(data.restaurant);
            setMenu(data.menu || []);

            // Expand all categories by default
            const allCategoryIds = new Set<string>(data.menu.map((c: MenuCategory) => c.id));
            setExpandedCategories(allCategoryIds);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const formatPrice = (price: string | number) => {
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return `$${num.toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-stone-600">Cargando menú...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
                <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
                    <Utensils className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">Oops!</h1>
                    <p className="text-stone-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                <div className="max-w-2xl mx-auto px-4 py-8">
                    {restaurant?.image && (
                        <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm overflow-hidden mb-4 mx-auto">
                            <img
                                src={restaurant.image}
                                alt={restaurant.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <h1 className="text-3xl font-bold text-center mb-2">
                        {restaurant?.name || 'Menú'}
                    </h1>

                    {restaurant?.description && (
                        <p className="text-white/80 text-center text-sm mb-4">
                            {restaurant.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/90">
                        {restaurant?.category && (
                            <span className="flex items-center gap-1">
                                <Utensils className="h-4 w-4" />
                                {restaurant.category}
                            </span>
                        )}
                        {restaurant?.address && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {restaurant.address}
                            </span>
                        )}
                        {restaurant?.phone && (
                            <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:underline">
                                <Phone className="h-4 w-4" />
                                {restaurant.phone}
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {/* Menu Content */}
            <main className="max-w-2xl mx-auto px-4 py-6">
                {menu.length === 0 ? (
                    <div className="text-center py-12">
                        <Utensils className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                        <p className="text-stone-500">No hay items en el menú disponibles</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {menu.map(category => (
                            <div key={category.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className="w-full px-6 py-4 flex items-center justify-between bg-stone-50 hover:bg-stone-100 transition-colors"
                                >
                                    <h2 className="text-lg font-semibold text-stone-800">{category.name}</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-stone-500">{category.items.length} items</span>
                                        {expandedCategories.has(category.id) ? (
                                            <ChevronUp className="h-5 w-5 text-stone-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-stone-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Category Items */}
                                {expandedCategories.has(category.id) && (
                                    <div className="divide-y divide-stone-100">
                                        {category.items.map(item => (
                                            <div key={item.id} className="px-6 py-4 flex gap-4">
                                                {item.image && (
                                                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="font-medium text-stone-800">{item.name}</h3>
                                                        <span className="text-orange-600 font-semibold whitespace-nowrap">
                                                            {formatPrice(item.price)}
                                                        </span>
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-sm text-stone-400">
                <p>Powered by ReservaYa</p>
            </footer>
        </div>
    );
}
