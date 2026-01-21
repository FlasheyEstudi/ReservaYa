'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Star, MapPin, Clock, Phone, ArrowLeft, Calendar, Users, Utensils,
  MessageSquare, Check, X, Loader2, Heart, Share2, Info, ChevronRight,
  Flame, Sparkles, ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores';
import { useToast } from '@/components/ui/toast-provider';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
}

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  category: string;
  rating: number;
  review_count: number;
  likes_count: number;
  image: string;
  menu_items: MenuItem[];
  reviews: Review[];
  tables: any[];
}

export default function RestaurantProfile() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Reservation State
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [people, setPeople] = useState<number>(2);
  const [step, setStep] = useState<'details' | 'tables' | 'confirm' | 'success'>('details');
  const [submitting, setSubmitting] = useState(false);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [reservationNotes, setReservationNotes] = useState<string>('');

  // Review State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Location/Branch State for multi-branch restaurants
  const [locations, setLocations] = useState<{ id: string; name: string; address?: string; phone?: string }[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(restaurantId);
  const [hasMultipleLocations, setHasMultipleLocations] = useState(false);

  // Share State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Parallax & Scroll
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`);
        if (res.ok) {
          const data = await res.json();
          setRestaurant(data.restaurant);
        } else {
          // Fallback demo data if API fails or backend not updated yet
          setRestaurant({
            id: restaurantId,
            name: 'Restaurante Demo',
            description: 'Experiencia gastronómica única.',
            address: 'Calle Principal 123',
            phone: '555-0123',
            category: 'Italiana',
            rating: 4.8,
            review_count: 120,
            likes_count: 340,
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop',
            menu_items: [
              { id: '1', name: 'Pasta Carbonara', description: 'Auténtica receta romana', price: 18.50, category: 'Pastas' },
              { id: '2', name: 'Pizza Margherita', description: 'Tomate San Marzano, mozzarella di bufala', price: 15.00, category: 'Pizzas' },
            ],
            reviews: [],
            tables: []
          });
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();

    // Check if restaurant is liked
    const checkLikeStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/likes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const likedIds = data.likedRestaurantIds || [];
          setIsLiked(likedIds.includes(restaurantId));
        }
      } catch (e) {
        console.error('Error checking like status:', e);
      }
    };
    checkLikeStatus();

    // Fetch locations/branches for this restaurant
    const fetchLocations = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/public/restaurant/${restaurantId}/locations`);
        if (res.ok) {
          const data = await res.json();
          setLocations(data.locations || []);
          setHasMultipleLocations(data.hasMultipleLocations || false);
          if (data.locations?.length > 0) {
            setSelectedLocationId(data.locations[0].id);
          }
        }
      } catch (e) {
        console.error('Error fetching locations:', e);
      }
    };
    fetchLocations();
  }, [restaurantId]);

  const handleToggleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Optimistic update
    const previousState = isLiked;
    setIsLiked(!previousState);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ restaurantId })
      });

      if (!res.ok) {
        // Revert on error
        setIsLiked(previousState);
      }
    } catch (e) {
      console.error('Error toggling like:', e);
      setIsLiked(previousState);
    }
  };

  // Fetch available tables for selected date/time/party
  const fetchAvailableTables = async () => {
    setLoadingTables(true);
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/restaurants/${restaurantId}/tables?date=${date}&time=${time}&partySize=${people}`);
      if (res.ok) {
        const data = await res.json();
        // Filter tables that can accommodate the party size
        const suitable = (data.tables || []).filter((t: any) =>
          t.capacity >= people && (t.currentStatus === 'free' || t.currentStatus === 'available')
        );
        setAvailableTables(suitable);
      } else {
        // Fallback: show all restaurant tables
        const tablesRes = await fetch(`${apiUrl}/restaurant/layout`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (tablesRes.ok) {
          const data = await tablesRes.json();
          const suitable = (data.tables || []).filter((t: any) =>
            t.capacity >= people && (t.currentStatus === 'free' || !t.currentStatus || t.currentStatus === 'available')
          );
          setAvailableTables(suitable);
        }
      }
    } catch (e) {
      console.error('Error fetching tables:', e);
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleReservation = async () => {
    setSubmitting(true);
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    const apiUrl = getApiUrl();
    try {
      const payload = {
        restaurant_id: selectedLocationId, // Use selected branch/location
        reservation_time: new Date(`${date}T${time}:00`).toISOString(),
        party_size: people,
        user_id: user?.id,
        table_id: selectedTable?.id,
        notes: reservationNotes.trim() || undefined
      };
      console.log('SENDING RESERVATION:', JSON.stringify(payload, null, 2));

      const res = await fetch(`${apiUrl}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });




      if (res.ok) {
        setStep('success');
      } else {
        showError('Error al reservar', 'Intenta con otro horario o mesa');
      }
    } catch (e) {
      console.error('Reservation error:', e);
      showError('Error de conexión', 'Verifica tu conexión e intenta de nuevo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurantId: restaurantId,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (res.ok) {
        setIsReviewModalOpen(false);
        showSuccess('¡Reseña enviada!', 'Gracias por tu opinión');
        // Refresh restaurant data
        window.location.reload();
      } else {
        showError('Error', 'No se pudo enviar la reseña');
      }
    } catch (e) {
      console.error('Error submitting review:', e);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Share Restaurant
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = restaurant?.name || 'Restaurante';
    const shareText = `¡Mira este restaurante! ${shareTitle} - ${restaurant?.category || ''} ⭐${restaurant?.rating || ''}`;

    // Try native Web Share API first (mobile friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return; // Success, don't show modal
      } catch (err) {
        // User cancelled or error, show fallback modal
        if ((err as Error).name !== 'AbortError') {
          setIsShareModalOpen(true);
        }
      }
    } else {
      // No native share, show fallback modal
      setIsShareModalOpen(true);
    }
  };

  const shareToWhatsApp = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const text = `¡Mira este restaurante! ${restaurant?.name} ⭐${restaurant?.rating}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setIsShareModalOpen(false);
  };

  const shareToFacebook = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    setIsShareModalOpen(false);
  };

  const copyToClipboard = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setIsShareModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600 mb-4" />
          <p className="text-stone-500 font-medium">Preparando tu mesa...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) return <div>No encontrado</div>;

  // Group menu by category
  const menuByCategory = restaurant.menu_items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const timeSlots = ['13:00', '13:30', '14:00', '14:30', '15:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-0">
      {/* Immersive Hero */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-stone-900"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        >
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-20 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        {/* Actions */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={handleShare}
            className="p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleToggleLike}
            className={`p-2 backdrop-blur-md rounded-full transition-colors ${isLiked
              ? 'bg-red-500/90 text-white hover:bg-red-600'
              : 'bg-black/20 text-white hover:bg-black/40'
              }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Floating Review Button (Desktop) */}
        <div className="absolute top-4 right-16 z-20 hidden md:block">
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-4 py-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Star className="h-4 w-4" /> Calificar
          </button>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10 translate-y-[1px]">
          <div className="max-w-4xl mx-auto">
            <Badge className="bg-orange-500 hover:bg-orange-600 text-white mb-3 border-none">
              {restaurant.category}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 shadow-sm">{restaurant.name}</h1>
            <div className="flex items-center gap-4 text-white/90 text-sm md:text-base">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-orange-400" /> {restaurant.address}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold">{restaurant.rating}</span> ({restaurant.review_count} reseñas)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-stone-50 min-h-[50vh] relative z-20 -mt-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto px-4 py-8">

          <Tabs defaultValue="menu" className="w-full" onValueChange={setActiveTab}>
            <div className="sticky top-0 bg-stone-50/95 backdrop-blur-sm z-30 py-2 -mx-4 px-4 border-b border-stone-200">
              <TabsList className="bg-stone-100 p-1 rounded-xl w-full flex justify-start overflow-x-auto">
                <TabsTrigger value="menu" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">
                  <Utensils className="h-4 w-4 mr-2" /> Menú
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">
                  <Star className="h-4 w-4 mr-2" /> Reseñas
                </TabsTrigger>
                <TabsTrigger value="info" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">
                  <Info className="h-4 w-4 mr-2" /> Info
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-8 min-h-[400px]">
              <TabsContent value="menu" className="space-y-8 animate-in mt-0">
                {Object.keys(menuByCategory).length > 0 ? (
                  Object.entries(menuByCategory).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-orange-500" /> {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map(item => (
                          <div key={item.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-stone-900">{item.name}</h4>
                                <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded text-sm min-w-fit ml-2">
                                  ${item.price}
                                </span>
                              </div>
                              <p className="text-stone-500 text-sm line-clamp-2">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Utensils className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-500">Menú no disponible por el momento</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6 animate-in mt-0">
                <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm text-center mb-6">
                  <div className="text-5xl font-bold text-stone-900 mb-2">{restaurant.rating}</div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`h-6 w-6 ${star <= Math.round(restaurant.rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                    ))}
                  </div>
                  <p className="text-stone-500">{restaurant.review_count} opiniones verificadas</p>
                </div>

                {restaurant.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {restaurant.reviews.map(review => (
                      <div key={review.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 bg-stone-100">
                              <AvatarFallback className="text-xs text-stone-600 font-bold">{review.user[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-sm text-stone-900">{review.user}</p>
                              <p className="text-xs text-stone-400">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className={`h-3 w-3 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-500">Sé el primero en opinar</p>
                  </div>
                )}
              </TabsContent>

              <div className="mt-6 md:hidden px-4">
                <Button variant="outline" onClick={() => setIsReviewModalOpen(true)} className="w-full bg-white border-orange-200 text-orange-700 hover:bg-orange-50">
                  <Star className="h-4 w-4 mr-2" /> Escribir una reseña
                </Button>
              </div>

              <TabsContent value="info" className="space-y-6 animate-in mt-0">
                <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-stone-900">Sobre nosotros</h3>
                  <p className="text-stone-600 leading-relaxed">{restaurant.description}</p>

                  <div className="border-t border-stone-100 my-4 pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-stone-900">Ubicación</p>
                        <p className="text-stone-500 text-sm">{restaurant.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-stone-900">Contacto</p>
                        <p className="text-stone-500 text-sm">{restaurant.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-stone-900">Horario</p>
                        <p className="text-stone-500 text-sm">Abierto hoy: 12:00 - 23:00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Floating Action Button for Mobile / Sidebar for Desktop */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 md:hidden z-40">
        <Button
          className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6 rounded-xl shadow-lg shadow-orange-500/20"
          onClick={() => setIsReservationModalOpen(true)}
        >
          Reservar Mesa
        </Button>
      </div>

      <div className="hidden md:block fixed right-8 top-32 w-80 bg-white p-6 rounded-2xl shadow-xl border border-stone-100 z-30">
        <h3 className="text-xl font-bold mb-4">Hacer Reserva</h3>
        <p className="text-sm text-stone-500 mb-6">Reserva tu mesa en segundos</p>
        <Button
          className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base"
          onClick={() => setIsReservationModalOpen(true)}
        >
          Continuar Reserva
        </Button>
      </div>

      {/* Reservation Modal */}
      <Modal
        isOpen={isReservationModalOpen}
        onClose={() => {
          setIsReservationModalOpen(false);
          setStep('details');
        }}
        title="Reservar Mesa"
      >
        {step === 'details' && (
          <div className="space-y-6">
            {/* Location Selector for multi-branch */}
            {hasMultipleLocations && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Sucursal</label>
                <div className="grid grid-cols-1 gap-2">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${selectedLocationId === loc.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-stone-200 hover:border-orange-200'
                        }`}
                    >
                      <p className="font-bold text-stone-800">{loc.name}</p>
                      {loc.address && (
                        <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />{loc.address}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">¿Cuántas personas?</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const val = Math.max(1, people - 1);
                    setPeople(val);
                    setSelectedTable(null);
                  }}
                  className="h-10 w-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-xl font-bold hover:bg-stone-200"
                >
                  -
                </button>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={people}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setPeople(val);
                    setSelectedTable(null);
                  }}
                  className="w-20 text-center text-lg font-bold"
                />
                <button
                  onClick={() => {
                    const val = people + 1;
                    setPeople(val);
                    setSelectedTable(null);
                  }}
                  className="h-10 w-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-xl font-bold hover:bg-stone-200"
                >
                  +
                </button>
                <span className="text-stone-500 text-sm ml-2">personas</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Fecha</label>
              <Input
                type="date"
                className="w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Hora</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(t => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${time === t
                      ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
                      : 'bg-white border border-stone-200 text-stone-600 hover:border-orange-200'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Notes */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Notas especiales (opcional)
              </label>
              <textarea
                value={reservationNotes}
                onChange={(e) => setReservationNotes(e.target.value)}
                placeholder="Ej: Es cumpleaños, silla para bebé, alergia a mariscos..."
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-stone-400 mt-1">{reservationNotes.length}/200</p>
            </div>

            <Button
              className="w-full bg-stone-900 hover:bg-stone-800 text-white h-12 mt-4"
              disabled={!date || !time}
              onClick={() => {
                fetchAvailableTables();
                setStep('tables');
              }}
            >
              Ver mesas disponibles
            </Button>
          </div>
        )}

        {step === 'tables' && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-stone-500 text-sm">
                {date && new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {time}
              </p>
              <p className="text-stone-700 font-medium">{people} personas</p>
            </div>

            {loadingTables ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : availableTables.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-3">Selecciona una mesa</label>
                <div className="grid grid-cols-3 gap-3">
                  {availableTables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(table)}
                      className={`p-4 rounded-xl border-2 transition-all ${selectedTable?.id === table.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-stone-200 hover:border-orange-200'
                        }`}
                    >
                      <div className="text-lg font-bold text-stone-800">
                        {table.tableNumber || table.number || `M${table.id.slice(-2)}`}
                      </div>
                      <div className="text-xs text-stone-500">
                        <Users className="h-3 w-3 inline mr-1" />
                        {table.capacity} personas
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-stone-500">No hay mesas disponibles para este horario.</p>
                <p className="text-sm text-stone-400 mt-2">Intenta con otra hora o fecha.</p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep('details')}>
                Atrás
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700 h-12"
                disabled={!selectedTable}
                onClick={() => setStep('confirm')}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}


        {step === 'confirm' && (
          <div className="space-y-6 text-center py-4">
            <h3 className="text-lg font-medium text-stone-900">Confirma tu reserva</h3>

            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-stone-700">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">{new Date(date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-700">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">{time}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-700">
                  <Users className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">{people} personas</span>
                </div>
                {selectedTable && (
                  <div className="flex items-center gap-3 text-stone-700">
                    <Utensils className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold">
                      Mesa {selectedTable.tableNumber || selectedTable.number || selectedTable.id.slice(-4)}
                      ({selectedTable.capacity} personas)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep('tables')}>
                Atrás
              </Button>

              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700 h-12"
                onClick={handleReservation}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900">¡Reserva Exitosa!</h3>
            <p className="text-stone-500">Te esperamos en {restaurant.name}.</p>
            <Button
              className="w-full bg-stone-900 text-white mt-4"
              onClick={() => {
                setIsReservationModalOpen(false);
                router.push('/profile');
              }}
            >
              Ver en mis reservas
            </Button>
          </div>
        )}
      </Modal>


      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Calificar Restaurante"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2 mb-4">
            <p className="text-stone-500 font-medium">¿Qué tal estuvo tu experiencia?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-bold text-amber-500">
              {reviewRating === 5 ? '¡Excelente!' : reviewRating === 4 ? 'Muy bueno' : reviewRating === 3 ? 'Regular' : reviewRating === 2 ? 'Malo' : 'Pésimo'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Tu comentario</label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Cuéntanos qué te gustó más..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </div>

          <Button
            className="w-full bg-orange-600 hover:bg-orange-700 h-12"
            onClick={handleSubmitReview}
            disabled={submittingReview || !reviewComment.trim()}
          >
            {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
            Publicar Reseña
          </Button>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Compartir Restaurante"
      >
        <div className="space-y-4">
          <p className="text-stone-500 text-sm text-center mb-4">
            ¡Comparte {restaurant?.name} con tus amigos!
          </p>

          {/* WhatsApp */}
          <button
            onClick={shareToWhatsApp}
            className="w-full flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <span className="font-medium text-green-700">WhatsApp</span>
          </button>

          {/* Facebook */}
          <button
            onClick={shareToFacebook}
            className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <span className="font-medium text-blue-700">Facebook</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={copyToClipboard}
            className="w-full flex items-center gap-4 p-4 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors"
          >
            <div className="w-10 h-10 bg-stone-600 rounded-full flex items-center justify-center">
              {copySuccess ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <span className="font-medium text-stone-700">
              {copySuccess ? '¡Copiado!' : 'Copiar enlace'}
            </span>
          </button>
        </div>
      </Modal>

    </div >
  );
}