'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
    id: string;
    name: string;
    displayName: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    maxTables: number;
    maxEmployees: number;
    maxReservationsMonth: number;
    features: any;
    isActive: boolean;
    sortOrder: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function PlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        description: '',
        priceMonthly: 0,
        priceYearly: 0,
        maxTables: 5,
        maxEmployees: 2,
        maxReservationsMonth: 100,
        isActive: true
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/plans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch plans');
            const data = await response.json();
            setPlans(data.plans);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar los planes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                displayName: plan.displayName,
                description: plan.description || '',
                priceMonthly: Number(plan.priceMonthly),
                priceYearly: Number(plan.priceYearly),
                maxTables: plan.maxTables,
                maxEmployees: plan.maxEmployees,
                maxReservationsMonth: plan.maxReservationsMonth,
                isActive: plan.isActive
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                displayName: '',
                description: '',
                priceMonthly: 0,
                priceYearly: 0,
                maxTables: 5,
                maxEmployees: 2,
                maxReservationsMonth: 100,
                isActive: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const url = editingPlan
                ? `${API_URL}/admin/plans/${editingPlan.id}`
                : `${API_URL}/admin/plans`;

            const method = editingPlan ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error saving plan');
            }

            toast.success(editingPlan ? 'Plan actualizado' : 'Plan creado');
            setIsDialogOpen(false);
            fetchPlans();

        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este plan?')) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/admin/plans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error deleting plan');
            }

            toast.success('Plan eliminado');
            fetchPlans();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout title="Planes" subtitle="Gestionando planes de suscripción">
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Planes" subtitle="Gestiona los niveles de suscripción">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Planes de Suscripción</h2>
                    <p className="text-muted-foreground">Define los precios y límites de la plataforma</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
                </Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Precio (Mes/Año)</TableHead>
                            <TableHead>Límites (Mesas/Empl/Res)</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell>
                                    <div className="font-medium">{plan.displayName}</div>
                                    <div className="text-xs text-stone-500">{plan.name}</div>
                                </TableCell>
                                <TableCell>
                                    ${plan.priceMonthly} / ${plan.priceYearly}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 text-xs">
                                        <Badge variant="outline">{plan.maxTables} mesas</Badge>
                                        <Badge variant="outline">{plan.maxEmployees} emps</Badge>
                                        <Badge variant="outline">{plan.maxReservationsMonth} res</Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {plan.isActive ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activo</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactivo</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(plan.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">ID Interno (Slug)</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="basic_plan"
                                    disabled={!!editingPlan}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Nombre Visible</Label>
                                <Input
                                    id="displayName"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="Plan Básico"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ideal para pequeños negocios"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priceMonthly">Precio Mensual ($)</Label>
                                <Input
                                    id="priceMonthly"
                                    type="number"
                                    value={formData.priceMonthly}
                                    onChange={(e) => setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priceYearly">Precio Anual ($)</Label>
                                <Input
                                    id="priceYearly"
                                    type="number"
                                    value={formData.priceYearly}
                                    onChange={(e) => setFormData({ ...formData, priceYearly: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="maxTables">Max Mesas</Label>
                                <Input
                                    id="maxTables"
                                    type="number"
                                    value={formData.maxTables}
                                    onChange={(e) => setFormData({ ...formData, maxTables: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxEmployees">Max Empleados</Label>
                                <Input
                                    id="maxEmployees"
                                    type="number"
                                    value={formData.maxEmployees}
                                    onChange={(e) => setFormData({ ...formData, maxEmployees: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxReservations">Max Reservas</Label>
                                <Input
                                    id="maxReservations"
                                    type="number"
                                    value={formData.maxReservationsMonth}
                                    onChange={(e) => setFormData({ ...formData, maxReservationsMonth: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label htmlFor="isActive">Plan Activo</Label>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                                Guardar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
