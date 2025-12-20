'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Settings, Save, Globe, Shield, Bell, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSettings() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        platformName: 'ReservaYa',
        supportEmail: 'soporte@reservaya.com',
        maxTables: '50',
        reservationTime: '30',
        sessionTimeout: '24',
        notifications: true,
        emailAlerts: true,
        maintenance: false
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (!token || userRole !== 'ADMIN') {
            router.push('/auth/login');
            return;
        }

        setIsLoading(false);
    }, [router]);

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <AdminLayout title="Configuración" subtitle="Ajustes de la plataforma">
            {saved && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">Configuración guardada</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* General */}
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-500" />
                            General
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div>
                            <Label className="text-stone-700">Nombre</Label>
                            <Input
                                value={settings.platformName}
                                onChange={(e) => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                                className="mt-1 border-stone-200 focus:border-orange-400"
                            />
                        </div>
                        <div>
                            <Label className="text-stone-700">Email de Soporte</Label>
                            <Input
                                type="email"
                                value={settings.supportEmail}
                                onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                className="mt-1 border-stone-200 focus:border-orange-400"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Limits */}
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-orange-500" />
                            Límites
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div>
                            <Label className="text-stone-700">Max Mesas por Restaurante</Label>
                            <Input
                                type="number"
                                value={settings.maxTables}
                                onChange={(e) => setSettings(prev => ({ ...prev, maxTables: e.target.value }))}
                                className="mt-1 border-stone-200 focus:border-orange-400"
                            />
                        </div>
                        <div>
                            <Label className="text-stone-700">Tiempo Mínimo Reserva (min)</Label>
                            <Input
                                type="number"
                                value={settings.reservationTime}
                                onChange={(e) => setSettings(prev => ({ ...prev, reservationTime: e.target.value }))}
                                className="mt-1 border-stone-200 focus:border-orange-400"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-500" />
                            Seguridad
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div>
                            <Label className="text-stone-700">Sesión (horas)</Label>
                            <Input
                                type="number"
                                value={settings.sessionTimeout}
                                onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                                className="mt-1 border-stone-200 focus:border-orange-400"
                            />
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-stone-700">Modo Mantenimiento</p>
                                <p className="text-sm text-stone-400">Desactiva acceso público</p>
                            </div>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, maintenance: !prev.maintenance }))}
                                className={`w-11 h-6 rounded-full transition-colors ${settings.maintenance ? 'bg-red-500' : 'bg-stone-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maintenance ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-green-500" />
                            Notificaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-stone-700">Notificaciones Push</p>
                                <p className="text-sm text-stone-400">Tiempo real</p>
                            </div>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                                className={`w-11 h-6 rounded-full transition-colors ${settings.notifications ? 'bg-orange-500' : 'bg-stone-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notifications ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-stone-700">Alertas por Email</p>
                                <p className="text-sm text-stone-400">Resúmenes diarios</p>
                            </div>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, emailAlerts: !prev.emailAlerts }))}
                                className={`w-11 h-6 rounded-full transition-colors ${settings.emailAlerts ? 'bg-orange-500' : 'bg-stone-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.emailAlerts ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6">
                <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 px-6">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
            </div>
        </AdminLayout>
    );
}
