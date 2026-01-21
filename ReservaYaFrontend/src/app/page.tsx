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

// Types
interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user_name: string;
  date: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string | null;
  image: string | null;
}

interface Restaurant {
  id: string;
  name: string;
  business_code: string;
  category: string;
  description: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  status: string;
  available_capacity: number;
  total_capacity: number;
  is_available: boolean;
  average_rating: number;
  review_count: number;
  likes_count: number;
  table_count: number;
  reviews: Review[];
  featured_menu: MenuItem[];
  distance?: number | null;
  priceRange?: string; // Mapped in frontend
  isOpen?: boolean; // Mapped in frontend
  likesCount?: number; // Mapped compatibility
  rating?: number; // Mapped compatibility
}

export default function Home() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userName, setUserName] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRestaurants, setTotalRestaurants] = useState(0);

  // User location hook
  const { location, status: locationStatus, selectCity, requestGPS } = useUserLocation();

  // Get current city name for display
  const currentCityId = NICARAGUAN_CITIES.find(
    c => c.lat === location?.latitude && c.lng === location?.longitude
  )?.id;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on new search
      fetchRestaurants(1, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Fetch restaurants based on filters
  const fetchRestaurants = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoadingRestaurants(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      // Build Query Params
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '10');

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);

      // If we have specific city selected (via location hook usually providing lat/lng, 
      // but search API expects city name or we implement lat/lng search later)
      // For now, let's omit lat/lng unless search supports it, or send as meta

      const res = await fetch(`${API_URL}/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const newRestaurants = data.restaurants || [];
        const meta = data.pagination;

        if (reset) {
          setRestaurants(newRestaurants);
        } else {
          setRestaurants(prev => [...prev, ...newRestaurants]);
        }

        setHasMore(meta.page < meta.totalPages);
        setTotalRestaurants(meta.total);
      }
    } catch (e) {
      console.error('Error fetching:', e);
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, [searchQuery, selectedCategory]);

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

    // Initial fetch
    fetchRestaurants(1, true);
  }, []);

  const loadMore = () => {
    if (!isLoadingRestaurants && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRestaurants(nextPage, false);
    }
  };

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
            <div className="flex items-center justify-between w-full"> {/* Adjusted layout */}
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs text-stone-500">{getGreeting()}</p>
                  <h1 className="text-lg font-bold text-stone-900">{userName}! 👋</h1>
                </div>
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
            {selectedCategory === 'all' ? 'Lugares Populares' : CATEGORIES.find(c => c.id === selectedCategory)?.label}
          </h2>
          <span className="text-xs text-stone-500">{totalRestaurants} resultados</span>
        </div>

        {/* Restaurant Cards */}
        <div className="space-y-4">
          {restaurants.map((restaurant) => (
            <article
              key={restaurant.id}
              className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 active:scale-[0.99] transition-transform cursor-pointer ${!restaurant.is_available ? 'opacity-75 grayscale-[0.5]' : ''}`}
              onClick={() => router.push(`/restaurant/${restaurant.id}`)}
            >
              {/* Image with Overlay */}
              <div className="relative aspect-[16/9]">
                <img
                  src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop'}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <button
                  onClick={(e) => toggleLike(restaurant.id, e)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${likedPosts.has(restaurant.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white/80 text-stone-600 hover:bg-white'
                    }`}
                >
                  <Heart className={`h-5 w-5 ${likedPosts.has(restaurant.id) ? 'fill-current' : ''}`} />
                </button>

                <div className="absolute top-3 left-3">
                  {restaurant.is_available ? (
                    <Badge className={`${restaurant.status === 'active' ? 'bg-emerald-500' : 'bg-stone-500'} text-white text-[10px] font-medium`}>
                      {restaurant.status === 'active' ? '● Abierto' : '● Cerrado'}
                    </Badge>
                  ) : (
                    <Badge className="bg-stone-600 text-white text-[10px] font-medium">
                      ● Sin cupo
                    </Badge>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">{restaurant.name}</h3>
                  <div className="flex items-center gap-2 text-white/90 text-xs">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{restaurant.average_rating?.toFixed(1) || '4.5'}</span>
                      <span className="text-white/70">({restaurant.review_count || 0})</span>
                    </span>
                    <span>•</span>
                    <span>{restaurant.category || 'General'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {restaurant.description && (
                <div className="px-3 pt-3">
                  <p className="text-xs text-stone-600 line-clamp-2">{restaurant.description}</p>
                </div>
              )}

              {/* Card Footer */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-stone-500 flex-1 min-w-0">
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
                  disabled={!restaurant.is_available}
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

          {/* Load More Button */}
          {hasMore && restaurants.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingRestaurants}
                className="rounded-full px-6"
              >
                {isLoadingRestaurants ? 'Cargando...' : 'Ver más restaurantes'}
              </Button>
            </div>
          )}

        </div>

        {/* Empty State */}
        {!isLoadingRestaurants && restaurants.length === 0 && (
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