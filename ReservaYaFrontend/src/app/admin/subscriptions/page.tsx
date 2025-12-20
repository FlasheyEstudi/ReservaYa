'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Subscription {
    id: string;
    restaurantName: string;
    businessCode: string;
    ownerEmail: string;
    planName: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    price: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function SubscriptionsPage() {
    const router = useRouter();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchSubscriptions();
    }, [page, statusFilter]);

    const fetchSubscriptions = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            if (statusFilter !== 'all') {
                queryParams.append('status', statusFilter);
            }

            const response = await fetch(`${API_URL}/admin/subscriptions?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch subscriptions');

            const data = await response.json();
            setSubscriptions(data.subscriptions);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar suscripciones');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'trialing': return 'bg-blue-100 text-blue-700';
            case 'past_due': return 'bg-yellow-100 text-yellow-700';
            case 'canceled': return 'bg-red-100 text-red-700';
            case 'expired': return 'bg-stone-100 text-stone-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <AdminLayout title="Suscripciones" subtitle="Monitoreo de estado de cuentas">
            <div className="mb-6 flex justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Suscripciones Activas</h2>
                    <p className="text-muted-foreground">Listado de restaurantes y sus planes actuales</p>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="active">Activos</SelectItem>
                            <SelectItem value="trialing">En Prueba (Trial)</SelectItem>
                            <SelectItem value="past_due">Pago Pendiente</SelectItem>
                            <SelectItem value="canceled">Cancelados</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={() => fetchSubscriptions()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card>
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Restaurante</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                    <TableHead>Contacto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-stone-500">
                                            No se encontraron suscripciones
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    subscriptions.map((sub) => (
                                        <TableRow key={sub.id}>
                                            <TableCell>
                                                <div className="font-medium">{sub.restaurantName}</div>
                                                <div className="text-xs text-stone-500 font-mono">{sub.businessCode}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{sub.planName}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {/* @ts-ignore - variant string issue */}
                                                <Badge className={getStatusColor(sub.status)}>
                                                    {sub.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(sub.price)}/mo
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{formatDate(sub.currentPeriodEnd)}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-stone-600">
                                                    <Mail className="h-3 w-3" />
                                                    <span className="truncate max-w-[150px]" title={sub.ownerEmail}>{sub.ownerEmail}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Anterior
                            </Button>
                            <span className="text-sm text-stone-600">
                                Página {page} de {totalPages || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </AdminLayout>
    );
}
