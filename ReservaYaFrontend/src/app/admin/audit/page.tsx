'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FileText, Search, User, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AuditEntry {
    id: string;
    action: string;
    entity: string;
    userEmail: string;
    details: string;
    timestamp: string;
    ipAddress: string;
}

export default function AdminAuditLog() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (!token || userRole !== 'ADMIN') {
            router.push('/auth/login');
            return;
        }

        fetchAuditLogs();
    }, [router]);

    const fetchAuditLogs = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/admin/audit`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data.auditLogs || []);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionStyles = (action: string) => {
        if (action.includes('SUSPEND') || action.includes('DELETE')) return 'bg-red-50 text-red-600';
        if (action.includes('CREATE') || action.includes('SENT')) return 'bg-green-50 text-green-600';
        if (action.includes('UPDATE')) return 'bg-blue-50 text-blue-600';
        if (action.includes('LOGIN')) return 'bg-purple-50 text-purple-600';
        return 'bg-stone-50 text-stone-600';
    };

    const filteredLogs = auditLogs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <AdminLayout title="Audit Log" subtitle="Historial de acciones del sistema">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-4">
                        <p className="text-2xl font-semibold text-stone-800">{auditLogs.length}</p>
                        <p className="text-stone-500 text-sm">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-4">
                        <p className="text-2xl font-semibold text-purple-600">
                            {auditLogs.filter(l => l.action.includes('LOGIN')).length}
                        </p>
                        <p className="text-stone-500 text-sm">Logins</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-4">
                        <p className="text-2xl font-semibold text-orange-600">
                            {auditLogs.filter(l => l.action.includes('SUSPEND')).length}
                        </p>
                        <p className="text-stone-500 text-sm">Suspensiones</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
                    <CardContent className="p-4">
                        <p className="text-2xl font-semibold text-green-600">
                            {auditLogs.filter(l => l.action.includes('CAMPAIGN')).length}
                        </p>
                        <p className="text-stone-500 text-sm">Campañas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card className="bg-white border border-stone-200">
                <CardHeader className="border-b border-stone-100 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-stone-400" />
                            Registros
                        </CardTitle>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                            <Input
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64 border-stone-200 focus:border-orange-400"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Acción</th>
                                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Usuario</th>
                                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Detalles</th>
                                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Fecha</th>
                                <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td className="py-3 px-5">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionStyles(log.action)}`}>
                                            {log.action.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-3 px-5 text-sm text-stone-700">{log.userEmail}</td>
                                    <td className="py-3 px-5 text-sm text-stone-600">{log.details}</td>
                                    <td className="py-3 px-5 text-sm text-stone-500">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="py-3 px-5">
                                        <code className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-600">{log.ipAddress}</code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLogs.length === 0 && (
                        <div className="text-center py-12 text-stone-400">No se encontraron registros</div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
