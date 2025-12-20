'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Search, Ban, CheckCircle, Eye, Trash2, MapPin, X, Edit, Save, Plus, Star, Image, Menu, Users, Grid3X3, Settings,
  Package, CalendarDays, UtensilsCrossed, BarChart3, Megaphone, ClipboardList, Award, Truck, Navigation
} from 'lucide-react';
import MapDirectionsBtn from '@/components/ui/MapDirectionsBtn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Restaurant {
  id: string;
  name: string;
  businessCode: string;
  address: string | null;
  status: string;
  createdAt: string;
  manager: { email: string; fullName: string | null } | null;
  stats: { tables: number; employees: number; reservations: number; orders: number; revenue: number };
}

interface RestaurantDetail {
  id: string;
  name: string;
  businessCode: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  config: any;
  manager: { id: string; email: string; fullName: string | null } | null;
  tables: { id: string; number: string; capacity: number; status: string }[];
  employees: { id: string; user: { fullName: string | null; email: string }; role: string }[];
  menu: { id: string; name: string; price: number; category: string }[];
  reviews: { id: string; rating: number; comment: string | null; user: { fullName: string | null } }[];
  _count: { reservations: number; orders: number; reviews: number };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const MODULES = [
  { id: 'orders', label: 'Órdenes', Icon: Package },
  { id: 'reservations', label: 'Reservaciones', Icon: CalendarDays },
  { id: 'menu', label: 'Menú Digital', Icon: UtensilsCrossed },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'marketing', label: 'Marketing', Icon: Megaphone },
  { id: 'inventory', label: 'Inventario', Icon: ClipboardList },
  { id: 'loyalty', label: 'Programa Lealtad', Icon: Award },
  { id: 'delivery', label: 'Delivery', Icon: Truck },
];

export default function AdminRestaurants() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantDetail | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', address: '' });
  const [createForm, setCreateForm] = useState({ name: '', address: '', managerEmail: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'menu' | 'reviews' | 'tables' | 'gallery' | 'permissions'>('info');
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set(['orders', 'reservations', 'menu']));

  // Sample gallery images (placeholders)
  const galleryImages = [
    { id: '1', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop', alt: 'Interior' },
    { id: '2', url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop', alt: 'Platos' },
    { id: '3', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', alt: 'Ambiente' },
    { id: '4', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop', alt: 'Cocina' },
    { id: '5', url: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400&h=300&fit=crop', alt: 'Exterior' },
    { id: '6', url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop', alt: 'Terraza' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (!token || userRole !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    fetchRestaurants(token);
  }, [router]);

  const fetchRestaurants = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/restaurants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data.restaurants);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestaurantDetail = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/admin/restaurants/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedRestaurant(data.restaurant);
        setEditForm({ name: data.restaurant.name, address: data.restaurant.address || '' });
        // Parse config for modules
        try {
          const config = typeof data.restaurant.config === 'string' ? JSON.parse(data.restaurant.config) : data.restaurant.config;
          if (config.modules) setEnabledModules(new Set(config.modules));
        } catch { /* default modules */ }
        setActiveTab('info');
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
  };

  const handleCreateRestaurant = async () => {
    const token = localStorage.getItem('token');
    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/admin/restaurants`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      if (response.ok) {
        setShowCreateModal(false);
        setCreateForm({ name: '', address: '', managerEmail: '' });
        fetchRestaurants(token!);
      }
    } catch (err) {
      console.error('Failed to create:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (restaurantId: string, newStatus: string) => {
    setActionLoading(restaurantId);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/admin/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRestaurant) return;
    const token = localStorage.getItem('token');
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/admin/restaurants/${selectedRestaurant.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        setSelectedRestaurant(prev => prev ? { ...prev, ...editForm } : null);
        setRestaurants(prev => prev.map(r => r.id === selectedRestaurant.id ? { ...r, ...editForm } : r));
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModules = async () => {
    if (!selectedRestaurant) return;
    const token = localStorage.getItem('token');
    setIsSaving(true);
    try {
      const config = JSON.stringify({ modules: Array.from(enabledModules) });
      const response = await fetch(`${API_URL}/admin/restaurants/${selectedRestaurant.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      if (response.ok) {
        alert('Permisos guardados correctamente');
        setSelectedRestaurant(null); // Close modal
        fetchRestaurants(token!); // Refresh list
      } else {
        alert('Error al guardar permisos');
      }
    } catch (err) {
      console.error('Failed to save modules:', err);
      alert('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setEnabledModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) newSet.delete(moduleId);
      else newSet.add(moduleId);
      return newSet;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = localStorage.getItem('token');
    setActionLoading(deleteTarget.id);
    try {
      const response = await fetch(`${API_URL}/admin/restaurants/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setRestaurants(prev => prev.filter(r => r.id !== deleteTarget.id));
        setShowDeleteModal(false);
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(value);
  const filteredRestaurants = restaurants.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.businessCode.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div></div>;
  }

  return (
    <AdminLayout title="Restaurantes" subtitle="Gestión completa de restaurantes">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
          <CardContent className="p-4"><p className="text-2xl font-semibold text-stone-800">{restaurants.length}</p><p className="text-stone-500 text-sm">Total</p></CardContent>
        </Card>
        <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
          <CardContent className="p-4"><p className="text-2xl font-semibold text-green-600">{restaurants.filter(r => r.status === 'active').length}</p><p className="text-stone-500 text-sm">Activos</p></CardContent>
        </Card>
        <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
          <CardContent className="p-4"><p className="text-2xl font-semibold text-orange-600">{restaurants.filter(r => r.status === 'suspended').length}</p><p className="text-stone-500 text-sm">Suspendidos</p></CardContent>
        </Card>
        <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
          <CardContent className="p-4"><p className="text-2xl font-semibold text-stone-800">{formatCurrency(restaurants.reduce((sum, r) => sum + r.stats.revenue, 0))}</p><p className="text-stone-500 text-sm">Ingresos</p></CardContent>
        </Card>
        <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
          <CardContent className="p-4"><Button onClick={() => setShowCreateModal(true)} className="w-full bg-orange-500 hover:bg-orange-600"><Plus className="h-4 w-4 mr-2" />Crear</Button></CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-white border border-stone-200">
        <CardHeader className="border-b border-stone-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-stone-800">Lista de Restaurantes</CardTitle>
            <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64 border-stone-200" /></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Restaurante</th>
                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Estado</th>
                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Stats</th>
                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-semibold">{restaurant.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-stone-800">{restaurant.name}</p>
                        <p className="text-stone-400 text-sm">{restaurant.businessCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${restaurant.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${restaurant.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                      {restaurant.status === 'active' ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3 text-sm text-stone-500">
                      <span>🪑 {restaurant.stats.tables}</span>
                      <span>📦 {restaurant.stats.orders}</span>
                      <span>💰 {formatCurrency(restaurant.stats.revenue)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-orange-50 rounded-lg" onClick={() => fetchRestaurantDetail(restaurant.id)}><Eye className="h-4 w-4 text-orange-500" /></button>
                      {restaurant.status === 'active' ? (
                        <button className="p-2 hover:bg-orange-50 rounded-lg" onClick={() => handleStatusChange(restaurant.id, 'suspended')} disabled={actionLoading === restaurant.id}><Ban className="h-4 w-4 text-orange-500" /></button>
                      ) : (
                        <button className="p-2 hover:bg-green-50 rounded-lg" onClick={() => handleStatusChange(restaurant.id, 'active')} disabled={actionLoading === restaurant.id}><CheckCircle className="h-4 w-4 text-green-500" /></button>
                      )}
                      <button className="p-2 hover:bg-red-50 rounded-lg" onClick={() => { setDeleteTarget(restaurant); setShowDeleteModal(true); }}><Trash2 className="h-4 w-4 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRestaurants.length === 0 && <div className="text-center py-12 text-stone-400">No se encontraron restaurantes</div>}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800">Crear Restaurante</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-stone-100 rounded-lg"><X className="h-5 w-5 text-stone-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="text-sm font-medium text-stone-700">Nombre *</label><Input value={createForm.name} onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nombre" className="mt-1" /></div>
              <div><label className="text-sm font-medium text-stone-700">Dirección</label><Input value={createForm.address} onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Dirección" className="mt-1" /></div>
              <div><label className="text-sm font-medium text-stone-700">Email Manager</label><Input value={createForm.managerEmail} onChange={(e) => setCreateForm(prev => ({ ...prev, managerEmail: e.target.value }))} placeholder="manager@email.com" className="mt-1" /></div>
            </div>
            <div className="p-5 border-t border-stone-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleCreateRestaurant} disabled={!createForm.name || isCreating}>{isCreating ? 'Creando...' : 'Crear'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Profile Modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Cover */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500 flex items-end">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="p-4 flex gap-2 z-10">
                  <span className="bg-white/20 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">🍽️ Menu</span>
                  <span className="bg-white/20 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">⭐ {selectedRestaurant._count.reviews} reseñas</span>
                  <span className="bg-white/20 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">🪑 {selectedRestaurant.tables.length} mesas</span>
                </div>
              </div>
              <div className="absolute -bottom-10 left-6">
                <div className="w-20 h-20 bg-white rounded-xl border-4 border-white shadow-lg flex items-center justify-center text-orange-600 text-2xl font-bold">{selectedRestaurant.name.charAt(0)}</div>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                {!isEditing ? <button onClick={() => setIsEditing(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"><Edit className="h-4 w-4 text-white" /></button>
                  : <button onClick={handleSaveEdit} disabled={isSaving} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg"><Save className="h-4 w-4 text-white" /></button>}
                <button onClick={() => { setSelectedRestaurant(null); setIsEditing(false); }} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"><X className="h-5 w-5 text-white" /></button>
              </div>
            </div>

            {/* Info */}
            <div className="pt-14 px-6 pb-4">
              {isEditing ? (
                <div className="space-y-3">
                  <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nombre" className="text-xl font-bold" />
                  <Input value={editForm.address} onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Dirección" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-stone-800">{selectedRestaurant.name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedRestaurant.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>{selectedRestaurant.status}</span>
                  </div>
                  <code className="text-sm text-stone-500 bg-stone-100 px-2 py-1 rounded">{selectedRestaurant.businessCode}</code>
                  {selectedRestaurant.address && <p className="mt-2 text-stone-600 flex items-center gap-1"><MapPin className="h-4 w-4" />{selectedRestaurant.address}</p>}
                  {selectedRestaurant.latitude && selectedRestaurant.longitude && (
                    <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Navigation className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 font-mono">{selectedRestaurant.latitude}, {selectedRestaurant.longitude}</p>
                      </div>
                      <MapDirectionsBtn
                        latitude={selectedRestaurant.latitude}
                        longitude={selectedRestaurant.longitude}
                        restaurantName={selectedRestaurant.name}
                        variant="ghost"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="border-y border-stone-100">
              <div className="flex overflow-x-auto">
                {([
                  { key: 'info', label: 'Info', icon: '📋' },
                  { key: 'menu', label: 'Menú', icon: '🍽️' },
                  { key: 'reviews', label: 'Reseñas', icon: '⭐' },
                  { key: 'tables', label: 'Mesas', icon: '🪑' },
                  { key: 'gallery', label: 'Galería', icon: '📷' },
                  { key: 'permissions', label: 'Permisos', icon: '⚙️' }
                ] as const).map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-stone-500'}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-5 max-h-80 overflow-y-auto">
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-stone-50 rounded-lg p-4 text-center"><p className="text-xl font-bold text-blue-600">{selectedRestaurant._count.reservations}</p><p className="text-xs text-stone-500">Reservas</p></div>
                    <div className="bg-stone-50 rounded-lg p-4 text-center"><p className="text-xl font-bold text-green-600">{selectedRestaurant._count.orders}</p><p className="text-xs text-stone-500">Órdenes</p></div>
                    <div className="bg-stone-50 rounded-lg p-4 text-center"><p className="text-xl font-bold text-orange-600">{selectedRestaurant._count.reviews}</p><p className="text-xs text-stone-500">Reseñas</p></div>
                  </div>
                  {selectedRestaurant.manager && (
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Manager</p>
                      <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-semibold">{(selectedRestaurant.manager.fullName || selectedRestaurant.manager.email).charAt(0).toUpperCase()}</div>
                        <div><p className="font-medium text-stone-700">{selectedRestaurant.manager.fullName || 'Sin nombre'}</p><p className="text-stone-400 text-sm">{selectedRestaurant.manager.email}</p></div>
                      </div>
                    </div>
                  )}
                  {selectedRestaurant.employees.length > 0 && (
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Equipo ({selectedRestaurant.employees.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRestaurant.employees.slice(0, 6).map(emp => (
                          <div key={emp.id} className="flex items-center gap-2 bg-stone-50 rounded-full px-3 py-1.5">
                            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-semibold">{(emp.user.fullName || emp.user.email).charAt(0).toUpperCase()}</div>
                            <span className="text-sm text-stone-700">{emp.user.fullName || emp.user.email.split('@')[0]}</span>
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">{emp.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'menu' && (
                selectedRestaurant.menu.length === 0 ? <p className="text-center text-stone-400 py-8">Sin menú</p> : (
                  <div className="space-y-2">
                    {selectedRestaurant.menu.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                        <div><p className="font-medium text-stone-700">{item.name}</p><p className="text-stone-400 text-xs">{item.category}</p></div>
                        <span className="font-semibold text-orange-600">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'reviews' && (
                !selectedRestaurant.reviews || selectedRestaurant.reviews.length === 0 ? <p className="text-center text-stone-400 py-8">Sin reseñas</p> : (
                  <div className="space-y-2">
                    {selectedRestaurant.reviews.map(review => (
                      <div key={review.id} className="p-3 bg-stone-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-stone-700">{review.user?.fullName || 'Usuario'}</span>
                          <div className="flex">{[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-4 w-4 ${i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-stone-300'}`} />)}</div>
                        </div>
                        {review.comment && <p className="text-sm text-stone-600">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'tables' && (
                selectedRestaurant.tables.length === 0 ? <p className="text-center text-stone-400 py-8">Sin mesas</p> : (
                  <div className="grid grid-cols-4 gap-3">
                    {selectedRestaurant.tables.map(table => (
                      <div key={table.id} className={`p-3 rounded-lg text-center ${table.status === 'free' ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                        <span className="text-lg font-bold text-stone-800">#{table.number || '?'}</span>
                        <p className="text-xs text-stone-500">{table.capacity} personas</p>
                        <span className={`mt-1 inline-block px-2 py-0.5 rounded text-xs ${table.status === 'free' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{table.status === 'free' ? 'Libre' : 'Ocupada'}</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'gallery' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-stone-600">Fotos del restaurante</p>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-1" />Subir Foto
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {galleryImages.map(img => (
                      <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-stone-100 relative group">
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="p-2 bg-white rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-500" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'permissions' && (
                <div>
                  <p className="text-sm text-stone-600 mb-4">Selecciona los módulos que este restaurante puede usar:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {MODULES.map(module => (
                      <button key={module.id} onClick={() => toggleModule(module.id)} className={`p-4 rounded-lg border-2 text-left transition-colors ${enabledModules.has(module.id) ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enabledModules.has(module.id) ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-500'}`}>
                            <module.Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-stone-800">{module.label}</p>
                            <p className="text-xs text-stone-400">{enabledModules.has(module.id) ? '✓ Habilitado' : 'Deshabilitado'}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button className="mt-4 bg-orange-500 hover:bg-orange-600" onClick={handleSaveModules} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Permisos'}</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm mx-4 shadow-xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="h-7 w-7 text-red-500" /></div>
              <h3 className="text-lg font-semibold text-stone-800 mb-2">¿Eliminar?</h3>
              <p className="text-stone-500 text-sm">Se eliminará <strong>{deleteTarget.name}</strong>.</p>
            </div>
            <div className="p-5 border-t border-stone-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete} disabled={actionLoading === deleteTarget.id}>Eliminar</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}