'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Settings, Save, Globe, Shield, Bell, Check, Link, Users, Calendar, Lock, Mail, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface PlatformSettings {
    platformName: string;
    supportEmail: string;
    logoUrl: string;
    maxReservationDays: string;
    sessionTimeoutHours: string;
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    emailAlertsEnabled: boolean;
    slackWebhookUrl: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
    platformName: 'ReservaYa',
    supportEmail: 'soporte@reservaya.com',
    logoUrl: '',
    maxReservationDays: '30',
    sessionTimeoutHours: '24',
    maintenanceMode: false,
    allowNewRegistrations: true,
    emailAlertsEnabled: true,
    slackWebhookUrl: ''
};

export default function AdminSettings() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (!token || userRole !== 'ADMIN') {
            router.push('/auth/login');
            return;
        }

        fetchSettings(token);
    }, [router]);

    const fetchSettings = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/admin/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
            }
        } catch (err) {
            console.error('Error loading settings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');

            const res = await fetch(`${API_URL}/admin/settings`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert('Error al guardar configuración');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error de conexión');
        } finally {
            setIsSaving(false);
        }
    };

    const ToggleSwitch = ({ value, onChange, activeColor = 'bg-orange-500' }: { value: boolean; onChange: () => void; activeColor?: string }) => (
        <button
            onClick={onChange}
            className={`w-11 h-6 rounded-full transition-colors ${value ? activeColor : 'bg-stone-300'}`}
        >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
        </button>
    );

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
                    <span className="text-green-700 font-medium">Configuración guardada correctamente</span>
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
                            <Label className="text-stone-700">Nombre de la Plataforma</Label>
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
                        <div>
                            <Label className="text-stone-700">URL del Logo</Label>
                            <Input
                                value={settings.logoUrl}
                                onChange={(e) => setSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                                placeholder="https://ejemplo.com/logo.png"
                                className="mt-1 border-stone-200 focus:border-orange-400"
                            />
                        </div>
                        <div>
                            <Label className="text-stone-700">Días Máximos para Reservar</Label>
                            <Input
                                type="number"
                                value={settings.maxReservationDays}
                                onChange={(e) => setSettings(prev => ({ ...prev, maxReservationDays: e.target.value }))}
                                className="mt-1 border-stone-200 focus:border-orange-400"
                            />
                            <p className="text-xs text-stone-400 mt-1">Cuántos días en el futuro pueden reservar los usuarios</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Seguridad */}
                <Card className="bg-white border border-stone-200">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-500" />
                            Seguridad
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div>
                            <Label className="text-stone-700">Timeout de Sesión (horas)</Label>
                            <Input
                                type="number"
                                value={settings.sessionTimeoutHours}
                                onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeoutHours: e.target.value }))}
                                className="mt-1 border-stone-200 focus:border-orange-400"
                            />
                            <p className="text-xs text-stone-400 mt-1">Tiempo antes de que expire la sesión del usuario</p>
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-stone-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-red-500" />
                                    <p className="font-medium text-stone-700">Modo Mantenimiento</p>
                                </div>
                                <p className="text-sm text-stone-400">Desactiva acceso público a la plataforma</p>
                            </div>
                            <ToggleSwitch
                                value={settings.maintenanceMode}
                                onChange={() => setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                                activeColor="bg-red-500"
                            />
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-stone-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-green-500" />
                                    <p className="font-medium text-stone-700">Permitir Registros</p>
                                </div>
                                <p className="text-sm text-stone-400">Permite que nuevos usuarios se registren</p>
                            </div>
                            <ToggleSwitch
                                value={settings.allowNewRegistrations}
                                onChange={() => setSettings(prev => ({ ...prev, allowNewRegistrations: !prev.allowNewRegistrations }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notificaciones */}
                <Card className="bg-white border border-stone-200 lg:col-span-2">
                    <CardHeader className="border-b border-stone-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-green-500" />
                            Notificaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-blue-500" />
                                        <p className="font-medium text-stone-700">Alertas por Email</p>
                                    </div>
                                    <p className="text-sm text-stone-400">Enviar emails para eventos importantes</p>
                                </div>
                                <ToggleSwitch
                                    value={settings.emailAlertsEnabled}
                                    onChange={() => setSettings(prev => ({ ...prev, emailAlertsEnabled: !prev.emailAlertsEnabled }))}
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-purple-500" />
                                    <Label className="text-stone-700">Slack Webhook URL</Label>
                                </div>
                                <Input
                                    value={settings.slackWebhookUrl}
                                    onChange={(e) => setSettings(prev => ({ ...prev, slackWebhookUrl: e.target.value }))}
                                    placeholder="https://hooks.slack.com/services/..."
                                    className="border-stone-200 focus:border-orange-400"
                                />
                                <p className="text-xs text-stone-400 mt-1">Para recibir alertas en tu canal de Slack</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6">
                <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 px-6">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
            </div>
        </AdminLayout>
    );
}
