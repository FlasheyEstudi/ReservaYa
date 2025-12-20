'use client';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Building2, Phone, MapPin, Clock, Calendar, Camera, Eye, X, Plus, Trash2, Image, Grid3X3, Star, MessageCircle, ThumbsUp, ThumbsDown, QrCode, Navigation } from 'lucide-react';
import QRMenuGenerator from '@/components/menu/QRMenuGenerator';
import MapDirectionsBtn from '@/components/ui/MapDirectionsBtn';

interface RestaurantProfile {
    name: string;
    description: string;
    phone: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    email: string;
    website: string;
    logo: string;
    coverImage: string;
    gallery: string[];
    tableTime: number;
    schedule: { day: string; open: string; close: string; closed: boolean }[];
}

interface TableStatus {
    id: string;
    number: string;
    capacity: number;
    status: 'free' | 'occupied' | 'reserved' | 'maintenance';
}

interface Review {
    id: string;
    customerName: string;
    rating: number;
    comment: string;
    date: string;
    response?: string;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function ManageSettings() {
    const [profile, setProfile] = useState<RestaurantProfile>({
        name: 'Mi Restaurante',
        description: 'Un lugar acogedor con la mejor comida de la ciudad. Ambiente familiar y servicio de primera.',
        phone: '(555) 123-4567',
        address: 'Av. Principal 123, Col. Centro',
        latitude: null,
        longitude: null,
        email: 'contacto@mirestaurante.com',
        website: 'www.mirestaurante.com',
        logo: '',
        coverImage: '',
        gallery: [],
        tableTime: 90,
        schedule: DAYS.map(day => ({ day, open: '12:00', close: '22:00', closed: false }))
    });
    const [tables, setTables] = useState<TableStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'hours' | 'tables' | 'reviews' | 'qr' | 'preview'>('profile');
    const [reviews, setReviews] = useState<Review[]>([]);

    const [showSpecialHoursModal, setShowSpecialHoursModal] = useState(false);
    const [specialHours, setSpecialHours] = useState<{ date: string; open: string; close: string; closed: boolean; name: string }[]>([]);
    const [newSpecialHour, setNewSpecialHour] = useState({ date: '', open: '12:00', close: '22:00', closed: false, name: '' });
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [responseText, setResponseText] = useState('');
    const [toast, setToast] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            return;
        }


        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

            // Fetch restaurant settings
            const settingsRes = await fetch(`${API_URL}/restaurant/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (settingsRes.ok) {
                const data = await settingsRes.json();
                // Merge API data but keep localStorage images if API doesn't have them
                setProfile(prev => ({
                    ...prev,
                    name: data.restaurant?.name || prev.name,
                    address: data.restaurant?.address || prev.address,
                    latitude: data.settings?.latitude ?? data.restaurant?.latitude ?? prev.latitude,
                    longitude: data.settings?.longitude ?? data.restaurant?.longitude ?? prev.longitude,
                    ...data.settings,
                    // Keep localStorage images if API doesn't provide them
                    logo: data.settings?.logo || prev.logo,
                    coverImage: data.settings?.coverImage || prev.coverImage,
                    gallery: data.settings?.gallery?.length ? data.settings.gallery : prev.gallery
                }));
            }


            // Fetch tables for real-time status
            const tablesRes = await fetch(`${API_URL}/restaurant/layout`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (tablesRes.ok) {
                const data = await tablesRes.json();
                const tablesData = (data.tables || []).map((t: any) => ({
                    id: t.id,
                    number: t.tableNumber || t.number || `M${t.id.slice(-2)}`,
                    capacity: t.capacity || 4,
                    status: t.currentStatus || t.status || 'free'
                }));
                setTables(tablesData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'coverImage' | 'gallery') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            if (field === 'gallery') {
                setProfile(prev => ({ ...prev, gallery: [...prev.gallery, base64] }));
            } else {
                setProfile(prev => ({ ...prev, [field]: base64 }));
            }
        };
        reader.readAsDataURL(file);
    };

    const removeGalleryImage = (index: number) => {
        setProfile(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
    };

    const updateSchedule = (index: number, field: string, value: string | boolean) => {
        setProfile(prev => ({
            ...prev,
            schedule: prev.schedule.map((s, i) => i === index ? { ...s, [field]: value } : s)
        }));
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleAddSpecialHour = () => {
        if (!newSpecialHour.date || !newSpecialHour.name) {
            showToast('Por favor completa la fecha y nombre');
            return;
        }
        setSpecialHours(prev => [...prev, { ...newSpecialHour }]);
        setNewSpecialHour({ date: '', open: '12:00', close: '22:00', closed: false, name: '' });
        setShowSpecialHoursModal(false);
        showToast('Horario especial agregado');
    };

    const handleRemoveSpecialHour = (index: number) => {
        setSpecialHours(prev => prev.filter((_, i) => i !== index));
        showToast('Horario especial eliminado');
    };

    const handleRespondReview = () => {
        if (!selectedReview || !responseText.trim()) return;
        setReviews(prev => prev.map(r =>
            r.id === selectedReview.id ? { ...r, response: responseText } : r
        ));
        setShowResponseModal(false);
        setSelectedReview(null);
        setResponseText('');
        showToast('Respuesta publicada');
    };

    const openResponseModal = (review: Review) => {
        setSelectedReview(review);
        setResponseText(review.response || '');
        setShowResponseModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('token');

        if (!token) {
            showToast('Error: No hay sesión activa');
            setSaving(false);
            return;
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/restaurant/settings`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: profile.name,
                    address: profile.address,
                    settings: {
                        phone: profile.phone,
                        email: profile.email,
                        website: profile.website,
                        description: profile.description,
                        latitude: profile.latitude,
                        longitude: profile.longitude,
                        tableTime: profile.tableTime,
                        schedule: profile.schedule,
                        logo: profile.logo,
                        coverImage: profile.coverImage,
                        gallery: profile.gallery
                    }
                })
            });

            if (res.ok) {
                showToast('Perfil guardado exitosamente');
            } else {
                showToast('Error al guardar en el servidor');
            }
        } catch (error) {
            console.error('Error saving:', error);
            showToast('Error de conexión al servidor');
        } finally {
            setSaving(false);
        }
    };



    const getStatusColor = (status: string) => {
        switch (status) {
            case 'free': return 'bg-emerald-100 border-emerald-400 text-emerald-700';
            case 'occupied': return 'bg-red-100 border-red-400 text-red-700';
            case 'reserved': return 'bg-blue-100 border-blue-400 text-blue-700';
            case 'maintenance': return 'bg-stone-200 border-stone-400 text-stone-600';
            default: return 'bg-stone-100 border-stone-300 text-stone-600';
        }
    };

    const tableStats = {
        total: tables.length,
        free: tables.filter(t => t.status === 'free').length,
        occupied: tables.filter(t => t.status === 'occupied').length,
        reserved: tables.filter(t => t.status === 'reserved').length,
    };

    if (loading) {
        return <ManageLayout title="Configuración" subtitle=""><div className="text-center py-12 text-stone-400">Cargando...</div></ManageLayout>;
    }

    return (
        <ManageLayout title="Configuración" subtitle="Perfil del restaurante y ajustes">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'profile', label: 'Perfil', icon: Building2 },
                    { id: 'hours', label: 'Horarios', icon: Clock },
                    { id: 'tables', label: 'Mesas', icon: Grid3X3 },
                    { id: 'reviews', label: 'Reseñas', icon: MessageCircle },
                    { id: 'qr', label: 'Menú QR', icon: QrCode },
                    { id: 'preview', label: 'Vista Previa', icon: Eye },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    {/* Logo and Cover */}
                    <Card className="border-stone-200">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5 text-emerald-600" /> Imágenes</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">Logo del Restaurante</label>
                                <div className="flex items-center gap-4">
                                    {profile.logo ? (
                                        <img src={profile.logo} alt="Logo" className="w-24 h-24 object-cover rounded-xl border-2 border-stone-200" />
                                    ) : (
                                        <div className="w-24 h-24 bg-stone-100 rounded-xl flex items-center justify-center border-2 border-dashed border-stone-300">
                                            <Building2 className="h-8 w-8 text-stone-400" />
                                        </div>
                                    )}
                                    <div>
                                        <input type="file" accept="image/*" id="logo-upload" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                                        <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-sm font-medium text-stone-700">
                                            <Camera className="h-4 w-4" /> Subir Logo
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Cover */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">Imagen de Portada</label>
                                {profile.coverImage ? (
                                    <div className="relative">
                                        <img src={profile.coverImage} alt="Cover" className="w-full h-48 object-cover rounded-xl" />
                                        <button onClick={() => setProfile(p => ({ ...p, coverImage: '' }))} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full h-48 bg-stone-100 rounded-xl flex items-center justify-center border-2 border-dashed border-stone-300">
                                        <div className="text-center">
                                            <Image className="h-12 w-12 text-stone-400 mx-auto mb-2" />
                                            <input type="file" accept="image/*" id="cover-upload" className="hidden" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                                            <label htmlFor="cover-upload" className="cursor-pointer text-sm font-medium text-emerald-600 hover:text-emerald-700">Subir imagen de portada</label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Gallery */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">Galería de Fotos</label>
                                <div className="flex flex-wrap gap-3">
                                    {profile.gallery.map((img, i) => (
                                        <div key={i} className="relative">
                                            <img src={img} alt={`Gallery ${i}`} className="w-24 h-24 object-cover rounded-lg" />
                                            <button onClick={() => removeGalleryImage(i)} className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="w-24 h-24 bg-stone-100 rounded-lg flex items-center justify-center border-2 border-dashed border-stone-300 cursor-pointer hover:bg-stone-200">
                                        <input type="file" accept="image/*" id="gallery-upload" className="hidden" onChange={(e) => handleImageUpload(e, 'gallery')} />
                                        <label htmlFor="gallery-upload" className="cursor-pointer flex flex-col items-center">
                                            <Plus className="h-6 w-6 text-stone-400" />
                                            <span className="text-xs text-stone-400">Agregar</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Business Info */}
                    <Card className="border-stone-200">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-emerald-600" /> Información</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label>
                                    <Input value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Teléfono</label>
                                    <Input value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Descripción</label>
                                <textarea value={profile.description} onChange={(e) => setProfile(p => ({ ...p, description: e.target.value }))} className="w-full p-3 border border-stone-200 rounded-lg resize-none h-24" placeholder="Describe tu restaurante..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                                    <Input value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Sitio Web</label>
                                    <Input value={profile.website} onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Dirección</label>
                                <Input value={profile.address} onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Card */}
                    <Card className="border-stone-200">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Navigation className="h-5 w-5 text-blue-600" /> Ubicación GPS</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-stone-500">Ingresa las coordenadas de tu restaurante para que los clientes puedan encontrarte fácilmente con navegación GPS.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Latitud</label>
                                    <Input
                                        type="number"
                                        step="any"
                                        placeholder="ej: 19.4326"
                                        value={profile.latitude ?? ''}
                                        onChange={(e) => setProfile(p => ({ ...p, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Longitud</label>
                                    <Input
                                        type="number"
                                        step="any"
                                        placeholder="ej: -99.1332"
                                        value={profile.longitude ?? ''}
                                        onChange={(e) => setProfile(p => ({ ...p, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                                    />
                                </div>
                            </div>
                            {profile.latitude && profile.longitude && (
                                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-blue-800">Ubicación configurada</p>
                                        <p className="text-xs text-blue-600 font-mono">{profile.latitude}, {profile.longitude}</p>
                                    </div>
                                    <MapDirectionsBtn
                                        latitude={profile.latitude}
                                        longitude={profile.longitude}
                                        restaurantName={profile.name}
                                        variant="outline"
                                    />
                                </div>
                            )}
                            <p className="text-xs text-stone-400">Puedes obtener las coordenadas buscando tu dirección en Google Maps y copiando los números de la URL.</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Hours Tab */}
            {activeTab === 'hours' && (
                <Card className="border-stone-200">
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-emerald-600" /> Horarios de Operación</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {profile.schedule.map((day, i) => (
                                <div key={day.day} className={`flex items-center gap-4 p-3 rounded-lg ${day.closed ? 'bg-red-50' : 'bg-stone-50'}`}>
                                    <div className="w-28"><span className={`font-medium ${day.closed ? 'text-red-600' : 'text-stone-700'}`}>{day.day}</span></div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={day.closed} onChange={(e) => updateSchedule(i, 'closed', e.target.checked)} className="rounded border-stone-300" />
                                        <span className="text-sm text-stone-500">Cerrado</span>
                                    </label>
                                    {!day.closed && (
                                        <>
                                            <Input type="time" value={day.open} onChange={(e) => updateSchedule(i, 'open', e.target.value)} className="w-32" />
                                            <span className="text-stone-400">—</span>
                                            <Input type="time" value={day.close} onChange={(e) => updateSchedule(i, 'close', e.target.value)} className="w-32" />
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-stone-700 mb-2">Tiempo promedio por mesa (minutos)</label>
                            <Input type="number" value={profile.tableTime} onChange={(e) => setProfile(p => ({ ...p, tableTime: parseInt(e.target.value) || 90 }))} className="w-40" />
                        </div>

                        {/* Special Hours */}
                        <div className="mt-6 pt-6 border-t border-stone-200">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-stone-700">Horarios Especiales</h4>
                                <Button onClick={() => setShowSpecialHoursModal(true)} variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-1" /> Agregar
                                </Button>
                            </div>
                            {specialHours.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-4">No hay horarios especiales configurados</p>
                            ) : (
                                <div className="space-y-2">
                                    {specialHours.map((sh, i) => (
                                        <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${sh.closed ? 'bg-red-50' : 'bg-amber-50'}`}>
                                            <div>
                                                <p className="font-medium text-stone-700">{sh.name}</p>
                                                <p className="text-xs text-stone-500">{sh.date} • {sh.closed ? 'Cerrado' : `${sh.open} - ${sh.close}`}</p>
                                            </div>
                                            <button onClick={() => handleRemoveSpecialHour(i)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}


            {/* Tables Tab */}
            {activeTab === 'tables' && (
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-stone-100 text-stone-700"><p className="text-2xl font-bold">{tableStats.total}</p><p className="text-sm">Total</p></div>
                        <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700"><p className="text-2xl font-bold">{tableStats.free}</p><p className="text-sm">Libres</p></div>
                        <div className="p-4 rounded-xl bg-red-100 text-red-700"><p className="text-2xl font-bold">{tableStats.occupied}</p><p className="text-sm">Ocupadas</p></div>
                        <div className="p-4 rounded-xl bg-blue-100 text-blue-700"><p className="text-2xl font-bold">{tableStats.reserved}</p><p className="text-sm">Reservadas</p></div>
                    </div>

                    {/* Tables Grid */}
                    <Card className="border-stone-200">
                        <CardHeader><CardTitle className="text-lg">Estado de Mesas (Tiempo Real)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-6 gap-4">
                                {tables.map(table => (
                                    <div key={table.id} className={`p-4 rounded-xl border-2 text-center ${getStatusColor(table.status)}`}>
                                        <div className="font-bold text-lg">{table.number}</div>
                                        <div className="text-sm">{table.capacity}p</div>
                                        <div className="text-xs mt-1 capitalize">{table.status === 'free' ? 'Libre' : table.status === 'occupied' ? 'Ocupada' : table.status === 'reserved' ? 'Reservada' : 'Mantto'}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-amber-100 text-amber-700">
                            <p className="text-2xl font-bold flex items-center gap-1">
                                {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                                <Star className="h-5 w-5 fill-current" />
                            </p>
                            <p className="text-sm">Promedio</p>
                        </div>
                        <div className="p-4 rounded-xl bg-stone-100 text-stone-700">
                            <p className="text-2xl font-bold">{reviews.length}</p>
                            <p className="text-sm">Total Reseñas</p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700">
                            <p className="text-2xl font-bold">{reviews.filter(r => r.rating >= 4).length}</p>
                            <p className="text-sm">Positivas (4-5★)</p>
                        </div>
                        <div className="p-4 rounded-xl bg-red-100 text-red-700">
                            <p className="text-2xl font-bold">{reviews.filter(r => r.rating <= 2).length}</p>
                            <p className="text-sm">Negativas (1-2★)</p>
                        </div>
                    </div>

                    {/* Reviews List */}
                    <Card className="border-stone-200">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MessageCircle className="h-5 w-5 text-emerald-600" /> Reseñas de Clientes</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {reviews.map(review => (
                                <div key={review.id} className="p-4 bg-stone-50 rounded-xl">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-medium text-stone-800">{review.customerName}</p>
                                            <p className="text-xs text-stone-400">{review.date}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-stone-600 text-sm">{review.comment}</p>

                                    {review.response ? (
                                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-emerald-600 font-medium mb-1">Tu respuesta:</p>
                                                <button onClick={() => openResponseModal(review)} className="text-xs text-emerald-600 hover:underline">Editar</button>
                                            </div>
                                            <p className="text-sm text-stone-600">{review.response}</p>
                                        </div>
                                    ) : (
                                        <button onClick={() => openResponseModal(review)} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                            <MessageCircle className="h-4 w-4" /> Responder
                                        </button>
                                    )}

                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* QR Menu Tab */}
            {activeTab === 'qr' && (
                <div className="space-y-6">
                    <QRMenuGenerator
                        restaurantId={localStorage.getItem('restaurantId') || ''}
                        restaurantName={profile.name}
                    />

                    <Card className="border-stone-200">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-purple-600" />
                                ¿Cómo funciona?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-purple-50 rounded-xl">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                                        <span className="text-lg font-bold text-purple-600">1</span>
                                    </div>
                                    <h4 className="font-medium text-stone-800 mb-1">Descarga el QR</h4>
                                    <p className="text-sm text-stone-600">Haz clic en "Descargar QR" para obtener la imagen del código</p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-xl">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                                        <span className="text-lg font-bold text-purple-600">2</span>
                                    </div>
                                    <h4 className="font-medium text-stone-800 mb-1">Imprímelo</h4>
                                    <p className="text-sm text-stone-600">Coloca el código QR en las mesas o en la entrada del restaurante</p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-xl">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                                        <span className="text-lg font-bold text-purple-600">3</span>
                                    </div>
                                    <h4 className="font-medium text-stone-800 mb-1">Clientes escanean</h4>
                                    <p className="text-sm text-stone-600">Los clientes escanean y ven tu menú actualizado en su celular</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
                    {/* Cover */}
                    <div className="h-64 bg-gradient-to-br from-emerald-600 to-emerald-800 relative">
                        {profile.coverImage && <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />}
                        {/* Logo */}
                        <div className="absolute -bottom-12 left-8">
                            {profile.logo ? (
                                <img src={profile.logo} alt="Logo" className="w-24 h-24 object-cover rounded-xl border-4 border-white shadow-lg" />
                            ) : (
                                <div className="w-24 h-24 bg-emerald-600 rounded-xl border-4 border-white shadow-lg flex items-center justify-center">
                                    <Building2 className="h-10 w-10 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="pt-16 px-8 pb-8">
                        <h1 className="text-3xl font-bold text-stone-800">{profile.name}</h1>
                        <p className="text-stone-500 mt-2">{profile.description}</p>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="flex items-center gap-2 text-stone-600"><Phone className="h-5 w-5 text-emerald-600" /> {profile.phone}</div>
                            <div className="flex items-center gap-2 text-stone-600"><MapPin className="h-5 w-5 text-emerald-600" /> {profile.address}</div>
                        </div>

                        {/* Tables Preview */}
                        <div className="mt-8 p-6 bg-stone-50 rounded-xl">
                            <h3 className="font-semibold text-stone-800 mb-4">Disponibilidad de Mesas</h3>
                            <div className="flex gap-6">
                                <div className="text-center"><div className="text-3xl font-bold text-emerald-600">{tableStats.free}</div><div className="text-sm text-stone-500">Disponibles</div></div>
                                <div className="text-center"><div className="text-3xl font-bold text-stone-400">{tableStats.total}</div><div className="text-sm text-stone-500">Total</div></div>
                            </div>
                        </div>

                        {/* Gallery Preview */}
                        {profile.gallery.length > 0 && (
                            <div className="mt-8">
                                <h3 className="font-semibold text-stone-800 mb-4">Galería</h3>
                                <div className="flex gap-3 overflow-x-auto">
                                    {profile.gallery.map((img, i) => (
                                        <img key={i} src={img} alt={`Gallery ${i}`} className="w-32 h-32 object-cover rounded-xl flex-shrink-0" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Save */}
            <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                    <Save className="h-4 w-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            {/* Special Hours Modal */}
            {showSpecialHoursModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Agregar Horario Especial</h2>
                            <button onClick={() => setShowSpecialHoursModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Nombre del día especial</label>
                                <Input value={newSpecialHour.name} onChange={(e) => setNewSpecialHour(p => ({ ...p, name: e.target.value }))} placeholder="Nochebuena, Día de las Madres, etc." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Fecha</label>
                                <Input type="date" value={newSpecialHour.date} onChange={(e) => setNewSpecialHour(p => ({ ...p, date: e.target.value }))} />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={newSpecialHour.closed} onChange={(e) => setNewSpecialHour(p => ({ ...p, closed: e.target.checked }))} className="rounded border-stone-300" />
                                <span className="text-sm text-stone-600">Cerrado este día</span>
                            </label>
                            {!newSpecialHour.closed && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Apertura</label>
                                        <Input type="time" value={newSpecialHour.open} onChange={(e) => setNewSpecialHour(p => ({ ...p, open: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Cierre</label>
                                        <Input type="time" value={newSpecialHour.close} onChange={(e) => setNewSpecialHour(p => ({ ...p, close: e.target.value }))} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowSpecialHoursModal(false)} className="flex-1">Cancelar</Button>
                            <Button onClick={handleAddSpecialHour} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Agregar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Response Modal */}
            {showResponseModal && selectedReview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">{selectedReview.response ? 'Editar Respuesta' : 'Responder Reseña'}</h2>
                            <button onClick={() => { setShowResponseModal(false); setSelectedReview(null); }} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="mb-4 p-4 bg-stone-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-stone-800">{selectedReview.customerName}</p>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`h-3 w-3 ${star <= selectedReview.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-stone-600">{selectedReview.comment}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Tu respuesta</label>
                            <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                className="w-full p-3 border border-stone-200 rounded-lg h-32 resize-none"
                                placeholder="Escribe tu respuesta al cliente..."
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => { setShowResponseModal(false); setSelectedReview(null); }} className="flex-1">Cancelar</Button>
                            <Button onClick={handleRespondReview} disabled={!responseText.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Publicar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-4 right-4 bg-stone-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
                    {toast}
                </div>
            )}
        </ManageLayout>

    );
}
