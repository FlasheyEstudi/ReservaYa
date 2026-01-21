'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    CreditCard, Check, X, Crown, Zap, Building2, Sparkles,
    Users, Table2, CalendarCheck, Package, Megaphone, BarChart3,
    Clock, Loader2, CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { getApiUrl } from '@/lib/api';

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
    features: {
        inventory?: boolean;
        marketing?: boolean;
        reports?: boolean;
        customers?: boolean;
        invoices?: boolean;
        advancedReports?: boolean;
    };
    trialDays: number;
}

interface UsageStats {
    plan: { name: string; displayName: string; priceMonthly: number; };
    subscription: { status: string; trialEndsAt: string | null; currentPeriodEnd: string | null; } | null;
    isActive: boolean;
    isTrial: boolean;
    limits: {
        tables: { current: number; max: number };
        employees: { current: number; max: number };
        reservationsMonth: { current: number; max: number };
    };
    features: Record<string, boolean>;
}

const PLAN_ICONS: Record<string, any> = { free: Sparkles, starter: Zap, professional: Crown, enterprise: Building2 };
const PLAN_COLORS: Record<string, string> = {
    free: 'bg-stone-100 text-stone-700',
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700'
};

function SubscriptionContent() {
    const searchParams = useSearchParams();
    const { showSuccess, showError } = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
    const [processing, setProcessing] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    // Payment status from URL
    const paymentStatus = searchParams.get('payment');
    const isSimulated = searchParams.get('simulated') === 'true';

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const plansRes = await fetch(`${getApiUrl()}/billing/plans`);
            if (plansRes.ok) { const data = await plansRes.json(); setPlans(data.plans || []); }

            if (token) {
                const usageRes = await fetch(`${getApiUrl()}/billing/subscription`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (usageRes.ok) { const data = await usageRes.json(); setUsage(data); }
            }
        } catch (err) { console.error('Error:', err); }
        finally { setLoading(false); }
    };

    const handleCheckout = async () => {
        if (!checkoutPlan) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        setProcessing(true);
        try {
            const res = await fetch(`${getApiUrl()}/billing/checkout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: checkoutPlan.id, billingPeriod })
            });

            const data = await res.json();

            if (data.success && data.redirectUrl) {
                // Redirect to payment page (Pagadito or simulated)
                window.location.href = data.redirectUrl;
            } else {
                showError('Error de pago', data.error || 'No se pudo iniciar el pago');
                setProcessing(false);
            }
        } catch (err) {
            console.error(err);
            showError('Error de conexión', 'No se pudo conectar con el servidor');
            setProcessing(false);
        }
    };

    const handleStartTrial = async (planName: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${getApiUrl()}/billing/subscription`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ planName })
            });
            if (res.ok) {
                const data = await res.json();
                showSuccess('¡Trial activado!', data.message || 'Disfruta tu período de prueba');
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const handleCancel = async () => {
        if (!confirm('¿Cancelar suscripción? Volverás al plan gratuito.')) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${getApiUrl()}/billing/subscription`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel' })
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const getUsagePercent = (c: number, m: number) => Math.min(100, (c / m) * 100);
    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : '-';
    const getPrice = (plan: Plan) => billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;

    if (loading) return <ManageLayout title="Suscripción" subtitle="Cargando..."><div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div></ManageLayout>;

    return (
        <ManageLayout title="Mi Plan" subtitle="Administra tu suscripción">
            {/* Payment Status Banner */}
            {paymentStatus === 'success' && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                    <div>
                        <p className="font-semibold text-emerald-800">¡Pago procesado exitosamente!</p>
                        <p className="text-sm text-emerald-600">
                            {isSimulated ? 'Modo simulación - En producción se conectará a Pagadito.' : 'Tu suscripción está activa.'}
                        </p>
                    </div>
                </div>
            )}

            {paymentStatus === 'pending' && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                    <Clock className="h-6 w-6 text-amber-600" />
                    <div>
                        <p className="font-semibold text-amber-800">Pago pendiente</p>
                        <p className="text-sm text-amber-600">Tu pago está siendo procesado. Puede tomar unos minutos.</p>
                    </div>
                </div>
            )}

            {(paymentStatus === 'failed' || paymentStatus === 'error') && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                        <p className="font-semibold text-red-800">Error en el pago</p>
                        <p className="text-sm text-red-600">No se pudo procesar tu pago. Intenta nuevamente.</p>
                    </div>
                </div>
            )}

            {/* Current Plan */}
            {usage && (
                <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${PLAN_COLORS[usage.plan.name]}`}>
                                    {PLAN_ICONS[usage.plan.name] && (() => { const Icon = PLAN_ICONS[usage.plan.name]; return <Icon className="h-7 w-7" />; })()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{usage.plan.displayName}</h2>
                                    <div className="flex gap-2 mt-1">
                                        {usage.isTrial && <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />Prueba hasta {formatDate(usage.subscription?.trialEndsAt || null)}</Badge>}
                                        {usage.subscription?.status === 'active' && <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>}
                                        {usage.subscription?.status === 'pending' && <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-purple-600">${usage.plan.priceMonthly}<span className="text-sm text-stone-500">/mes</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Usage Stats */}
            {usage && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { icon: Table2, label: 'Mesas', ...usage.limits.tables, color: 'blue' },
                        { icon: Users, label: 'Empleados', ...usage.limits.employees, color: 'emerald' },
                        { icon: CalendarCheck, label: 'Reservas/Mes', ...usage.limits.reservationsMonth, color: 'purple' }
                    ].map((l, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 bg-${l.color}-100 rounded-lg flex items-center justify-center`}>
                                        <l.icon className={`h-5 w-5 text-${l.color}-600`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-stone-500">{l.label}</p>
                                        <p className="font-bold">{l.current} / {l.max}</p>
                                    </div>
                                </div>
                                <Progress value={getUsagePercent(l.current, l.max)} className="h-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Features Grid */}
            {usage && (
                <Card className="mb-6">
                    <CardHeader className="pb-2"><CardTitle className="text-lg">Funciones</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-6 gap-3">
                            {[
                                { key: 'inventory', label: 'Inventario', icon: Package },
                                { key: 'marketing', label: 'Marketing', icon: Megaphone },
                                { key: 'reports', label: 'Reportes', icon: BarChart3 },
                                { key: 'customers', label: 'Clientes', icon: Users },
                                { key: 'invoices', label: 'Facturas', icon: CreditCard },
                                { key: 'advancedReports', label: 'Avanzados', icon: BarChart3 },
                            ].map(f => {
                                const enabled = usage.features[f.key];
                                return (
                                    <div key={f.key} className={`p-3 rounded-xl text-center ${enabled ? 'bg-emerald-50' : 'bg-stone-50'}`}>
                                        <f.icon className={`h-5 w-5 mx-auto mb-1 ${enabled ? 'text-emerald-600' : 'text-stone-400'}`} />
                                        <p className={`text-xs ${enabled ? 'text-emerald-700' : 'text-stone-500'}`}>{f.label}</p>
                                        {enabled ? <Check className="h-3 w-3 text-emerald-600 mx-auto" /> : <X className="h-3 w-3 text-stone-400 mx-auto" />}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Billing Period Toggle */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Cambiar Plan</h2>
                <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-full">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billingPeriod === 'monthly' ? 'bg-white shadow text-purple-600' : 'text-stone-500'}`}
                    >
                        Mensual
                    </button>
                    <button
                        onClick={() => setBillingPeriod('yearly')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billingPeriod === 'yearly' ? 'bg-white shadow text-purple-600' : 'text-stone-500'}`}
                    >
                        Anual <span className="text-emerald-600 text-xs">-17%</span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-4 gap-4">
                {plans.map(plan => {
                    const Icon = PLAN_ICONS[plan.name] || CreditCard;
                    const isCurrent = usage?.plan.name === plan.name;
                    const price = getPrice(plan);

                    return (
                        <Card key={plan.id} className={`relative ${isCurrent ? 'ring-2 ring-purple-500' : ''}`}>
                            {isCurrent && <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10"><Badge className="bg-purple-600 text-white text-xs">Actual</Badge></div>}
                            <CardHeader className="text-center pb-2">
                                <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2 ${PLAN_COLORS[plan.name]}`}><Icon className="h-5 w-5" /></div>
                                <CardTitle className="text-base">{plan.displayName}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-2xl font-bold">${price}<span className="text-sm text-stone-500">/{billingPeriod === 'yearly' ? 'año' : 'mes'}</span></p>
                                <ul className="text-xs text-stone-600 mt-3 space-y-1">
                                    <li>{plan.maxTables} mesas</li>
                                    <li>{plan.maxEmployees} empleados</li>
                                    <li>{plan.maxReservationsMonth} reservas</li>
                                </ul>

                                {plan.name === 'free' ? (
                                    <Button className="w-full mt-4" variant="outline" disabled={isCurrent}>
                                        {isCurrent ? 'Actual' : 'Downgrade'}
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full mt-4"
                                        disabled={isCurrent}
                                        onClick={() => isCurrent ? null : setCheckoutPlan(plan)}
                                    >
                                        {isCurrent ? 'Actual' : plan.trialDays > 0 ? `${plan.trialDays} días gratis` : 'Seleccionar'}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {usage && usage.plan.name !== 'free' && (
                <div className="mt-6 text-center">
                    <button onClick={handleCancel} className="text-sm text-stone-500 hover:text-red-600 underline">Cancelar suscripción</button>
                </div>
            )}

            {/* Checkout Modal */}
            {checkoutPlan && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !processing && setCheckoutPlan(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Confirmar Suscripción</h3>

                        <div className="bg-purple-50 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${PLAN_COLORS[checkoutPlan.name]}`}>
                                    {PLAN_ICONS[checkoutPlan.name] && (() => { const Icon = PLAN_ICONS[checkoutPlan.name]; return <Icon className="h-6 w-6" />; })()}
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{checkoutPlan.displayName}</p>
                                    <p className="text-sm text-stone-500">{checkoutPlan.description}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-purple-100">
                                <span className="text-stone-600">Total a pagar:</span>
                                <span className="text-2xl font-bold text-purple-600">
                                    ${getPrice(checkoutPlan)}
                                    <span className="text-sm text-stone-500">/{billingPeriod === 'yearly' ? 'año' : 'mes'}</span>
                                </span>
                            </div>
                        </div>

                        {checkoutPlan.trialDays > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-center">
                                <p className="text-amber-800 font-medium">🎉 ¡{checkoutPlan.trialDays} días gratis!</p>
                                <p className="text-sm text-amber-600">No se cobrará hasta terminar el período de prueba</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setCheckoutPlan(null)}
                                disabled={processing}
                            >
                                Cancelar
                            </Button>

                            {checkoutPlan.trialDays > 0 ? (
                                <Button
                                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                                    onClick={() => { handleStartTrial(checkoutPlan.name); setCheckoutPlan(null); }}
                                    disabled={processing}
                                >
                                    Iniciar Trial Gratis
                                </Button>
                            ) : (
                                <Button
                                    className="flex-1"
                                    onClick={handleCheckout}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Procesando...</>
                                    ) : (
                                        <><ExternalLink className="h-4 w-4 mr-2" />Pagar con Pagadito</>
                                    )}
                                </Button>
                            )}
                        </div>

                        <p className="text-xs text-stone-400 text-center mt-4">
                            Serás redirigido a Pagadito para completar el pago de forma segura.
                        </p>
                    </div>
                </div>
            )}
        </ManageLayout>
    );
}

export default function SubscriptionPage() {
    return (
        <Suspense fallback={<ManageLayout title="Suscripción" subtitle="Cargando..."><div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div></ManageLayout>}>
            <SubscriptionContent />
        </Suspense>
    );
}
