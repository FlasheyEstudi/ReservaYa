'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tags, Plus, Edit, Trash2, X, Check, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Category {
    id: string;
    name: string;
    icon: string;
    restaurants: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const ICONS = ['🍕', '🍔', '🍣', '🌮', '🍜', '🥗', '🍰', '☕', '🍺', '🥘', '🍝', '🌯', '🍗', '🥐', '🍱', '🧁'];

export default function AdminCategories() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState<Category | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', icon: '🍽️' });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');
        if (!token || userRole !== 'ADMIN') {
            router.push('/auth/login');
            return;
        }
        fetchCategories();
    }, [router]);

    const fetchCategories = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/admin/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Map API response, add icon if missing
                setCategories((data.categories || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    icon: c.icon || getIconForCategory(c.name),
                    restaurants: c.restaurants || 0
                })));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getIconForCategory = (name: string): string => {
        const iconMap: Record<string, string> = {
            'italiana': '🍕', 'mexicana': '🌮', 'japonesa': '🍣',
            'americana': '🍔', 'china': '🍜', 'saludable': '🥗',
            'postres': '🍰', 'cafetería': '☕'
        };
        return iconMap[name.toLowerCase()] || '🍽️';
    };

    const handleCreate = () => {
        if (!formData.name.trim()) return;
        setCategories(prev => [...prev, { id: Date.now().toString(), name: formData.name, icon: formData.icon, restaurants: 0 }]);
        setFormData({ name: '', icon: '🍽️' });
        setShowCreateModal(false);
    };

    const handleEdit = () => {
        if (!showEditModal || !formData.name.trim()) return;
        setCategories(prev => prev.map(c => c.id === showEditModal.id ? { ...c, name: formData.name, icon: formData.icon } : c));
        setShowEditModal(null);
        setFormData({ name: '', icon: '🍽️' });
    };

    const handleDelete = () => {
        if (!showDeleteModal) return;
        setCategories(prev => prev.filter(c => c.id !== showDeleteModal.id));
        setShowDeleteModal(null);
    };

    const openEditModal = (category: Category) => {
        setFormData({ name: category.name, icon: category.icon });
        setShowEditModal(category);
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div></div>;
    }

    return (
        <AdminLayout title="Categorías" subtitle="Gestión de categorías de cocina">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5"><p className="text-2xl font-semibold text-stone-800">{categories.length}</p><p className="text-stone-500 text-sm">Total Categorías</p></CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5"><p className="text-2xl font-semibold text-blue-600">{categories.reduce((sum, c) => sum + c.restaurants, 0)}</p><p className="text-stone-500 text-sm">Restaurantes</p></CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-5">
                        <Button onClick={() => { setFormData({ name: '', icon: '🍽️' }); setShowCreateModal(true); }} className="w-full bg-orange-500 hover:bg-orange-600">
                            <Plus className="h-4 w-4 mr-2" />Nueva Categoría
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((category) => (
                    <Card key={category.id} className="bg-white border border-stone-200 hover:border-orange-400 transition-colors group">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-4xl">{category.icon}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 hover:bg-stone-100 rounded" onClick={() => openEditModal(category)}><Edit className="h-4 w-4 text-stone-400" /></button>
                                    <button className="p-1.5 hover:bg-red-50 rounded" onClick={() => setShowDeleteModal(category)}><Trash2 className="h-4 w-4 text-red-400" /></button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-stone-800 text-lg">{category.name}</h3>
                            <span className="text-sm text-stone-400 mt-1 block">{category.restaurants} restaurantes</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-5 border-b border-stone-100">
                            <h3 className="text-lg font-semibold text-stone-800">Nueva Categoría</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-stone-100 rounded-lg"><X className="h-5 w-5 text-stone-400" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-stone-700">Nombre *</label>
                                <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Nombre de la categoría" className="mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-2">Icono</label>
                                <div className="flex flex-wrap gap-2">
                                    {ICONS.map(icon => (
                                        <button key={icon} onClick={() => setFormData(prev => ({ ...prev, icon }))} className={`text-2xl p-2 rounded-lg border-2 transition-all ${formData.icon === icon ? 'border-orange-500 bg-orange-50 scale-110' : 'border-stone-200 hover:border-orange-400'}`}>
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-stone-100 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                            <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleCreate} disabled={!formData.name.trim()}>
                                <Check className="h-4 w-4 mr-2" />Crear
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-5 border-b border-stone-100">
                            <h3 className="text-lg font-semibold text-stone-800">Editar Categoría</h3>
                            <button onClick={() => setShowEditModal(null)} className="p-2 hover:bg-stone-100 rounded-lg"><X className="h-5 w-5 text-stone-400" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-stone-700">Nombre *</label>
                                <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Nombre de la categoría" className="mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-2">Icono</label>
                                <div className="flex flex-wrap gap-2">
                                    {ICONS.map(icon => (
                                        <button key={icon} onClick={() => setFormData(prev => ({ ...prev, icon }))} className={`text-2xl p-2 rounded-lg border-2 transition-all ${formData.icon === icon ? 'border-orange-500 bg-orange-50 scale-110' : 'border-stone-200 hover:border-orange-400'}`}>
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-stone-100 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(null)}>Cancelar</Button>
                            <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleEdit} disabled={!formData.name.trim()}>
                                <Save className="h-4 w-4 mr-2" />Guardar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-sm mx-4 shadow-xl">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">{showDeleteModal.icon}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-stone-800 mb-2">¿Eliminar Categoría?</h3>
                            <p className="text-stone-500 text-sm">Se eliminará <strong>{showDeleteModal.name}</strong>. Esto afectará a {showDeleteModal.restaurants} restaurantes.</p>
                        </div>
                        <div className="p-5 border-t border-stone-100 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(null)}>Cancelar</Button>
                            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>Eliminar</Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
