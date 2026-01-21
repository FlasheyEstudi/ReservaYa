'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    CreditCard, Gift, Star, Save, Loader2, ToggleLeft, ToggleRight,
    Users, Award, TrendingUp, Sparkles
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

const apiUrl = getApiUrl();

interface LoyaltyProgram {
    id?: string;
    isActive: boolean;
    visitsRequired: number;
    rewardTitle: string;
    rewardDescription: string;
}

interface LoyaltyStats {
    totalCards: number;
    totalVisits: number;
    rewardsRedeemed: number;
}

export default function LoyaltyProgramPage() {
    const router = useRouter();
    const { showSuccess, showError } = useToast();
    const [program, setProgram] = useState<LoyaltyProgram>({
        isActive: false,
        visitsRequired: 10,
        rewardTitle: 'Postre gratis',
        rewardDescription: ''
    });
    const [stats, setStats] = useState<LoyaltyStats>({
        totalCards: 0,
        totalVisits: 0,
        rewardsRedeemed: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/employee-login');
            return;
        }
        fetchProgram(token);
    }, [router]);

    const fetchProgram = async (token: string) => {
        try {
            const res = await fetch(`${apiUrl}/loyalty/program`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.program) {
                    setProgram({
                        id: data.program.id,
                        isActive: data.program.isActive,
                        visitsRequired: data.program.visitsRequired,
                        rewardTitle: data.program.rewardTitle,
                        rewardDescription: data.program.rewardDescription || ''
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching loyalty program:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/loyalty/program`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(program)
            });

            if (res.ok) {
                const data = await res.json();
                setProgram(prev => ({ ...prev, id: data.program.id }));
                setHasChanges(false);
                showSuccess('¡Guardado!', 'Programa de fidelidad actualizado correctamente');
            } else {
                const errorData = await res.json().catch(() => ({}));
                showError('Error al guardar', errorData.error || 'No se pudo guardar la configuración');
            }
        } catch (err) {
            console.error('Error saving program:', err);
            showError('Error de conexión', 'Verifica tu conexión e intenta de nuevo');
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (field: keyof LoyaltyProgram, value: any) => {
        setProgram(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    if (isLoading) {
        return (
            <ManageLayout title="Tarjeta de Fidelidad" subtitle="Cargando...">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                </div>
            </ManageLayout>
        );
    }

    return (
        <ManageLayout title="Tarjeta de Fidelidad" subtitle="Configura tu programa de lealtad">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                            <CreditCard className="h-6 w-6 text-orange-600" />
                            Tarjeta de Fidelidad
                        </h1>
                        <p className="text-stone-600 text-sm mt-1">
                            Configura tu programa de recompensas para clientes frecuentes
                        </p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Guardar Cambios
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-700">{stats.totalCards}</p>
                                <p className="text-sm text-blue-600">Clientes con tarjeta</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center">
                                <Star className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-700">{stats.totalVisits}</p>
                                <p className="text-sm text-amber-600">Visitas registradas</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                <Gift className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-700">{stats.rewardsRedeemed}</p>
                                <p className="text-sm text-purple-600">Recompensas canjeadas</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Configuration Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Gift className="h-5 w-5 text-orange-600" />
                                Configuración del Programa
                            </span>
                            <button
                                onClick={() => updateField('isActive', !program.isActive)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${program.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-stone-100 text-stone-500'
                                    }`}
                            >
                                {program.isActive ? (
                                    <>
                                        <ToggleRight className="h-5 w-5" />
                                        Activo
                                    </>
                                ) : (
                                    <>
                                        <ToggleLeft className="h-5 w-5" />
                                        Inactivo
                                    </>
                                )}
                            </button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Visits Required */}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Visitas necesarias para recompensa
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => updateField('visitsRequired', Math.max(3, program.visitsRequired - 1))}
                                    className="h-10 w-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-xl font-bold hover:bg-stone-200"
                                >
                                    -
                                </button>
                                <div className="w-20 text-center">
                                    <span className="text-3xl font-bold text-orange-600">{program.visitsRequired}</span>
                                    <p className="text-xs text-stone-500">visitas</p>
                                </div>
                                <button
                                    onClick={() => updateField('visitsRequired', Math.min(30, program.visitsRequired + 1))}
                                    className="h-10 w-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-xl font-bold hover:bg-stone-200"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Reward Title */}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Título de la recompensa
                            </label>
                            <Input
                                value={program.rewardTitle}
                                onChange={(e) => updateField('rewardTitle', e.target.value)}
                                placeholder="Ej: Postre gratis, 20% descuento, Bebida gratis..."
                                className="w-full"
                                maxLength={50}
                            />
                            <p className="text-xs text-stone-400 mt-1">
                                Este es lo que el cliente ganará
                            </p>
                        </div>

                        {/* Reward Description */}
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Descripción (opcional)
                            </label>
                            <textarea
                                value={program.rewardDescription}
                                onChange={(e) => updateField('rewardDescription', e.target.value)}
                                placeholder="Detalles adicionales sobre la recompensa..."
                                className="w-full p-3 rounded-lg border border-stone-200 text-sm resize-none"
                                rows={2}
                                maxLength={150}
                            />
                        </div>

                        {/* Preview */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                            <p className="text-xs text-stone-500 mb-2 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Vista previa de la tarjeta
                            </p>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <div className="flex justify-center gap-1 mb-3">
                                    {Array.from({ length: Math.min(program.visitsRequired, 12) }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-7 h-7 rounded-full flex items-center justify-center ${i < 5 ? 'bg-orange-500 text-white' : 'bg-stone-200'
                                                }`}
                                        >
                                            {i < 5 ? <Star className="h-3 w-3 fill-current" /> : <span className="text-xs">{i + 1}</span>}
                                        </div>
                                    ))}
                                    {program.visitsRequired > 12 && (
                                        <span className="text-sm text-stone-500">+{program.visitsRequired - 12}</span>
                                    )}
                                </div>
                                <p className="text-center text-sm text-stone-600">
                                    <span className="font-bold text-orange-600">5</span>/{program.visitsRequired} visitas
                                </p>
                                <div className="text-center mt-2 pt-2 border-t border-stone-100">
                                    <p className="text-xs text-stone-500">Tu recompensa:</p>
                                    <p className="font-bold text-stone-800">{program.rewardTitle || 'Sin definir'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Help Card */}
                <Card className="bg-stone-50 border-stone-200">
                    <CardContent className="p-4">
                        <h4 className="font-medium text-stone-800 mb-2">¿Cómo funciona?</h4>
                        <ul className="text-sm text-stone-600 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="bg-orange-100 text-orange-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                Cuando un cliente con reservación llega, el Host sella su tarjeta digital
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-orange-100 text-orange-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                El cliente acumula visitas en su perfil de la app
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-orange-100 text-orange-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                Al completar las visitas requeridas, el Host puede canjear la recompensa
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </ManageLayout>
    );
}
