'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Calendar, Users, Star, ChefHat, ArrowRight, MapPin, Utensils, CheckCircle,
    Smartphone, BarChart3, Bell, Layout, Zap, Heart, Globe, Menu, X,
    Clock, CreditCard, TrendingUp, Sparkles, ArrowUpRight, Quote, Wine, Home
} from 'lucide-react';

export default function LandingPage() {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-rotate features
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % 4);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const features = [
        { icon: Calendar, title: 'Reserva Instantánea', desc: 'Confirma tu mesa en segundos, 24/7', color: 'orange' },
        { icon: MapPin, title: 'Descubre Cerca', desc: 'Encuentra los mejores lugares con GPS', color: 'blue' },
        { icon: Star, title: 'Reseñas Reales', desc: 'Opiniones verificadas de comensales', color: 'amber' },
        { icon: Smartphone, title: 'Check-in QR', desc: 'Escanea y listo al llegar', color: 'emerald' }
    ];

    return (
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-orange-500/30">
            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50
                ? 'bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.05]'
                : ''
                }`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
                        <img src="/logo.png" alt="ReservaYa" className="h-10 w-10 rounded-2xl shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow" />
                        <span className="text-2xl font-bold tracking-tight">ReservaYa</span>
                    </div>

                    <nav className="hidden lg:flex items-center gap-10">
                        {['Características', 'Para Restaurantes', 'Precios'].map((item, i) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                className="text-sm text-zinc-400 hover:text-white transition-colors relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:w-full transition-all duration-300" />
                            </a>
                        ))}
                    </nav>

                    <div className="hidden lg:flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/auth/login')}
                            className="text-zinc-300 hover:text-white hover:bg-white/5"
                        >
                            Iniciar Sesión
                        </Button>
                        <Button
                            onClick={() => router.push('/auth/register')}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-medium px-6 rounded-full shadow-lg shadow-orange-500/25"
                        >
                            Comenzar Gratis
                        </Button>
                    </div>

                    <button className="lg:hidden p-2 hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden absolute top-full left-0 right-0 bg-[#09090b] border-b border-white/10 p-6 space-y-4 animate-in slide-in-from-top-5">
                        {['Características', 'Para Restaurantes', 'Precios'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="block text-lg text-zinc-300 hover:text-white">{item}</a>
                        ))}
                        <div className="pt-4 space-y-3">
                            <Button variant="outline" className="w-full border-zinc-700" onClick={() => router.push('/auth/login')}>Iniciar Sesión</Button>
                            <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500" onClick={() => router.push('/auth/register')}>Comenzar Gratis</Button>
                        </div>
                    </div>
                )}
            </header>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* HERO SECTION */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-32 px-6 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.15),transparent_50%)]" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:72px_72px]" />

                <div className="max-w-6xl mx-auto relative">
                    {/* Badge */}
                    <div className="flex justify-center mb-10">
                        <div className="group inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-full hover:border-orange-500/40 transition-colors cursor-pointer">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                            </span>
                            <span className="text-sm text-zinc-300">
                                <span className="text-orange-400 font-semibold">+25,000</span> reservaciones este mes
                            </span>
                            <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-orange-400 transition-colors" />
                        </div>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-center text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
                        <span className="block text-white">Reservar mesa</span>
                        <span className="block mt-3 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                            nunca fue tan fácil
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-center text-xl lg:text-2xl text-zinc-400 max-w-2xl mx-auto mb-14 leading-relaxed">
                        La plataforma que conecta a comensales con los mejores restaurantes.
                        <span className="block text-zinc-300 mt-2">Sin llamadas. Sin esperas. Sin complicaciones.</span>
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                        <Button
                            size="lg"
                            onClick={() => router.push('/auth/register')}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-lg px-10 py-7 rounded-full font-medium group shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
                        >
                            <Heart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                            Quiero Reservar
                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => router.push('/pricing')}
                            className="border-zinc-700 text-zinc-300 hover:bg-white/5 hover:text-white hover:border-zinc-600 text-lg px-10 py-7 rounded-full group"
                        >
                            <ChefHat className="h-5 w-5 mr-2" />
                            Soy Restaurante
                        </Button>
                    </div>

                    {/* Feature Pills - Animated */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {features.map((feature, i) => {
                            const isActive = activeFeature === i;
                            return (
                                <div
                                    key={i}
                                    className={`p-5 rounded-2xl border transition-all duration-500 cursor-pointer ${isActive
                                        ? 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30 scale-[1.02]'
                                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                        }`}
                                    onClick={() => setActiveFeature(i)}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all ${isActive ? 'bg-orange-500' : 'bg-zinc-800'
                                        }`}>
                                        <feature.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-orange-400'}`} />
                                    </div>
                                    <h3 className="font-semibold text-white text-sm mb-1">{feature.title}</h3>
                                    <p className="text-zinc-500 text-xs">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* SOCIAL PROOF */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <section className="py-16 px-6 border-y border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-white mb-1">500+</div>
                            <div className="text-sm text-zinc-500">Restaurantes Activos</div>
                        </div>
                        <div className="hidden sm:block w-px h-12 bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-white mb-1">25K+</div>
                            <div className="text-sm text-zinc-500">Reservaciones/Mes</div>
                        </div>
                        <div className="hidden sm:block w-px h-12 bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-white mb-1">4.9</div>
                            <div className="text-sm text-zinc-500 flex items-center justify-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Rating Promedio
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-12 bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-white mb-1">10K+</div>
                            <div className="text-sm text-zinc-500">Usuarios Felices</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* FOR RESTAURANTS */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <section id="para-restaurantes" className="py-28 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-sm text-amber-400 mb-8">
                                <ChefHat className="h-4 w-4" />
                                Para Restaurantes
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                                Gestiona todo tu
                                <br />
                                <span className="text-zinc-400">negocio desde aquí</span>
                            </h2>
                            <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
                                Sistema integral con workspaces especializados para cada rol.
                                Tu equipo siempre conectado y organizado.
                            </p>

                            <div className="space-y-5 mb-10">
                                {[
                                    { icon: Layout, text: 'Mapa de mesas en tiempo real', highlight: true },
                                    { icon: BarChart3, text: 'Analytics y reportes detallados' },
                                    { icon: CreditCard, text: 'Facturación y control de pagos' },
                                    { icon: Users, text: 'CRM con historial de clientes' }
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${item.highlight ? 'bg-orange-500/5 border border-orange-500/20' : 'hover:bg-white/[0.02]'
                                        }`}>
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.highlight ? 'bg-orange-500' : 'bg-zinc-800'}`}>
                                            <item.icon className={`h-5 w-5 ${item.highlight ? 'text-white' : 'text-orange-400'}`} />
                                        </div>
                                        <span className="text-zinc-200">{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={() => router.push('/pricing')}
                                className="bg-white text-black hover:bg-zinc-200 font-medium px-8 py-6 rounded-full group"
                            >
                                Ver Planes
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>

                        {/* Workspaces Visual */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-3xl blur-3xl" />
                            <div className="relative grid grid-cols-2 gap-4">
                                {[
                                    { icon: ChefHat, role: 'Cocina', desc: 'Órdenes por estación', color: 'from-red-500/20 to-orange-500/20', iconColor: 'text-red-400' },
                                    { icon: Utensils, role: 'Mesero', desc: 'Toma de órdenes', color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
                                    { icon: Wine, role: 'Bar', desc: 'Pedidos de bebidas', color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
                                    { icon: Home, role: 'Host', desc: 'Recibe y asigna', color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400' }
                                ].map((ws, i) => (
                                    <div
                                        key={i}
                                        className={`aspect-square bg-gradient-to-br ${ws.color} border border-white/10 rounded-3xl flex flex-col items-center justify-center hover:scale-105 hover:border-white/20 transition-all cursor-pointer group`}
                                    >
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <ws.icon className={`h-7 w-7 ${ws.iconColor}`} />
                                        </div>
                                        <span className="font-bold text-lg">{ws.role}</span>
                                        <span className="text-xs text-zinc-500 mt-1">{ws.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* TESTIMONIALS */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <section className="py-28 px-6 bg-gradient-to-b from-transparent via-zinc-900/30 to-transparent">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                            Lo que dicen de nosotros
                        </h2>
                        <p className="text-zinc-400 text-lg">Miles de usuarios satisfechos</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { name: 'María García', role: 'Foodie', text: '¡Increíble! Reservé mesa para mi cumpleaños en 2 minutos. La app es súper intuitiva y el QR funciona perfecto.' },
                            { name: 'Chef Roberto', role: 'Propietario', text: 'Nuestras reservaciones aumentaron 40% y ahora gestiono todo desde mi celular. El mejor sistema que he usado.' },
                            { name: 'Ana López', role: 'Cliente Frecuente', text: 'Me encanta ver las fotos del menú antes de reservar. Ya tengo mis 15 restaurantes favoritos guardados.' }
                        ].map((t, i) => (
                            <div key={i} className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-3xl p-8 transition-all">
                                <Quote className="h-8 w-8 text-orange-500/30 mb-4" />
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-zinc-300 leading-relaxed mb-8">"{t.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {t.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white">{t.name}</div>
                                        <div className="text-sm text-zinc-500">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* PRICING */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <section id="precios" className="py-28 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400 mb-6">
                            <Zap className="h-4 w-4" />
                            Empieza gratis, escala cuando quieras
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                            Planes simples y transparentes
                        </h2>
                        <p className="text-xl text-zinc-400">Sin sorpresas. Sin contratos.</p>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-5">
                        {[
                            { name: 'Gratis', price: 0, desc: 'Perfecto para empezar', features: ['Menú digital básico', 'Mesas ilimitadas', 'Reservas ilimitadas', '3 empleados'], cta: 'Comenzar Gratis', color: 'emerald' },
                            { name: 'Starter', price: 19, desc: 'Para restaurantes en crecimiento', features: ['Todo de Gratis', 'Menú QR clientes', 'CRM de clientes', 'Reportes básicos'], cta: 'Elegir Plan', color: 'blue' },
                            { name: 'Pro', price: 49, desc: 'La opción más popular', features: ['Todo de Starter', 'Inventario', 'Marketing', '15 empleados'], cta: 'Elegir Plan', color: 'orange', popular: true },
                            { name: 'Enterprise', price: 99, desc: 'Para cadenas y franquicias', features: ['Todo de Pro', 'Multi-sucursal', 'API access', 'Soporte 24/7'], cta: 'Contactar', color: 'purple' }
                        ].map((plan, i) => (
                            <div
                                key={i}
                                className={`relative rounded-3xl p-8 border transition-all hover:-translate-y-2 ${plan.popular
                                    ? 'bg-gradient-to-b from-orange-500/10 to-transparent border-orange-500/30 scale-[1.02]'
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/25">
                                            MÁS POPULAR
                                        </span>
                                    </div>
                                )}

                                <div className="mb-8 pt-2">
                                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                                    <p className="text-sm text-zinc-500">{plan.desc}</p>
                                    <div className="flex items-baseline gap-1 mt-4">
                                        <span className="text-5xl font-bold">${plan.price}</span>
                                        <span className="text-zinc-500">/mes</span>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-3 text-sm text-zinc-300">
                                            <CheckCircle className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-orange-400' : 'text-emerald-400'}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={`w-full rounded-full py-6 ${plan.popular
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25'
                                        : plan.price === 0
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                    onClick={() => router.push(plan.price === 0 ? '/auth/register-business' : '/pricing')}
                                >
                                    {plan.cta}
                                </Button>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-zinc-500 text-sm mt-10">
                        14 días de prueba gratis en todos los planes de pago. Sin tarjeta de crédito.
                    </p>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* FINAL CTA */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-transparent to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px]" />

                <div className="max-w-3xl mx-auto text-center relative">
                    <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                        ¿Listo para empezar?
                    </h2>
                    <p className="text-xl text-zinc-400 mb-10">
                        Únete a miles de usuarios y restaurantes que ya disfrutan ReservaYa.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => router.push('/auth/register')}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-lg px-12 py-8 rounded-full font-medium group shadow-2xl shadow-orange-500/30"
                    >
                        Crear Cuenta Gratis
                        <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-zinc-600 text-sm mt-8">Sin tarjeta de crédito • Configuración en 2 minutos</p>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* FOOTER */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <footer className="border-t border-white/5 py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-5 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <img src="/logo.png" alt="ReservaYa" className="h-10 w-10 rounded-2xl" />
                                <span className="text-2xl font-bold">ReservaYa</span>
                            </div>
                            <p className="text-zinc-500 text-sm mb-6 max-w-xs">
                                La plataforma líder de reservaciones y gestión para restaurantes en Centroamérica.
                            </p>
                            <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                <Globe className="h-4 w-4" />
                                Hecho con ❤️ en Nicaragua
                            </div>
                        </div>

                        {[
                            { title: 'Producto', links: ['Características', 'Precios', 'Para Restaurantes', 'Integraciones'] },
                            { title: 'Compañía', links: ['Sobre Nosotros', 'Blog', 'Carreras', 'Contacto'] },
                            { title: 'Legal', links: ['Términos', 'Privacidad', 'Cookies'] }
                        ].map((col, i) => (
                            <div key={i}>
                                <h4 className="font-semibold mb-5">{col.title}</h4>
                                <ul className="space-y-3">
                                    {col.links.map((link, j) => (
                                        <li key={j}>
                                            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">{link}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-zinc-600 text-sm">© 2024 ReservaYa. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
