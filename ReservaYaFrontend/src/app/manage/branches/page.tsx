'use client';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, MapPin, Phone, ArrowRight, Check, X, Loader2 } from 'lucide-react';

interface Branch {
    id: string;
    name: string;
    businessCode: string;
    address?: string;
    phone?: string;
    status: string;
    isCurrent: boolean;
}

interface Organization {
    id: string;
    name: string;
}

import { getApiUrl } from '@/lib/api';

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' });
    const [toast, setToast] = useState('');

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${getApiUrl()}/organization/branches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setBranches(data.branches || []);
                setOrganization(data.organization);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleCreateBranch = async () => {
        if (!newBranch.name.trim()) {
            showToast('El nombre de la sucursal es requerido');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        setCreating(true);
        try {
            const res = await fetch(`${getApiUrl()}/organization/branches`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newBranch)
            });

            if (res.ok) {
                const data = await res.json();
                showToast(`Sucursal "${data.branch.name}" creada exitosamente`);
                setShowCreateModal(false);
                setNewBranch({ name: '', address: '', phone: '' });
                fetchBranches();
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al crear sucursal');
            }
        } catch (error) {
            console.error('Error creating branch:', error);
            showToast('Error de conexión');
        } finally {
            setCreating(false);
        }
    };

    const handleSwitchBranch = async (branchId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        showToast('Cambiando de sucursal...');

        try {
            const res = await fetch(`${getApiUrl()}/organization/switch-branch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ branchId })
            });

            if (res.ok) {
                const data = await res.json();
                // Update token with new branch
                localStorage.setItem('token', data.token);
                // Update user data with new restaurant
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    user.restaurant = data.restaurant;
                    localStorage.setItem('user', JSON.stringify(user));
                }
                localStorage.setItem('selectedBranchId', branchId);
                window.location.href = '/manage';
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al cambiar de sucursal');
            }
        } catch (error) {
            console.error('Error switching branch:', error);
            showToast('Error de conexión');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>;
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>;
            case 'suspended':
                return <Badge className="bg-red-100 text-red-700">Suspendido</Badge>;
            default:
                return <Badge className="bg-stone-100 text-stone-600">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <ManageLayout title="Sucursales" subtitle="Cargando...">
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
            </ManageLayout>
        );
    }

    return (
        <ManageLayout title="Sucursales" subtitle={organization?.name || 'Gestiona tus sucursales'}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-stone-800">
                            {branches.length} {branches.length === 1 ? 'Sucursal' : 'Sucursales'}
                        </h2>
                        <p className="text-sm text-stone-500">
                            {organization ? `Organización: ${organization.name}` : 'Modo único restaurante'}
                        </p>
                    </div>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Sucursal
                </Button>
            </div>

            {/* Branches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map(branch => (
                    <Card
                        key={branch.id}
                        className={`relative transition-all ${branch.isCurrent ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:shadow-md'}`}
                    >
                        {branch.isCurrent && (
                            <div className="absolute -top-2 left-4">
                                <Badge className="bg-emerald-600 text-white">Actual</Badge>
                            </div>
                        )}
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{branch.name}</CardTitle>
                                    <p className="text-xs text-stone-400 font-mono mt-1">{branch.businessCode}</p>
                                </div>
                                {getStatusBadge(branch.status)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-stone-600 mb-4">
                                {branch.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-stone-400" />
                                        <span className="truncate">{branch.address}</span>
                                    </div>
                                )}
                                {branch.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-stone-400" />
                                        <span>{branch.phone}</span>
                                    </div>
                                )}
                            </div>

                            {!branch.isCurrent && (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleSwitchBranch(branch.id)}
                                >
                                    Cambiar a esta sucursal
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                            {branch.isCurrent && (
                                <div className="text-center py-2 text-sm text-emerald-600 font-medium">
                                    <Check className="h-4 w-4 inline mr-1" />
                                    Estás aquí
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* No branches message */}
            {branches.length === 0 && (
                <div className="text-center py-16">
                    <Building2 className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-stone-800 mb-2">No hay sucursales</h3>
                    <p className="text-stone-500 mb-4">Crea tu primera sucursal para comenzar</p>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Sucursal
                    </Button>
                </div>
            )}

            {/* Create Branch Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Nueva Sucursal</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Nombre *</label>
                                <Input
                                    value={newBranch.name}
                                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                    placeholder="Ej: Sucursal Centro"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Dirección</label>
                                <Input
                                    value={newBranch.address}
                                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                                    placeholder="Av. Principal 123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Teléfono</label>
                                <Input
                                    value={newBranch.phone}
                                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                                    placeholder="+502 1234-5678"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowCreateModal(false)}
                                disabled={creating}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleCreateBranch}
                                disabled={creating}
                            >
                                {creating ? (
                                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creando...</>
                                ) : (
                                    <><Plus className="h-4 w-4 mr-2" />Crear Sucursal</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-4 right-4 bg-stone-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
                    {toast}
                </div>
            )}
        </ManageLayout>
    );
}
