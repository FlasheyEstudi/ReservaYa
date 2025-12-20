'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Heart, Calendar, Star, Utensils, MapPin, User, Clock, TrendingUp, Sparkles, Filter, Flame, Coffee, Pizza, Salad, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LandingPage from '@/components/LandingPage';
import CitySelector from '@/components/ui/CitySelector';
import ClickableAddress from '@/components/ui/ClickableAddress';
import { useUserLocation, NICARAGUAN_CITIES } from '@/hooks/useUserLocation';

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: Sparkles, color: 'bg-gradient-to-r from-orange-500 to-amber-500' },
  { id: 'trending', label: 'Trending', icon: TrendingUp, color: 'bg-rose-500' },
  { id: 'mexican', label: 'Mexicana', icon: Flame, color: 'bg-red-500' },
  { id: 'italian', label: 'Italiana', icon: Pizza, color: 'bg-green-500' },
  { id: 'cafe', label: 'Cafetería', icon: Coffee, color: 'bg-amber-600' },
  { id: 'healthy', label: 'Saludable', icon: Salad, color: 'bg-emerald-500' },
];

export default function Home() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userName, setUserName] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);

  // User location hook
  const { location, status: locationStatus, selectCity, requestGPS } = useUserLocation();

  // Get current city name for display
  const currentCityId = NICARAGUAN_CITIES.find(
    c => c.lat === location?.latitude && c.lng === location?.longitude
  )?.id;

  // Fetch restaurants based on user location
  const fetchRestaurants = useCallback(async (lat?: number, lng?: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoadingRestaurants(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      // Use nearby endpoint if we have coordinates, otherwise use search
      let url = `${API_URL}/search`;
      if (lat && lng) {
        url = `${API_URL}/restaurants/nearby?lat=${lat}&lng=${lng}&radius=50`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const restaurantList = data.restaurants || [];
        if (restaurantList.length > 0) {
          const mapped = restaurantList.map((r: any) => ({
            ...r,
            rating: r.average_rating || r.rating || 4.5,
            likesCount: r.likes_count || r.likesCount || 0,
            image: r.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
            priceRange: r.priceRange || '$$',
            distance: r.distance !== undefined ? r.distance : null,
            isOpen: r.isOpen !== undefined ? r.isOpen : true,
          }));
          setRestaurants(mapped);
        }
      }
    } catch (e) {
      console.error('Error fetching:', e);
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, []);

  // Initial auth check and likes load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    setIsLoggedIn(!!token);

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.fullName || user.name || user.email?.split('@')[0] || 'Usuario');
      } catch (e) { }
    }

    if (!token) return;

    const loadLikes = async () => {
      try {
        const res = await fetch('/api/likes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLikedPosts(new Set(data.likedRestaurantIds || []));
        }
      } catch (e) {
        console.error('Error loading likes:', e);
      }
    };
    loadLikes();
  }, []);

  // Refetch when location changes
  useEffect(() => {
    if (isLoggedIn && location) {
      fetchRestaurants(location.latitude, location.longitude);
    } else if (isLoggedIn && locationStatus === 'denied') {
      // No location, fetch without coordinates
      fetchRestaurants();
    }
  }, [location, locationStatus, isLoggedIn, fetchRestaurants]);

  const toggleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');

    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });

    if (token) {
      try {
        await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ restaurantId: id })
        });
      } catch (e) {
        console.error('Error toggling like:', e);
      }
    }
  };

  const rankedRestaurants = [...restaurants].sort((a, b) => {
    const aLiked = likedPosts.has(a.id) ? 100 : 0;
    const bLiked = likedPosts.has(b.id) ? 100 : 0;
    const aScore = aLiked + (a.likesCount || 0) + (a.rating || 0) * 10;
    const bScore = bLiked + (b.likesCount || 0) + (b.rating || 0) * 10;
    return bScore - aScore;
  });

  const filteredRestaurants = rankedRestaurants.filter(r => {
    const matchesSearch = !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      r.category?.toLowerCase().includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LandingPage />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-stone-500">{getGreeting()}</p>
                <h1 className="text-lg font-bold text-stone-900">{userName}! 👋</h1>
              </div>
              {/* City Selector */}
              <CitySelector
                currentCity={currentCityId}
                onSelectCity={selectCity}
                onRequestGPS={requestGPS}
                isLoading={locationStatus === 'loading'}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                {showSearch ? <X className="h-5 w-5 text-stone-600" /> : <Search className="h-5 w-5 text-stone-600" />}
              </button>
              <Avatar
                className="h-10 w-10 ring-2 ring-orange-100 cursor-pointer"
                onClick={() => router.push('/profile')}
              >
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}&backgroundColor=ffdfbf`} />
                <AvatarFallback className="bg-orange-100 text-orange-700">{userName[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Search Bar (Collapsible) */}
          {showSearch && (
            <div className="mb-3 animate-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Buscar restaurantes, cocinas..."
                  className="pl-10 h-11 bg-stone-50 border-stone-200 rounded-xl text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${isActive
                    ? `${cat.color} text-white shadow-md`
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-stone-900">
            {selectedCategory === 'all' ? 'Cerca de ti' : CATEGORIES.find(c => c.id === selectedCategory)?.label}
          </h2>
          <span className="text-xs text-stone-500">{filteredRestaurants.length} lugares</span>
        </div>

        {/* Restaurant Cards */}
        <div className="space-y-4">
          {filteredRestaurants.map((restaurant) => (
            <article
              key={restaurant.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 active:scale-[0.99] transition-transform cursor-pointer"
              onClick={() => router.push(`/restaurant/${restaurant.id}`)}
            >
              {/* Image with Overlay */}
              <div className="relative aspect-[16/9]">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Like Button */}
                <button
                  onClick={(e) => toggleLike(restaurant.id, e)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${likedPosts.has(restaurant.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white/80 text-stone-600 hover:bg-white'
                    }`}
                >
                  <Heart className={`h-5 w-5 ${likedPosts.has(restaurant.id) ? 'fill-current' : ''}`} />
                </button>

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={`${restaurant.isOpen ? 'bg-emerald-500' : 'bg-stone-500'} text-white text-[10px] font-medium`}>
                    {restaurant.isOpen ? '● Abierto' : '● Cerrado'}
                  </Badge>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">{restaurant.name}</h3>
                  <div className="flex items-center gap-2 text-white/90 text-xs">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{restaurant.rating?.toFixed(1) || '4.5'}</span>
                      <span className="text-white/70">({restaurant.review_count || 0})</span>
                    </span>
                    <span>•</span>
                    <span>{restaurant.category || 'General'}</span>
                    <span>•</span>
                    <span>{restaurant.priceRange}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {restaurant.description && (
                <div className="px-3 pt-3">
                  <p className="text-xs text-stone-600 line-clamp-2">{restaurant.description}</p>
                </div>
              )}

              {/* Featured Review */}
              {restaurant.reviews && restaurant.reviews.length > 0 && (
                <div className="px-3 pt-3">
                  <div className="bg-stone-50 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${restaurant.reviews[0].user_name}`} />
                        <AvatarFallback className="text-[8px] bg-orange-100 text-orange-700">{restaurant.reviews[0].user_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-stone-700">{restaurant.reviews[0].user_name}</span>
                      <div className="flex items-center gap-0.5 ml-auto">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < restaurant.reviews[0].rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-2 italic">"{restaurant.reviews[0].comment}"</p>
                  </div>
                </div>
              )}

              {/* Featured Menu Items */}
              {restaurant.featured_menu && restaurant.featured_menu.length > 0 && (
                <div className="px-3 pt-3">
                  <p className="text-xs font-semibold text-stone-700 mb-2">Platillos destacados</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {restaurant.featured_menu.slice(0, 4).map((item: any) => (
                      <div key={item.id} className="flex-shrink-0 bg-stone-50 rounded-lg p-2 min-w-[100px]">
                        <p className="text-xs font-medium text-stone-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-stone-500">{item.category}</p>
                        <p className="text-xs font-bold text-orange-600 mt-1">${item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Footer */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-stone-500 flex-1 min-w-0">
                  {restaurant.distance !== null && (
                    <span className="flex items-center gap-1 shrink-0">
                      <Navigation className="h-3.5 w-3.5 text-orange-500" />
                      <span className="font-medium text-stone-700">{restaurant.distance.toFixed(1)} km</span>
                    </span>
                  )}
                  {restaurant.address && (
                    <ClickableAddress
                      address={restaurant.address}
                      latitude={restaurant.latitude}
                      longitude={restaurant.longitude}
                      className="text-xs truncate"
                    />
                  )}
                </div>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full h-8 px-4 text-xs font-medium shadow-md shadow-orange-500/20 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/restaurant/${restaurant.id}`);
                  }}
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  Reservar
                </Button>
              </div>
            </article>
          ))}

        </div>

        {/* Empty State */}
        {filteredRestaurants.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-200">
            <Utensils className="h-12 w-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-semibold text-stone-700 mb-1">No encontramos resultados</h3>
            <p className="text-sm text-stone-500 mb-4">Intenta con otra búsqueda o categoría</p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="rounded-full"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-stone-200 px-6 py-3 md:hidden flex justify-around items-center z-50 safe-area-inset-bottom">
        <div className="flex justify-around items-center w-full">
          <div className="flex flex-col items-center gap-1 text-orange-600">
            <Utensils className="h-6 w-6" />
            <span className="text-[10px] font-bold">Explorar</span>
          </div>
          <div
            className="flex flex-col items-center gap-1 text-stone-400"
            onClick={() => router.push('/profile')}
          >
            <User className="h-6 w-6" />
            <span className="text-[10px]">Perfil</span>
          </div>
        </div>
      </nav>
    </div>
  );
}