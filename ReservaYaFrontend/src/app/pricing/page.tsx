'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, Check, X, Crown, Zap, Building2, QrCode,
    Package, Megaphone, BarChart3, Users, CreditCard,
    FileText, Globe, Headphones, Sparkles
} from 'lucide-react';

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 19,
        yearlyPrice: 190,
        desc: 'Perfecto para restaurantes que quieren menú QR',
        icon: Zap,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600'
    },
    {
        id: 'professional',
        name: 'Profesional',
        price: 49,
        yearlyPrice: 490,
        desc: 'Gestión completa con inventario y marketing',
        icon: Crown,
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-600',
        popular: true
    },
    {
        id: 'enterprise',
        name: 'Empresarial',
        price: 99,
        yearlyPrice: 990,
        desc: 'Para cadenas y alto volumen',
        icon: Building2,
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600'
    }
];

const FEATURES = [
    { name: 'Menú digital (meseros)', free: true, starter: true, professional: true, enterprise: true, icon: FileText },
    { name: 'Mesas ilimitadas', free: true, starter: true, professional: true, enterprise: true, icon: Users },
    { name: 'Reservas ilimitadas', free: true, starter: true, professional: true, enterprise: true, icon: CreditCard },
    { name: 'Menú QR para clientes', free: false, starter: true, professional: true, enterprise: true, icon: QrCode, highlight: 'starter' },
    { name: 'CRM de clientes', free: false, starter: true, professional: true, enterprise: true, icon: Users },
    { name: 'Reportes básicos', free: false, starter: true, professional: true, enterprise: true, icon: BarChart3 },
    { name: 'Facturación', free: false, starter: true, professional: true, enterprise: true, icon: CreditCard },
    { name: 'Control de inventario', free: false, starter: false, professional: true, enterprise: true, icon: Package, highlight: 'professional' },
    { name: 'Campañas de marketing', free: false, starter: false, professional: true, enterprise: true, icon: Megaphone },
    { name: 'Reportes avanzados', free: false, starter: false, professional: true, enterprise: true, icon: BarChart3 },
    { name: 'Multi-sucursal', free: false, starter: false, professional: false, enterprise: true, icon: Globe, highlight: 'enterprise' },
    { name: 'Acceso API', free: false, starter: false, professional: false, enterprise: true, icon: Globe },
    { name: 'Soporte prioritario', free: false, starter: false, professional: false, enterprise: true, icon: Headphones },
];

function PricingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedPlan, setSelectedPlan] = useState('professional');
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        const plan = searchParams.get('plan');
        if (plan && PLANS.find(p => p.id === plan)) {
            setSelectedPlan(plan);
        }
    }, [searchParams]);

    const currentPlan = PLANS.find(p => p.id === selectedPlan) || PLANS[1];
    const price = billingPeriod === 'yearly' ? currentPlan.yearlyPrice : currentPlan.price;

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Volver</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="ReservaYa" className="w-8 h-8 rounded-lg" />
                        <span className="font-bold text-lg">ReservaYa</span>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/auth/login')}>
                        Iniciar Sesión
                    </Button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-12">
                {/* Title */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-stone-900 mb-4">
                        Elige tu plan perfecto
                    </h1>
                    <p className="text-lg text-stone-600 max-w-2xl mx-auto">
                        Todos los planes incluyen mesas y reservas ilimitadas.
                        Paga solo por las funciones que necesitas.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <button
                            onClick={() => setBillingPeriod('monthly')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === 'monthly'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setBillingPeriod('yearly')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === 'yearly'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                        >
                            Anual <span className="text-emerald-500 font-bold">-17%</span>
                        </button>
                    </div>
                </div>

                {/* Plan Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {PLANS.map(plan => {
                        const Icon = plan.icon;
                        const isSelected = selectedPlan === plan.id;
                        const planPrice = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.price;

                        return (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative rounded-2xl p-6 cursor-pointer transition-all ${isSelected
                                        ? 'bg-white ring-2 ring-purple-500 shadow-xl'
                                        : 'bg-white border border-stone-200 hover:border-purple-200 hover:shadow-lg'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            RECOMENDADO
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-stone-900">{plan.name}</h3>
                                        <p className="text-sm text-stone-500">{plan.desc}</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <span className="text-4xl font-bold text-stone-900">${planPrice}</span>
                                    <span className="text-stone-500">/{billingPeriod === 'yearly' ? 'año' : 'mes'}</span>
                                </div>

                                <div className={`w-full h-1 rounded-full bg-gradient-to-r ${plan.color} ${isSelected ? 'opacity-100' : 'opacity-30'}`} />
                            </div>
                        );
                    })}
                </div>

                {/* Features Comparison */}
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-12">
                    <div className="p-6 border-b border-stone-200 bg-stone-50">
                        <h2 className="text-xl font-bold text-stone-900">Comparación de características</h2>
                    </div>

                    <div className="divide-y divide-stone-100">
                        {FEATURES.map((feature, i) => {
                            const FeatureIcon = feature.icon;
                            return (
                                <div key={i} className="flex items-center p-4 hover:bg-stone-50">
                                    <div className="flex items-center gap-3 flex-1">
                                        <FeatureIcon className="h-5 w-5 text-stone-400" />
                                        <span className="text-stone-700">{feature.name}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 text-center w-80">
                                        <div className="flex justify-center">
                                            {feature.free ? <Check className="h-5 w-5 text-emerald-500" /> : <X className="h-5 w-5 text-stone-300" />}
                                        </div>
                                        <div className="flex justify-center">
                                            {feature.starter ? (
                                                <Check className={`h-5 w-5 ${feature.highlight === 'starter' ? 'text-blue-500' : 'text-emerald-500'}`} />
                                            ) : <X className="h-5 w-5 text-stone-300" />}
                                        </div>
                                        <div className="flex justify-center">
                                            {feature.professional ? (
                                                <Check className={`h-5 w-5 ${feature.highlight === 'professional' ? 'text-purple-500' : 'text-emerald-500'}`} />
                                            ) : <X className="h-5 w-5 text-stone-300" />}
                                        </div>
                                        <div className="flex justify-center">
                                            {feature.enterprise ? (
                                                <Check className={`h-5 w-5 ${feature.highlight === 'enterprise' ? 'text-amber-500' : 'text-emerald-500'}`} />
                                            ) : <X className="h-5 w-5 text-stone-300" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Column Headers */}
                    <div className="flex items-center p-4 bg-stone-50 border-t border-stone-200">
                        <div className="flex-1" />
                        <div className="grid grid-cols-4 gap-4 text-center w-80 text-sm font-medium text-stone-600">
                            <span>Gratis</span>
                            <span>Starter</span>
                            <span>Pro</span>
                            <span>Empresa</span>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white">
                    <h2 className="text-2xl font-bold mb-2">
                        Comienza con {currentPlan.name} hoy
                    </h2>
                    <p className="text-purple-100 mb-6">
                        14 días de prueba gratis. Cancela cuando quieras.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button
                            size="lg"
                            className="bg-white text-purple-600 hover:bg-purple-50 rounded-full px-8"
                            onClick={() => router.push(`/auth/register-business?plan=${selectedPlan}`)}
                        >
                            Probar {currentPlan.name} Gratis
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/10 rounded-full px-8"
                            onClick={() => router.push('/auth/register-business')}
                        >
                            Empezar Gratis
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <PricingContent />
        </Suspense>
    );
}
