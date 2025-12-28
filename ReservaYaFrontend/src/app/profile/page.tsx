'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode, Calendar, Clock, MapPin, Heart, ArrowLeft, Grid, Bookmark,
  User as UserIcon, Settings, MoreHorizontal, History, MessageSquare,
  Utensils, Star, LogOut, Search, Edit, Save, Loader2, AlertTriangle,
  Leaf, Fish, Milk, Wheat, Egg, ChevronRight, Flame, Check, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';

// Types for preferences
interface UserPreferences {
  diets: string[];
  allergies: string[];
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot';
  favoriteCuisines: string[];
}

const DIET_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetariano', icon: '🌿', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'vegan', label: 'Vegano', icon: '🌱', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'gluten-free', label: 'Sin Gluten', icon: '🌾', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'kosher', label: 'Kosher', icon: '✡️', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'halal', label: 'Halal', icon: '☪️', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { id: 'keto', label: 'Keto', icon: '🥑', color: 'bg-lime-100 text-lime-700 border-lime-200' },
];

const ALLERGY_OPTIONS = [
  { id: 'seafood', label: 'Mariscos', icon: '🦐', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'nuts', label: 'Nueces', icon: '🥜', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'dairy', label: 'Lácteos', icon: '🥛', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'gluten', label: 'Gluten', icon: '🍞', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'eggs', label: 'Huevo', icon: '🥚', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'soy', label: 'Soya', icon: '🫘', color: 'bg-lime-100 text-lime-700 border-lime-200' },
];

const CUISINE_OPTIONS = [
  { id: 'mexican', label: 'Mexicana', icon: '🌮' },
  { id: 'italian', label: 'Italiana', icon: '🍝' },
  { id: 'japanese', label: 'Japonesa', icon: '🍣' },
  { id: 'chinese', label: 'China', icon: '🥡' },
  { id: 'american', label: 'Americana', icon: '🍔' },
  { id: 'french', label: 'Francesa', icon: '🥐' },
  { id: 'indian', label: 'India', icon: '🍛' },
  { id: 'thai', label: 'Tailandesa', icon: '🍜' },
  { id: 'peruvian', label: 'Peruana', icon: '🐟' },
  { id: 'spanish', label: 'Española', icon: '🥘' },
];

const SPICE_LEVELS = [
  { id: 'none', label: 'Sin picante', icon: '😌' },
  { id: 'mild', label: 'Suave', icon: '🌶️' },
  { id: 'medium', label: 'Medio', icon: '🌶️🌶️' },
  { id: 'hot', label: 'Muy picante', icon: '🔥' },
];

export default function Profile() {
  const router = useRouter();
  const { user: storeUser, logout, updateUser } = useAuthStore();
  const [activeReservations, setActiveReservations] = useState<any[]>([]);
  const [pastReservations, setPastReservations] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const reservationCardRef = useRef<HTMLDivElement>(null);

  // Edit Profile State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>({
    diets: [],
    allergies: [],
    spiceLevel: 'mild',
    favoriteCuisines: []
  });
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [tempPreferences, setTempPreferences] = useState<UserPreferences>(preferences);

  // Combined user from store or localStorage
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    let currentUser = storeUser;
    if (!currentUser && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        currentUser = {
          id: parsed.id,
          email: parsed.email,
          name: parsed.fullName || parsed.name || parsed.email.split('@')[0],
          role: parsed.role
        };
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }

    if (currentUser) {
      setUser(currentUser);
    }



    setIsLoading(false);

    const fetchUserData = async (reviews: any[] = []) => {
      // Clear legacy local storage to prevent confusion
      localStorage.removeItem('myReservations');
      localStorage.removeItem('likedRestaurants');

      if (!token) return;

      try {
        const resReservations = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/reservations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resReservations.status === 401) {
          handleLogout();
          return;
        }

        if (resReservations.ok) {
          const data = await resReservations.json();
          if (data.reservations && data.reservations.length > 0) {
            const now = new Date();
            const active = data.reservations.filter((r: any) => new Date(r.reservation_time) >= now);
            const past = data.reservations.filter((r: any) => new Date(r.reservation_time) < now);

            setActiveReservations(active.map((r: any) => ({
              id: r.id,
              restaurantName: r.restaurant_name || r.restaurant?.name || 'Restaurante',
              date: new Date(r.reservation_time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
              time: new Date(r.reservation_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              people: r.party_size || r.people || 2,
              status: r.status || 'confirmed',
              image: r.restaurant_image || r.restaurant?.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=300&fit=crop',
              restaurantId: r.restaurant_id || r.restaurantId
            })));

            setPastReservations(past.map((r: any) => {
              // Find if there is a review for this restaurant by this user
              // Note: Ideally we match by reservation ID if reviews were linked to reservations, 
              // but for now we match by restaurant.
              // Assuming 'reviews' array has 'restaurant' name or we need restaurantId from API to match accurately
              // The review API response currently returns 'restaurant' name, let's try to match loosely or improve API
              const restId = r.restaurant_id || r.restaurantId;
              const userReview = reviews.find(rev => rev.restaurant === (r.restaurant_name || r.restaurant?.name));

              return {
                id: r.id,
                restaurantName: r.restaurant_name || r.restaurant?.name || 'Restaurante',
                date: new Date(r.reservation_time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                rating: userReview ? userReview.rating : 0,
                items: []
              };
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching from API:', error);
      }
    };

    // Fetch user's favorite restaurants
    const fetchFavorites = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/likes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
          handleLogout();
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.likedRestaurants && data.likedRestaurants.length > 0) {
            const mappedFavorites = data.likedRestaurants.map((r: any) => ({
              id: r.id,
              name: r.name,
              cuisine: r.category || 'General',
              image: r.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=300&fit=crop',
              rating: r.average_rating || 4.5
            }));
            setFavorites(mappedFavorites);
          }
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    // Fetch user profile including preferences from API
    const fetchUserProfile = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
          handleLogout();
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.preferences) {
            try {
              const parsed = typeof data.user.preferences === 'string'
                ? JSON.parse(data.user.preferences)
                : data.user.preferences;

              setPreferences(prev => ({
                ...prev,
                ...parsed,
                diets: parsed?.diets || [],
                allergies: parsed?.allergies || [],
                favoriteCuisines: parsed?.favoriteCuisines || [],
                spiceLevel: parsed?.spiceLevel || 'mild'
              }));
            } catch (e) {
              console.error('Error parsing preferences:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      }
    };

    // Fetch user's reviews
    const fetchUserReviews = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      if (!token) return;

      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const userId = decoded.uid || decoded.userId;

        const res = await fetch(`${API_URL}/reviews?userId=${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.reviews) {
            const mappedReviews = data.reviews.map((r: any) => ({
              id: r.id,
              restaurant: r.restaurant,
              rating: r.rating,
              comment: r.comment,
              date: new Date(r.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
              restaurantId: r.restaurantId // Ensure API returns this or we need to find another way
            }));
            setMyReviews(mappedReviews);
            return mappedReviews;
          }
        }
      } catch (e) {
        console.error('Error fetching reviews:', e);
      }
      return [];
    };

    const fetchAllData = async () => {
      setIsLoading(true);
      const reviews = await fetchUserReviews();
      await fetchUserData(reviews || []); // Pass reviews to link with history
      await fetchFavorites();
      await fetchUserProfile();
      setIsLoading(false);
    };

    fetchAllData();
  }, [storeUser, router]);


  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  const openEditModal = () => {
    setEditForm({
      name: user?.name || '',
      phone: (user as any)?.phone || '',
      bio: (user as any)?.bio || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        const data = await res.json();
        // Update auth store
        if (updateUser && data.user) {
          updateUser({ ...user, name: data.user.name || editForm.name } as any);
        }
        // Update local state and auth persistence
        const updatedUser = { ...user, name: editForm.name, phone: editForm.phone, bio: editForm.bio };
        setUser(updatedUser);

        // Update AUTH persistence (token/user) which is valid
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            parsed.fullName = editForm.name;
            parsed.name = editForm.name;
            parsed.phone = editForm.phone;
            localStorage.setItem('user', JSON.stringify(parsed));
          } catch { }
        }
        setIsEditModalOpen(false);
      } else {
        console.error('Failed to update profile');
        // Do NOT update local state if server failed
        alert('Error al actualizar perfil');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };


  const openPreferencesModal = () => {
    setTempPreferences({ ...preferences });
    setIsPreferencesModalOpen(true);
  };

  const toggleDiet = (dietId: string) => {
    setTempPreferences(prev => ({
      ...prev,
      diets: prev.diets.includes(dietId)
        ? prev.diets.filter(d => d !== dietId)
        : [...prev.diets, dietId]
    }));
  };

  const toggleAllergy = (allergyId: string) => {
    setTempPreferences(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergyId)
        ? prev.allergies.filter(a => a !== allergyId)
        : [...prev.allergies, allergyId]
    }));
  };

  const toggleCuisine = (cuisineId: string) => {
    setTempPreferences(prev => ({
      ...prev,
      favoriteCuisines: prev.favoriteCuisines.includes(cuisineId)
        ? prev.favoriteCuisines.filter(c => c !== cuisineId)
        : [...prev.favoriteCuisines, cuisineId]
    }));
  };

  const savePreferences = async () => {
    setPreferences(tempPreferences);
    setIsPreferencesModalOpen(false);

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferences: tempPreferences })
      });
    } catch (e) {
      console.error('Error saving preferences:', e);
    }
  };

  // Download reservation as image
  const handleDownloadReservation = async () => {
    if (!reservationCardRef.current || !selectedReservation) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(reservationCardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      link.download = `reservacion-${selectedReservation.id?.slice(-8) || 'qr'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading reservation:', err);
      alert('Error al descargar. Intenta de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
        <p className="text-stone-500">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const getDietLabel = (id: string) => DIET_OPTIONS.find(d => d.id === id);
  const getAllergyLabel = (id: string) => ALLERGY_OPTIONS.find(a => a.id === id);
  const getCuisineLabel = (id: string) => CUISINE_OPTIONS.find(c => c.id === id);

  return (
    <div className="min-h-screen bg-stone-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar with gradient border */}
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full scale-105"></div>
              <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-white shadow-xl relative">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}&backgroundColor=ffdfbf`} />
                <AvatarFallback className="text-3xl bg-orange-200 text-orange-700">{user.name?.[0]}</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">{user.name}</h1>
              <p className="text-orange-100 text-sm mb-3">{user.email}</p>

              {/* Quick Stats */}
              <div className="flex justify-center md:justify-start gap-6 mb-4">
                <div className="text-center">
                  <span className="block text-2xl font-bold">{activeReservations.length + pastReservations.length}</span>
                  <span className="text-xs text-orange-100">Visitas</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold">{favorites.length}</span>
                  <span className="text-xs text-orange-100">Favoritos</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold">{myReviews.length}</span>
                  <span className="text-xs text-orange-100">Reseñas</span>
                </div>
              </div>

              <div className="flex justify-center md:justify-start gap-2 flex-wrap">
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={openEditModal}>
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={openPreferencesModal}>
                  <Settings className="h-4 w-4 mr-1" /> Preferencias
                </Button>
                <Button variant="secondary" size="sm" className="bg-amber-500/50 hover:bg-amber-500/70 text-white border-0" onClick={() => router.push('/loyalty')}>
                  <Star className="h-4 w-4 mr-1" /> Tarjetas
                </Button>
                <Button variant="secondary" size="sm" className="bg-red-500/30 hover:bg-red-500/50 text-white border-0" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Chips */}
      {(preferences.diets.length > 0 || preferences.allergies.length > 0 || preferences.favoriteCuisines.length > 0) && (
        <div className="bg-white border-b border-stone-200 py-3 px-4 overflow-x-auto">
          <div className="max-w-4xl mx-auto flex gap-2 flex-wrap">
            {preferences.diets.map(dietId => {
              const diet = getDietLabel(dietId);
              return diet ? (
                <Badge key={dietId} className={`${diet.color} border font-normal`}>
                  {diet.icon} {diet.label}
                </Badge>
              ) : null;
            })}
            {preferences.allergies.map(allergyId => {
              const allergy = getAllergyLabel(allergyId);
              return allergy ? (
                <Badge key={allergyId} variant="outline" className="bg-red-50 text-red-700 border-red-200 font-normal">
                  ⚠️ {allergy.label}
                </Badge>
              ) : null;
            })}
            {preferences.favoriteCuisines.slice(0, 3).map(cuisineId => {
              const cuisine = getCuisineLabel(cuisineId);
              return cuisine ? (
                <Badge key={cuisineId} variant="outline" className="bg-stone-50 text-stone-600 border-stone-200 font-normal">
                  {cuisine.icon} {cuisine.label}
                </Badge>
              ) : null;
            })}
            {preferences.favoriteCuisines.length > 3 && (
              <Badge variant="outline" className="bg-stone-50 text-stone-500 border-stone-200 font-normal">
                +{preferences.favoriteCuisines.length - 3} más
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-0 md:px-4 py-6">
        <Tabs defaultValue="reservations" className="w-full">
          <TabsList className="w-full h-auto bg-transparent border-b border-stone-200 p-0 justify-start gap-4 md:gap-6 overflow-x-auto px-4 md:px-0 scrollbar-hide">
            <TabsTrigger value="reservations" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none pb-3 px-0 font-medium text-stone-500 data-[state=active]:text-orange-600 text-sm">
              <Calendar className="h-4 w-4 mr-1.5" /> Reservas
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none pb-3 px-0 font-medium text-stone-500 data-[state=active]:text-orange-600 text-sm">
              <History className="h-4 w-4 mr-1.5" /> Historial
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none pb-3 px-0 font-medium text-stone-500 data-[state=active]:text-orange-600 text-sm">
              <Heart className="h-4 w-4 mr-1.5" /> Favoritos
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none pb-3 px-0 font-medium text-stone-500 data-[state=active]:text-orange-600 text-sm">
              <Star className="h-4 w-4 mr-1.5" /> Reseñas
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 px-4 md:px-0">
            <TabsContent value="reservations" className="space-y-4">
              <h3 className="font-bold text-stone-900 mb-4">Próximas Reservas</h3>
              {activeReservations.length > 0 ? activeReservations.map(res => (
                <div key={res.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                    <img src={res.image} className="w-full h-full object-cover" alt={res.restaurantName} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-stone-900 truncate">{res.restaurantName}</h4>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex-shrink-0">Confirmada</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-stone-600 text-sm flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {res.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {res.time}</span>
                      <span className="flex items-center gap-1"><UserIcon className="h-4 w-4" /> {res.people}</span>
                    </div>
                    <Button className="w-full mt-3 bg-stone-900 text-white hover:bg-stone-800" size="sm" onClick={() => { setSelectedReservation(res); setIsQRModalOpen(true); }}>
                      <QrCode className="h-4 w-4 mr-2" /> Ver Código QR
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-stone-200">
                  <Calendar className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 mb-2">No tienes reservas activas</p>
                  <Button variant="link" className="text-orange-600" onClick={() => router.push('/')}>Explorar Restaurantes</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <h3 className="font-bold text-stone-900 mb-4">Donde has comido</h3>
              {pastReservations.length > 0 ? pastReservations.map(res => (
                <div key={res.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-bold text-stone-900">{res.restaurantName}</h4>
                    <span className="text-sm text-stone-500">{res.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < res.rating ? 'text-orange-400 fill-orange-400' : 'text-stone-200'}`} />
                    ))}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-stone-200">
                  <History className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500">Aún no tienes historial de visitas</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="grid grid-cols-2 gap-4">
              {favorites.length > 0 ? favorites.map(fav => (
                <div key={fav.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm cursor-pointer" onClick={() => router.push(`/restaurant/${fav.id}`)}>
                  <div className="h-32 relative">
                    <img src={fav.image} className="w-full h-full object-cover" alt={fav.name} />
                    <button className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500"><Heart className="h-4 w-4 fill-current" /></button>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-stone-900 text-sm">{fav.name}</h4>
                    <p className="text-xs text-stone-500">{fav.cuisine}</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-dashed border-stone-200">
                  <Heart className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 mb-2">No tienes favoritos aún</p>
                  <Button variant="link" className="text-orange-600" onClick={() => router.push('/')}>Descubrir Restaurantes</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {myReviews.length > 0 ? myReviews.map(rev => (
                <div key={rev.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-stone-900">{rev.restaurant}</h4>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'text-orange-400 fill-orange-400' : 'text-stone-200'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-stone-400">{rev.date}</span>
                  </div>
                  <p className="text-stone-600 text-sm italic">"{rev.comment}"</p>
                </div>
              )) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-stone-200">
                  <MessageSquare className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500">No has dejado reseñas todavía</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* QR Modal */}
      <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Tu Reservación">
        {selectedReservation && (
          <div className="space-y-4">
            {/* Downloadable Card */}
            <div
              ref={reservationCardRef}
              className="bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 p-6 rounded-2xl shadow-lg text-white"
            >
              {/* Header */}
              <div className="text-center mb-4">
                <span className="text-2xl">✨</span>
                <h3 className="text-lg font-bold mt-1">Tu Reservación Confirmada</h3>
              </div>

              {/* Restaurant Name */}
              <div className="text-center mb-4">
                <p className="text-xl font-bold">{selectedReservation.restaurantName}</p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl mx-auto w-fit shadow-md">
                <QRCodeSVG
                  value={`RES-${selectedReservation.id}`}
                  size={160}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#1c1917"
                />
              </div>

              {/* Reservation Code */}
              <p className="text-center font-mono text-lg mt-3 font-bold tracking-wider">
                RES-{selectedReservation.id?.slice(-8)?.toUpperCase()}
              </p>

              {/* Details */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="font-medium">{user?.name || 'Cliente'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{selectedReservation.date}</span>
                  <span className="mx-1">•</span>
                  <Clock className="h-4 w-4" />
                  <span>{selectedReservation.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{selectedReservation.people} personas</span>
                </div>
              </div>

              {/* Friendly Message */}
              <div className="text-center mt-4 pt-4 border-t border-white/30">
                <p className="text-sm font-medium">🍽️ ¡Te esperamos con gusto!</p>
                <p className="text-xs opacity-90 mt-1">Muestra esta tarjeta al llegar</p>
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownloadReservation}
              disabled={isDownloading}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white py-6 text-lg"
            >
              {isDownloading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              {isDownloading ? 'Descargando...' : 'Descargar Reservación'}
            </Button>

            <p className="text-xs text-stone-400 text-center">
              💡 Descarga tu reservación para tenerla lista sin internet
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Perfil">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700 mb-1 block">Nombre</label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700 mb-1 block">Teléfono</label>
            <Input
              value={editForm.phone}
              onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Tu teléfono"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700 mb-1 block">Bio</label>
            <Input
              value={editForm.bio}
              onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value.slice(0, 140) }))}
              placeholder="Cuéntanos sobre ti..."
              maxLength={140}
            />
            <p className="text-xs text-stone-400 mt-1">{editForm.bio.length}/140</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preferences Modal */}
      <Modal isOpen={isPreferencesModalOpen} onClose={() => setIsPreferencesModalOpen(false)} title="Mis Preferencias">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Diets */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-600" /> Dietas
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {DIET_OPTIONS.map(diet => (
                <button
                  key={diet.id}
                  onClick={() => toggleDiet(diet.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${tempPreferences.diets.includes(diet.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-stone-200 hover:border-stone-300'
                    }`}
                >
                  <span className="text-xl mr-2">{diet.icon}</span>
                  <span className="text-sm font-medium">{diet.label}</span>
                  {tempPreferences.diets.includes(diet.id) && (
                    <Check className="h-4 w-4 text-green-600 inline ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" /> Alergias
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {ALLERGY_OPTIONS.map(allergy => (
                <button
                  key={allergy.id}
                  onClick={() => toggleAllergy(allergy.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${tempPreferences.allergies.includes(allergy.id)
                    ? 'border-red-500 bg-red-50'
                    : 'border-stone-200 hover:border-stone-300'
                    }`}
                >
                  <span className="text-xl mr-2">{allergy.icon}</span>
                  <span className="text-sm font-medium">{allergy.label}</span>
                  {tempPreferences.allergies.includes(allergy.id) && (
                    <Check className="h-4 w-4 text-red-600 inline ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Spice Level */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-600" /> Nivel de Picante
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {SPICE_LEVELS.map(level => (
                <button
                  key={level.id}
                  onClick={() => setTempPreferences(prev => ({ ...prev, spiceLevel: level.id as any }))}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${tempPreferences.spiceLevel === level.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-stone-200 hover:border-stone-300'
                    }`}
                >
                  <span className="block text-xl mb-1">{level.icon}</span>
                  <span className="text-xs font-medium">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Favorite Cuisines */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Utensils className="h-4 w-4 text-amber-600" /> Cocinas Favoritas
            </h4>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map(cuisine => (
                <button
                  key={cuisine.id}
                  onClick={() => toggleCuisine(cuisine.id)}
                  className={`px-3 py-2 rounded-full border-2 text-sm transition-all ${tempPreferences.favoriteCuisines.includes(cuisine.id)
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-stone-200 hover:border-stone-300 text-stone-600'
                    }`}
                >
                  {cuisine.icon} {cuisine.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
            <Button variant="outline" className="flex-1" onClick={() => setIsPreferencesModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={savePreferences}>
              <Check className="h-4 w-4 mr-2" /> Guardar Preferencias
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-stone-200 px-6 py-3 md:hidden flex justify-around items-center z-50">
        <div className="flex flex-col items-center gap-1 text-stone-400" onClick={() => router.push('/')}>
          <Utensils className="h-6 w-6" />
          <span className="text-[10px]">Descubrir</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-orange-600">
          <UserIcon className="h-6 w-6" />
          <span className="text-[10px] font-bold">Perfil</span>
        </div>
      </nav>
    </div>
  );
}