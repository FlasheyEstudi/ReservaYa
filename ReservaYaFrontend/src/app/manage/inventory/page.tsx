'use client';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Search, Plus, Minus, AlertTriangle, Edit, Trash2, X, Save, ArrowUp, ArrowDown } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    unit: string;
    currentStock: number;
    minStock: number;
    unitCost: number;
    lastUpdated: string;
}

interface StockMovement {
    id: string;
    productId: string;
    productName: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason: string;
    date: string;
}

const CATEGORIES = ['Carnes', 'Vegetales', 'Lácteos', 'Bebidas', 'Secos', 'Limpieza', 'Otros'];
const UNITS = ['kg', 'g', 'lt', 'ml', 'unidad', 'caja', 'bolsa'];

export default function ManageInventory() {
    const [products, setProducts] = useState<Product[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [movementProduct, setMovementProduct] = useState<Product | null>(null);
    const [movementData, setMovementData] = useState({ type: 'in' as 'in' | 'out', quantity: 0, reason: '' });
    const [formData, setFormData] = useState({ name: '', sku: '', category: 'Otros', unit: 'unidad', currentStock: 0, minStock: 5, unitCost: 0 });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/restaurant/inventory`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 403) {
                setProducts([]);
                // Optionally set a specialized state to show "Upgrade Plan" UI
                // For now, just ensuring it doesn't throw generic error
                return;
            }

            if (!res.ok) throw new Error('Error fetching inventory');

            const data = await res.json();
            setProducts(data.items || []);

            // Collect movements from items
            const allMovements: StockMovement[] = [];
            (data.items || []).forEach((item: any) => {
                (item.recentMovements || []).forEach((m: any) => {
                    allMovements.push({
                        id: m.id,
                        productId: item.id,
                        productName: item.name,
                        type: m.type,
                        quantity: m.quantity,
                        reason: m.reason || '',
                        date: m.date?.split('T')[0] || ''
                    });
                });
            });
            setMovements(allMovements.slice(0, 20));
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    const handleSaveProduct = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

            if (editingProduct) {
                const res = await fetch(`${API_URL}/restaurant/inventory/${editingProduct.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (res.ok) {
                    setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...formData, lastUpdated: new Date().toISOString().split('T')[0] } : p));
                }
            } else {
                const res = await fetch(`${API_URL}/restaurant/inventory`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (res.ok) {
                    const data = await res.json();
                    setProducts(prev => [...prev, { ...data.item, lastUpdated: new Date().toISOString().split('T')[0] }]);
                }
            }
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleDeleteProduct = async (product: Product) => {
        if (!confirm(`¿Eliminar ${product.name}?`)) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/restaurant/inventory/${product.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== product.id));
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({ name: product.name, sku: product.sku, category: product.category, unit: product.unit, currentStock: product.currentStock, minStock: product.minStock, unitCost: product.unitCost });
        setShowModal(true);
    };

    const openMovement = (product: Product) => {
        setMovementProduct(product);
        setMovementData({ type: 'in', quantity: 0, reason: '' });
        setShowMovementModal(true);
    };

    const handleStockMovement = async () => {
        if (!movementProduct || movementData.quantity <= 0) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/restaurant/inventory/${movementProduct.id}/movement`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(movementData)
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Error registering movement');
                return;
            }

            const data = await res.json();

            // Update local state
            setProducts(prev => prev.map(p => p.id === movementProduct.id ? { ...p, currentStock: data.newStock, lastUpdated: new Date().toISOString().split('T')[0] } : p));

            const movement: StockMovement = {
                id: data.movement.id,
                productId: movementProduct.id,
                productName: movementProduct.name,
                type: movementData.type,
                quantity: movementData.quantity,
                reason: movementData.reason || (movementData.type === 'in' ? 'Entrada' : 'Salida'),
                date: new Date().toISOString().split('T')[0]
            };
            setMovements(prev => [movement, ...prev]);
            setShowMovementModal(false);
        } catch (error) {
            console.error('Error registering movement:', error);
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({ name: '', sku: '', category: 'Otros', unit: 'unidad', currentStock: 0, minStock: 5, unitCost: 0 });
    };

    const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);
    const totalValue = products.reduce((s, p) => s + p.currentStock * p.unitCost, 0);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ManageLayout title="Inventario" subtitle="Control de productos y stock">
            {/* Toolbar */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-stone-200" />
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-stone-100 text-stone-700">
                    <p className="text-2xl font-bold">{products.length}</p>
                    <p className="text-sm">Productos</p>
                </div>
                <div className={`p-4 rounded-xl ${lowStockProducts.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    <p className="text-2xl font-bold">{lowStockProducts.length}</p>
                    <p className="text-sm">Stock Bajo</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-100 text-blue-700">
                    <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                    <p className="text-sm">Valor Inventario</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-100 text-purple-700">
                    <p className="text-2xl font-bold">{movements.length}</p>
                    <p className="text-sm">Movimientos</p>
                </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                        <AlertTriangle className="h-5 w-5" /> Productos con Stock Bajo
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {lowStockProducts.map(p => (
                            <span key={p.id} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                                {p.name}: {p.currentStock} {p.unit}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Products Table */}
            <Card className="border-stone-200">
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Producto</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">SKU</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Categoría</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Stock</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Costo Unit.</th>
                                <th className="text-left p-4 text-sm font-medium text-stone-600">Valor</th>
                                <th className="text-right p-4 text-sm font-medium text-stone-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p.id} className={`border-b border-stone-100 ${p.currentStock <= p.minStock ? 'bg-red-50' : 'hover:bg-stone-50'}`}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                                                <Package className="h-5 w-5 text-stone-400" />
                                            </div>
                                            <span className="font-medium text-stone-800">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-sm text-stone-500">{p.sku}</td>
                                    <td className="p-4 text-sm text-stone-500">{p.category}</td>
                                    <td className="p-4">
                                        <span className={`font-medium ${p.currentStock <= p.minStock ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {p.currentStock} {p.unit}
                                        </span>
                                        <span className="text-xs text-stone-400 block">Min: {p.minStock}</span>
                                    </td>
                                    <td className="p-4 text-stone-600">${p.unitCost}</td>
                                    <td className="p-4 font-medium text-stone-800">${(p.currentStock * p.unitCost).toLocaleString()}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => openMovement(p)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Movimiento"><ArrowUp className="h-4 w-4" /></button>
                                            <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit className="h-4 w-4" /></button>
                                            <button onClick={() => handleDeleteProduct(p)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label>
                                    <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del producto" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">SKU</label>
                                    <Input value={formData.sku} onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))} placeholder="CAR001" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Categoría</label>
                                    <select value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} className="w-full p-2 border border-stone-200 rounded-lg">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Unidad</label>
                                    <select value={formData.unit} onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))} className="w-full p-2 border border-stone-200 rounded-lg">
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Stock Actual</label>
                                    <Input type="number" value={formData.currentStock} onChange={(e) => setFormData(p => ({ ...p, currentStock: parseFloat(e.target.value) || 0 }))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Stock Mínimo</label>
                                    <Input type="number" value={formData.minStock} onChange={(e) => setFormData(p => ({ ...p, minStock: parseFloat(e.target.value) || 0 }))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Costo Unitario</label>
                                    <Input type="number" value={formData.unitCost} onChange={(e) => setFormData(p => ({ ...p, unitCost: parseFloat(e.target.value) || 0 }))} />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
                            <Button onClick={handleSaveProduct} className="flex-1 bg-emerald-600 hover:bg-emerald-700"><Save className="h-4 w-4 mr-2" /> Guardar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Movement Modal */}
            {showMovementModal && movementProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Movimiento de Stock</h2>
                            <button onClick={() => setShowMovementModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="mb-4 p-3 bg-stone-50 rounded-lg">
                            <p className="font-medium text-stone-800">{movementProduct.name}</p>
                            <p className="text-sm text-stone-500">Stock actual: {movementProduct.currentStock} {movementProduct.unit}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setMovementData(p => ({ ...p, type: 'in' }))} className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${movementData.type === 'in' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'}`}>
                                    <ArrowDown className="h-5 w-5 text-emerald-600" /> Entrada
                                </button>
                                <button onClick={() => setMovementData(p => ({ ...p, type: 'out' }))} className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${movementData.type === 'out' ? 'border-red-500 bg-red-50' : 'border-stone-200'}`}>
                                    <ArrowUp className="h-5 w-5 text-red-600" /> Salida
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Cantidad</label>
                                <Input type="number" value={movementData.quantity} onChange={(e) => setMovementData(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Razón/Motivo</label>
                                <Input value={movementData.reason} onChange={(e) => setMovementData(p => ({ ...p, reason: e.target.value }))} placeholder="Compra, uso cocina, ajuste..." />
                            </div>
                        </div>
                        <Button onClick={handleStockMovement} className={`w-full mt-6 ${movementData.type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                            {movementData.type === 'in' ? <ArrowDown className="h-4 w-4 mr-2" /> : <ArrowUp className="h-4 w-4 mr-2" />}
                            Registrar {movementData.type === 'in' ? 'Entrada' : 'Salida'}
                        </Button>
                    </div>
                </div>
            )}
        </ManageLayout>
    );
}
