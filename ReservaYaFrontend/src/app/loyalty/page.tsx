'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, CreditCard, Star, Gift, Loader2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface LoyaltyCard {
    id: string;
    restaurantId: string;
    restaurantName: string;
    restaurantImage: string | null;
    restaurantCategory: string | null;
    currentVisits: number;
    totalVisits: number;
    visitsRequired: number;
    rewardTitle: string;
    rewardDescription: string | null;
    rewardsRedeemed: number;
    lastVisitAt: string | null;
    isRewardAvailable: boolean;
}

export default function LoyaltyCardsPage() {
    const router = useRouter();
    const [cards, setCards] = useState<LoyaltyCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }
        fetchCards(token);
    }, [router]);

    const fetchCards = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/loyalty/cards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCards(data.cards || []);
            }
        } catch (err) {
            console.error('Error fetching loyalty cards:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                <div className="max-w-2xl mx-auto px-4 py-6">
                    <button onClick={() => router.back()} className="mb-4">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Mis Tarjetas</h1>
                            <p className="text-orange-100 text-sm">Acumula visitas, gana recompensas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {cards.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
                        <CreditCard className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-stone-800 mb-2">Sin tarjetas aún</h3>
                        <p className="text-stone-500 text-sm mb-4">
                            Cuando visites restaurantes con programa de fidelidad, tus tarjetas aparecerán aquí.
                        </p>
                        <Button onClick={() => router.push('/')} className="bg-orange-600 hover:bg-orange-700">
                            Explorar Restaurantes
                        </Button>
                    </div>
                ) : (
                    cards.map(card => (
                        <div
                            key={card.id}
                            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm"
                        >
                            {/* Card Header */}
                            <div
                                className="p-4 flex gap-4 cursor-pointer hover:bg-stone-50 transition-colors"
                                onClick={() => router.push(`/restaurant/${card.restaurantId}`)}
                            >
                                <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                                    {card.restaurantImage ? (
                                        <img src={card.restaurantImage} alt={card.restaurantName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                                            <CreditCard className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-stone-900 truncate">{card.restaurantName}</h3>
                                    {card.restaurantCategory && (
                                        <p className="text-sm text-stone-500">{card.restaurantCategory}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                                            {card.totalVisits} visitas totales
                                        </Badge>
                                        {card.rewardsRedeemed > 0 && (
                                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                                                <Gift className="h-3 w-3 mr-1" />
                                                {card.rewardsRedeemed} canjeadas
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stamps Progress */}
                            <div className="px-4 pb-4">
                                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                                    {/* Stamps Grid */}
                                    <div className="flex flex-wrap gap-2 justify-center mb-3">
                                        {Array.from({ length: card.visitsRequired }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${i < card.currentVisits
                                                        ? 'bg-orange-500 text-white shadow-md'
                                                        : 'bg-stone-200 text-stone-400'
                                                    }`}
                                            >
                                                {i < card.currentVisits ? (
                                                    <Star className="h-4 w-4 fill-current" />
                                                ) : (
                                                    <span className="text-xs">{i + 1}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Progress Text */}
                                    <div className="text-center">
                                        {card.isRewardAvailable ? (
                                            <div className="flex items-center justify-center gap-2 text-orange-600 font-bold">
                                                <Sparkles className="h-5 w-5" />
                                                <span>¡Recompensa lista para canjear!</span>
                                            </div>
                                        ) : (
                                            <p className="text-stone-600 text-sm">
                                                <span className="font-bold text-orange-600">{card.currentVisits}</span>
                                                /{card.visitsRequired} visitas para tu recompensa
                                            </p>
                                        )}
                                    </div>

                                    {/* Reward Info */}
                                    <div className="mt-3 pt-3 border-t border-orange-200/50 text-center">
                                        <p className="text-xs text-stone-500">Tu recompensa:</p>
                                        <p className="font-medium text-stone-800">{card.rewardTitle}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
