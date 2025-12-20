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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Building2, Store } from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
    id: string;
    name: string;
    ownerName: string;
    ownerEmail: string;
    branches: number;
    createdAt: string;
    restaurants: { id: string; name: string; businessCode: string; status: string; }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function OrganizationsPage() {
    const router = useRouter();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrganizations();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchOrganizations = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                limit: '50'
            });
            if (searchTerm) queryParams.append('search', searchTerm);

            const response = await fetch(`${API_URL}/admin/organizations?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch organizations');

            const data = await response.json();
            setOrganizations(data.organizations);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar organizaciones');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout title="Organizaciones" subtitle="Gestión de grupos y sucursales">
            <div className="mb-6">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                        placeholder="Buscar por nombre o dueño..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                {isLoading && organizations.length === 0 ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organización</TableHead>
                                <TableHead>Dueño</TableHead>
                                <TableHead>Sucursales</TableHead>
                                <TableHead>Fecha Registro</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {organizations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-stone-500">
                                        No se encontraron organizaciones
                                    </TableCell>
                                </TableRow>
                            ) : (
                                organizations.map((org) => (
                                    <>
                                        <TableRow key={org.id} className="cursor-pointer hover:bg-stone-50" onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 rounded-lg">
                                                        <Building2 className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                    <div className="font-medium text-stone-800">{org.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{org.ownerName}</div>
                                                <div className="text-xs text-stone-400">{org.ownerEmail}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-stone-100 text-stone-700">
                                                    {org.branches} sedes
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-stone-500">
                                                    {new Date(org.createdAt).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setExpandedOrg(expandedOrg === org.id ? null : org.id); }}>
                                                    {expandedOrg === org.id ? 'Ocultar' : 'Ver Detalles'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        {expandedOrg === org.id && (
                                            <TableRow className="bg-stone-50/50">
                                                <TableCell colSpan={5} className="p-4">
                                                    <div className="pl-12 grid gap-3">
                                                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Sucursales Asociadas</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {org.restaurants.map(rest => (
                                                                <div key={rest.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-start gap-3">
                                                                    <Store className="h-5 w-5 text-orange-500 mt-0.5" />
                                                                    <div>
                                                                        <p className="font-medium text-sm">{rest.name}</p>
                                                                        <p className="text-xs text-stone-400 font-mono">{rest.businessCode}</p>
                                                                        <div className="mt-1">
                                                                            <Badge className={rest.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}>
                                                                                {rest.status}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </AdminLayout>
    );
}
