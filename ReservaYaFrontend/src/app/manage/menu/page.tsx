'use client';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, UtensilsCrossed, Coffee, X, Save } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    station: 'kitchen' | 'bar';
    isAvailable: boolean;
}

interface Category {
    id: string;
    name: string;
    sortOrder: number;
}

export default function ManageMenu() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: 0, category: '', station: 'kitchen' as 'kitchen' | 'bar' });

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/menu`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMenuItems(data.items || []);
                // Extract unique categories
                const cats = [...new Set((data.items || []).map((i: MenuItem) => i.category))];
                setCategories(cats.map((c, i) => ({ id: c as string, name: c as string, sortOrder: i })));
            }
        } catch (err) {
            console.error('Menu fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async (item: MenuItem) => {
        // Optimistic update
        setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i));
        // TODO: API call to update availability
    };

    const handleSave = () => {
        if (editingItem) {
            // Update existing
            setMenuItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...formData } : i));
        } else {
            // Create new
            const newItem: MenuItem = {
                id: Date.now().toString(),
                ...formData,
                isAvailable: true
            };
            setMenuItems(prev => [...prev, newItem]);
        }
        setShowModal(false);
        setEditingItem(null);
        setFormData({ name: '', description: '', price: 0, category: '', station: 'kitchen' });
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setFormData({ name: item.name, description: item.description || '', price: item.price, category: item.category, station: item.station });
        setShowModal(true);
    };

    const handleDelete = (itemId: string) => {
        if (confirm('¿Eliminar este platillo?')) {
            setMenuItems(prev => prev.filter(i => i.id !== itemId));
        }
    };

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <ManageLayout title="Menú Digital" subtitle="Gestiona platillos, precios y disponibilidad">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                        placeholder="Buscar platillo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-stone-200"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-stone-200 rounded-lg text-sm"
                    >
                        <option value="all">Todas las categorías</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                    <Button onClick={() => { setEditingItem(null); setFormData({ name: '', description: '', price: 0, category: '', station: 'kitchen' }); setShowModal(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4 mr-2" /> Nuevo Platillo
                    </Button>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <p className="col-span-full text-center text-stone-400 py-12">Cargando menú...</p>
                ) : filteredItems.length === 0 ? (
                    <p className="col-span-full text-center text-stone-400 py-12">No hay platillos</p>
                ) : (
                    filteredItems.map(item => (
                        <Card key={item.id} className={`border-stone-200 ${!item.isAvailable ? 'opacity-60' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-stone-800">{item.name}</h3>
                                        <p className="text-sm text-stone-500">{item.description || 'Sin descripción'}</p>
                                    </div>
                                    <span className="text-lg font-bold text-emerald-600">${item.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-600">{item.category}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${item.station === 'kitchen' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {item.station === 'kitchen' ? <UtensilsCrossed className="h-3 w-3 inline mr-1" /> : <Coffee className="h-3 w-3 inline mr-1" />}
                                            {item.station === 'kitchen' ? 'Cocina' : 'Bar'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => toggleAvailability(item)} className={`p-1 rounded ${item.isAvailable ? 'text-emerald-600' : 'text-stone-400'}`}>
                                            {item.isAvailable ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                        </button>
                                        <button onClick={() => handleEdit(item)} className="p-1 rounded text-stone-400 hover:text-blue-600">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1 rounded text-stone-400 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">{editingItem ? 'Editar Platillo' : 'Nuevo Platillo'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label>
                                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del platillo" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Descripción</label>
                                <Input value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Descripción breve" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Precio</label>
                                    <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Categoría</label>
                                    <Input value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} placeholder="Entradas, Fuertes..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">Destino</label>
                                <div className="flex gap-4">
                                    <button onClick={() => setFormData(p => ({ ...p, station: 'kitchen' }))} className={`flex-1 p-3 rounded-lg border-2 ${formData.station === 'kitchen' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'}`}>
                                        <UtensilsCrossed className={`h-5 w-5 mx-auto mb-1 ${formData.station === 'kitchen' ? 'text-emerald-600' : 'text-stone-400'}`} />
                                        <p className="text-sm font-medium">Cocina</p>
                                    </button>
                                    <button onClick={() => setFormData(p => ({ ...p, station: 'bar' }))} className={`flex-1 p-3 rounded-lg border-2 ${formData.station === 'bar' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'}`}>
                                        <Coffee className={`h-5 w-5 mx-auto mb-1 ${formData.station === 'bar' ? 'text-emerald-600' : 'text-stone-400'}`} />
                                        <p className="text-sm font-medium">Bar</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
                            <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700"><Save className="h-4 w-4 mr-2" /> Guardar</Button>
                        </div>
                    </div>
                </div>
            )}
        </ManageLayout>
    );
}
