'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Search, Eye, Mail, Phone, Calendar, X, Trash2, Edit, Save, Star, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Reservation {
    id: string;
    date: string;
    time: string;
    partySize: number;
    status: string;
    restaurant: { id: string; name: string };
    table: { number: number } | null;
}

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    restaurant: { id: string; name: string };
}

interface UserDetail {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    createdAt: string;
    reservations: Reservation[];
    reviews: Review[];
}

interface User {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    createdAt: string;
    reservations: number;
    reviews: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function AdminUsers() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ fullName: '', phone: '', email: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'reservations' | 'reviews' | 'visited'>('reservations');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');
        if (!token || userRole !== 'ADMIN') {
            router.push('/auth/login');
            return;
        }
        fetchUsers(token);
    }, [router]);

    const fetchUsers = async (token: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserDetail = async (userId: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedUser(data.user);
                setEditForm({
                    fullName: data.user.fullName || '',
                    phone: data.user.phone || '',
                    email: data.user.email
                });
                setActiveTab('reservations');
            }
        } catch (err) {
            console.error('Failed to fetch user:', err);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedUser) return;
        const token = localStorage.getItem('token');
        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (response.ok) {
                setSelectedUser(prev => prev ? { ...prev, ...editForm } : null);
                setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editForm } : u));
                setIsEditing(false);
            }
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        const token = localStorage.getItem('token');
        setActionLoading(deleteTarget.id);
        try {
            const response = await fetch(`${API_URL}/admin/users/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
                setShowDeleteModal(false);
                setDeleteTarget(null);
                if (selectedUser?.id === deleteTarget.id) setSelectedUser(null);
            }
        } catch (err) {
            console.error('Failed to delete:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteReservation = async (reservationId: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/admin/reservations/${reservationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok && selectedUser) {
                setSelectedUser(prev => prev ? { ...prev, reservations: prev.reservations.filter(r => r.id !== reservationId) } : null);
            }
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const getVisitedRestaurants = (user: UserDetail) => {
        const restaurantMap = new Map();
        user.reservations.forEach(r => {
            if (!restaurantMap.has(r.restaurant.id)) {
                restaurantMap.set(r.restaurant.id, { ...r.restaurant, visits: 0 });
            }
            restaurantMap.get(r.restaurant.id).visits++;
        });
        return Array.from(restaurantMap.values());
    };

    const getAverageRating = (reviews: Review[]) => {
        if (reviews.length === 0) return 0;
        return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div></div>;
    }

    return (
        <AdminLayout title="Usuarios" subtitle="Perfiles, reservas, reseñas y gestión">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5"><p className="text-2xl font-semibold text-stone-800">{users.length}</p><p className="text-stone-500 text-sm">Total Usuarios</p></CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5"><p className="text-2xl font-semibold text-blue-600">{users.reduce((sum, u) => sum + u.reservations, 0)}</p><p className="text-stone-500 text-sm">Total Reservas</p></CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5"><p className="text-2xl font-semibold text-orange-600">{users.reduce((sum, u) => sum + u.reviews, 0)}</p><p className="text-stone-500 text-sm">Total Reseñas</p></CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card className="bg-white border border-stone-200">
                <CardHeader className="border-b border-stone-100 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-stone-800">Lista de Usuarios</CardTitle>
                        <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" /></div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Usuario</th>
                                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Registro</th>
                                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Actividad</th>
                                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="py-4 px-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">{(user.fullName || user.email).charAt(0).toUpperCase()}</div>
                                            <div><p className="font-medium text-stone-800">{user.fullName || 'Sin nombre'}</p><p className="text-stone-400 text-sm">{user.email}</p></div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5"><span className="text-sm text-stone-600 flex items-center gap-1"><Calendar className="h-3 w-3 text-stone-400" />{new Date(user.createdAt).toLocaleDateString()}</span></td>
                                    <td className="py-4 px-5">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">{user.reservations} reservas</span>
                                            <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-xs">{user.reviews} reseñas</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5">
                                        <div className="flex items-center gap-1">
                                            <button className="p-2 hover:bg-orange-50 rounded-lg" onClick={() => fetchUserDetail(user.id)}><Eye className="h-4 w-4 text-orange-500" /></button>
                                            <button className="p-2 hover:bg-red-50 rounded-lg" onClick={() => { setDeleteTarget(user); setShowDeleteModal(true); }}><Trash2 className="h-4 w-4 text-red-400" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && <div className="text-center py-12 text-stone-400">No se encontraron usuarios</div>}
                </CardContent>
            </Card>

            {/* User Profile Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="relative">
                            <div className="h-28 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                            <div className="absolute -bottom-12 left-6"><div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-blue-600 text-3xl font-bold">{(selectedUser.fullName || selectedUser.email).charAt(0).toUpperCase()}</div></div>
                            <div className="absolute top-4 right-4 flex gap-2">
                                {!isEditing ? <button onClick={() => setIsEditing(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"><Edit className="h-4 w-4 text-white" /></button>
                                    : <button onClick={handleSaveEdit} disabled={isSaving} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg"><Save className="h-4 w-4 text-white" /></button>}
                                <button onClick={() => { setSelectedUser(null); setIsEditing(false); }} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"><X className="h-5 w-5 text-white" /></button>
                            </div>
                        </div>

                        <div className="pt-14 px-6 pb-4">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Input value={editForm.fullName} onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Nombre" className="text-xl font-bold" />
                                    <Input value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" type="email" />
                                    <Input value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Teléfono" />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-stone-800">{selectedUser.fullName || 'Usuario'}</h2>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-stone-600">
                                        <span className="flex items-center gap-1"><Mail className="h-4 w-4 text-stone-400" />{selectedUser.email}</span>
                                        {selectedUser.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4 text-stone-400" />{selectedUser.phone}</span>}
                                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-stone-400" />Desde {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-3 border-y border-stone-100">
                            <div className="p-4 text-center border-r border-stone-100"><p className="text-xl font-bold text-stone-800">{selectedUser.reservations.length}</p><p className="text-xs text-stone-500">Reservas</p></div>
                            <div className="p-4 text-center border-r border-stone-100"><p className="text-xl font-bold text-stone-800">{selectedUser.reviews.length}</p><p className="text-xs text-stone-500">Reseñas</p></div>
                            <div className="p-4 text-center"><p className="text-xl font-bold text-yellow-500">{getAverageRating(selectedUser.reviews)} ★</p><p className="text-xs text-stone-500">Rating</p></div>
                        </div>

                        <div className="border-b border-stone-100">
                            <div className="flex">
                                {(['reservations', 'reviews', 'visited'] as const).map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-stone-500'}`}>
                                        {tab === 'reservations' ? `📅 Reservas` : tab === 'reviews' ? `⭐ Reseñas` : `🏪 Visitados`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 max-h-60 overflow-y-auto">
                            {activeTab === 'reservations' && (
                                selectedUser.reservations.length === 0 ? <p className="text-center text-stone-400 py-8">Sin reservas</p> : (
                                    <div className="space-y-2">
                                        {selectedUser.reservations.map((res) => (
                                            <div key={res.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-semibold text-sm">{res.restaurant.name.charAt(0)}</div>
                                                    <div><p className="font-medium text-stone-700">{res.restaurant.name}</p><div className="text-xs text-stone-500">{new Date(res.date).toLocaleDateString()} • {res.time} • {res.partySize}p</div></div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${res.status === 'confirmed' ? 'bg-green-50 text-green-600' : res.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{res.status}</span>
                                                    <button onClick={() => handleDeleteReservation(res.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4 text-red-400" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                            {activeTab === 'reviews' && (
                                selectedUser.reviews.length === 0 ? <p className="text-center text-stone-400 py-8">Sin reseñas</p> : (
                                    <div className="space-y-2">
                                        {selectedUser.reviews.map((review) => (
                                            <div key={review.id} className="p-3 bg-stone-50 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-stone-700">{review.restaurant.name}</span>
                                                    <div className="flex">{[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-4 w-4 ${i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-stone-300'}`} />)}</div>
                                                </div>
                                                {review.comment && <p className="text-sm text-stone-600">{review.comment}</p>}
                                                <p className="text-xs text-stone-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                            {activeTab === 'visited' && (
                                getVisitedRestaurants(selectedUser).length === 0 ? <p className="text-center text-stone-400 py-8">Sin restaurantes visitados</p> : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {getVisitedRestaurants(selectedUser).map((restaurant) => (
                                            <div key={restaurant.id} className="p-3 bg-stone-50 rounded-lg flex items-center gap-3">
                                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-semibold">{restaurant.name.charAt(0)}</div>
                                                <div><p className="font-medium text-stone-700">{restaurant.name}</p><p className="text-xs text-stone-500">{restaurant.visits} visita(s)</p></div>
                                            </div>
                                        ))}
                                    </div>
                                )
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
                            <h3 className="text-lg font-semibold text-stone-800 mb-2">¿Eliminar Usuario?</h3>
                            <p className="text-stone-500 text-sm">Se eliminará <strong>{deleteTarget.fullName || deleteTarget.email}</strong>.</p>
                        </div>
                        <div className="p-5 border-t border-stone-100 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDeleteUser} disabled={actionLoading === deleteTarget.id}>Eliminar</Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
