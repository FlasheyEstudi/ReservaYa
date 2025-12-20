'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Calendar, Users, Star, ChefHat, Shield, Clock, ArrowRight, MapPin,
    Utensils, Phone, CheckCircle, Smartphone, BarChart3, UserCheck,
    Bell, CreditCard, Layout, Zap, Heart, TrendingUp, Globe
} from 'lucide-react';

export default function LandingPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'users' | 'restaurants'>('users');
    const [animatedStats, setAnimatedStats] = useState({ restaurants: 0, reservations: 0, users: 0 });

    // Animate stats on mount
    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const interval = duration / steps;

        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            setAnimatedStats({
                restaurants: Math.floor(500 * progress),
                reservations: Math.floor(25000 * progress),
                users: Math.floor(10000 * progress)
            });
            if (step >= steps) clearInterval(timer);
        }, interval);

        return () => clearInterval(timer);
    }, []);

    const userSteps = [
        { icon: MapPin, title: 'Descubre', desc: 'Explora restaurantes cerca de ti con fotos, menús y reseñas reales', color: 'from-orange-500 to-red-500' },
        { icon: Calendar, title: 'Reserva', desc: 'Elige fecha, hora y mesa en solo 3 clics. Sin llamadas.', color: 'from-amber-500 to-orange-500' },
        { icon: Smartphone, title: 'Confirma', desc: 'Recibe confirmación instantánea y código QR en tu celular', color: 'from-yellow-500 to-amber-500' }
    ];

    const restaurantFeatures = [
        { icon: Layout, title: 'Gestión Visual de Mesas', desc: 'Diseña el layout de tu restaurante y visualiza ocupación en tiempo real', highlight: true },
        { icon: UserCheck, title: 'Espacio para Empleados', desc: 'Cada rol tiene su workspace: meseros, cocina, bar, host. Todo conectado.', highlight: true },
        { icon: BarChart3, title: 'Reportes y Analytics', desc: 'Métricas de ventas, ocupación, platos populares y más', highlight: false },
        { icon: Bell, title: 'Notificaciones', desc: 'Alertas de reservaciones, órdenes pendientes y stock bajo', highlight: false },
        { icon: CreditCard, title: 'Facturación Integrada', desc: 'Genera facturas, cierra cuentas y lleva control de ingresos', highlight: false },
        { icon: Users, title: 'Base de Clientes', desc: 'Conoce a tus clientes VIP, historial de visitas y preferencias', highlight: false }
    ];

    const testimonials = [
        { name: 'María García', role: 'Cliente Frecuente', text: '¡Increíble! Reservé mesa para mi cumpleaños en 2 minutos. La app es súper intuitiva.', rating: 5, avatar: 'M' },
        { name: 'Chef Roberto', role: 'Dueño de Restaurante', text: 'Nuestras reservaciones aumentaron 40% desde que usamos ReservaYa. Los empleados aman sus workspaces.', rating: 5, avatar: 'R' },
        { name: 'Ana López', role: 'Foodie', text: 'Me encanta poder ver las fotos del menú y las reseñas antes de reservar. Ya tengo 15 restaurantes favoritos.', rating: 5, avatar: 'A' }
    ];

    return (
        <div className="min-h-screen bg-stone-950 overflow-x-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/50">
                <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="ReservaYa Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-contain" />
                        <span className="text-lg md:text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                            ReservaYa
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-8 text-sm">
                        <a href="#features" className="text-stone-400 hover:text-white transition-colors">Características</a>
                        <a href="#restaurants" className="text-stone-400 hover:text-white transition-colors">Para Restaurantes</a>
                        <a href="#pricing" className="text-stone-400 hover:text-white transition-colors">Precios</a>
                        <a href="#testimonials" className="text-stone-400 hover:text-white transition-colors">Testimonios</a>
                    </nav>

                    <div className="flex items-center gap-2 md:gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/auth/login')}
                            className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 font-medium text-sm px-3 md:px-4"
                        >
                            <span className="hidden sm:inline">Iniciar Sesión</span>
                            <span className="sm:hidden">Entrar</span>
                        </Button>
                        <Button
                            onClick={() => router.push('/auth/register')}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full px-4 md:px-6 text-sm shadow-lg shadow-orange-500/20"
                        >
                            <span className="hidden sm:inline">Comenzar Gratis</span>
                            <span className="sm:hidden">Registro</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20 md:pt-28 pb-16 md:pb-24 px-4 overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-b from-orange-600/10 via-transparent to-transparent" />
                <div className="absolute top-20 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-orange-500/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse" />
                <div className="absolute top-40 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-amber-500/15 rounded-full blur-[60px] md:blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-stone-950 to-transparent" />

                <div className="max-w-6xl mx-auto text-center relative">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 mb-6 md:mb-8 px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-full backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-orange-300 text-xs md:text-sm font-medium">+{animatedStats.reservations.toLocaleString()} reservaciones</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 md:mb-6 leading-[0.95] tracking-tight">
                        La forma
                        <span
                            className="block text-orange-400"
                            style={{
                                background: 'linear-gradient(90deg, #fb923c, #fbbf24, #fb923c)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            más inteligente
                        </span>
                        <span className="block text-stone-300 text-2xl sm:text-3xl md:text-5xl lg:text-6xl mt-2 font-normal">
                            de reservar y gestionar
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-2xl text-stone-400 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
                        Para <span className="text-orange-400 font-semibold">clientes</span>: reserva en segundos.
                        <br className="sm:hidden" />
                        <span className="hidden sm:inline"> </span>Para <span className="text-amber-400 font-semibold">restaurantes</span>: gestiona todo.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-10 md:mb-16 px-4">
                        <Button
                            size="lg"
                            onClick={() => router.push('/auth/register')}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full px-8 md:px-12 py-5 md:py-7 text-base md:text-lg font-semibold shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105"
                        >
                            <Heart className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                            Quiero Reservar
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => router.push('/auth/register')}
                            className="rounded-full px-8 md:px-12 py-5 md:py-7 text-base md:text-lg border-2 border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white hover:border-stone-600 transition-all"
                        >
                            <ChefHat className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                            Soy Restaurante
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{animatedStats.restaurants}+</div>
                            <div className="text-stone-500 text-xs md:text-sm">Restaurantes</div>
                        </div>
                        <div className="text-center border-x border-stone-800">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{(animatedStats.reservations / 1000).toFixed(0)}k+</div>
                            <div className="text-stone-500 text-xs md:text-sm">Reservaciones</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{(animatedStats.users / 1000).toFixed(0)}k+</div>
                            <div className="text-stone-500 text-xs md:text-sm">Usuarios Felices</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tab Section - For Users / For Restaurants */}
            <section id="features" className="py-24 px-4 bg-stone-900/30">
                <div className="max-w-6xl mx-auto">
                    {/* Toggle */}
                    <div className="flex justify-center mb-16">
                        <div className="inline-flex p-1.5 bg-stone-800/50 rounded-full border border-stone-700/50">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-8 py-3 rounded-full font-medium text-sm transition-all ${activeTab === 'users'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                                    : 'text-stone-400 hover:text-white'
                                    }`}
                            >
                                <Users className="h-4 w-4 inline mr-2" />
                                Para Usuarios
                            </button>
                            <button
                                onClick={() => setActiveTab('restaurants')}
                                className={`px-8 py-3 rounded-full font-medium text-sm transition-all ${activeTab === 'restaurants'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                                    : 'text-stone-400 hover:text-white'
                                    }`}
                            >
                                <ChefHat className="h-4 w-4 inline mr-2" />
                                Para Restaurantes
                            </button>
                        </div>
                    </div>

                    {/* User Content */}
                    {activeTab === 'users' && (
                        <div className="animate-fadeIn">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                                    Reserva en <span className="text-orange-400">3 simples pasos</span>
                                </h2>
                                <p className="text-stone-400 text-lg max-w-2xl mx-auto">
                                    Una interfaz familiar, sin complicaciones. Como pedir un taxi, pero para tu cena.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8 mb-16">
                                {userSteps.map((step, i) => (
                                    <div key={i} className="relative group">
                                        {/* Connector line */}
                                        {i < userSteps.length - 1 && (
                                            <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-stone-700 to-stone-800" />
                                        )}

                                        <div className="bg-stone-900/50 border border-stone-800 rounded-3xl p-8 hover:border-orange-500/30 transition-all hover:shadow-2xl hover:shadow-orange-500/5 hover:-translate-y-2">
                                            <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                                <step.icon className="h-10 w-10 text-white" />
                                            </div>
                                            <div className="text-stone-500 text-sm font-medium mb-2">Paso {i + 1}</div>
                                            <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                                            <p className="text-stone-400 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* User Benefits */}
                            <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 md:p-12 border border-stone-700/50">
                                <div className="grid md:grid-cols-2 gap-12 items-center">
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                                            Todo lo que necesitas, en tu bolsillo
                                        </h3>
                                        <ul className="space-y-4">
                                            {[
                                                'Fotos reales de platillos y ambientes',
                                                'Reseñas verificadas de otros comensales',
                                                'Código QR para check-in automático',
                                                'Historial de reservaciones y favoritos',
                                                'Notificaciones y recordatorios',
                                                'Cancelación fácil si cambias de planes'
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-stone-300">
                                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="relative">
                                        <div className="aspect-[4/5] bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-3xl flex items-center justify-center border border-orange-500/20">
                                            <div className="text-center">
                                                <Smartphone className="h-24 w-24 text-orange-400 mx-auto mb-4" />
                                                <p className="text-stone-400">Interfaz móvil intuitiva</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Restaurant Content */}
                    {activeTab === 'restaurants' && (
                        <div className="animate-fadeIn" id="restaurants">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                                    Gestiona tu restaurante <span className="text-amber-400">completo</span>
                                </h2>
                                <p className="text-stone-400 text-lg max-w-2xl mx-auto">
                                    Un sistema integral con workspaces especializados para cada rol de tu equipo.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                                {restaurantFeatures.map((feature, i) => (
                                    <div
                                        key={i}
                                        className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${feature.highlight
                                            ? 'bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30 hover:border-orange-500/50'
                                            : 'bg-stone-900/50 border-stone-800 hover:border-stone-700'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.highlight
                                            ? 'bg-gradient-to-br from-orange-500 to-amber-500'
                                            : 'bg-stone-800'
                                            }`}>
                                            <feature.icon className={`h-6 w-6 ${feature.highlight ? 'text-white' : 'text-orange-400'}`} />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                        <p className="text-stone-400 text-sm">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Employee Workspaces */}
                            <div className="bg-gradient-to-br from-amber-500/10 via-stone-900 to-orange-500/10 rounded-3xl p-8 md:p-12 border border-amber-500/20">
                                <div className="text-center mb-10">
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                        Workspaces para cada rol
                                    </h3>
                                    <p className="text-stone-400">Cada empleado tiene su espacio optimizado</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { icon: '👨‍🍳', role: 'Cocina', desc: 'Ve órdenes pendientes por estación' },
                                        { icon: '🍽️', role: 'Mesero', desc: 'Toma órdenes y maneja mesas' },
                                        { icon: '🍸', role: 'Bar', desc: 'Pedidos de bebidas separados' },
                                        { icon: '🏠', role: 'Host', desc: 'Recibe clientes y asigna mesas' }
                                    ].map((ws, i) => (
                                        <div key={i} className="bg-stone-800/50 rounded-2xl p-6 text-center border border-stone-700/50 hover:border-amber-500/30 transition-all">
                                            <div className="text-4xl mb-3">{ws.icon}</div>
                                            <h4 className="font-bold text-white mb-1">{ws.role}</h4>
                                            <p className="text-stone-500 text-xs">{ws.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-center mt-10">
                                    <Button
                                        size="lg"
                                        onClick={() => router.push('/auth/register')}
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-10 font-semibold shadow-lg"
                                    >
                                        Registrar mi Restaurante
                                        <ArrowRight className="h-5 w-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                            Lo que dicen de <span className="text-orange-400">nosotros</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <div key={i} className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6 hover:border-orange-500/20 transition-all">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(t.rating)].map((_, j) => (
                                        <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-stone-300 mb-6 leading-relaxed">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white">{t.name}</div>
                                        <div className="text-stone-500 text-sm">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 px-4 bg-stone-900/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <Zap className="h-4 w-4 text-emerald-400" />
                            <span className="text-emerald-400 text-sm font-medium">Empieza gratis, crece a tu ritmo</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                            Planes para <span className="text-amber-400">cada restaurante</span>
                        </h2>
                        <p className="text-stone-400 text-lg max-w-2xl mx-auto">
                            Funciones básicas gratis para siempre. Planes premium para escalar tu negocio.
                        </p>
                    </div>

                    {/* Why Upgrade Box */}
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 mb-12">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">¿Por qué pagar si es gratis?</h3>
                                    <p className="text-stone-400 text-sm">
                                        El plan gratuito es perfecto para empezar. Pero cuando quieras <span className="text-amber-400 font-medium">más mesas, más empleados, inventario, marketing y reportes avanzados</span>, los planes premium te dan todo el poder.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 flex-shrink-0">
                                <div className="text-center px-4 py-2 bg-stone-800/50 rounded-lg">
                                    <div className="text-2xl font-bold text-amber-400">40%</div>
                                    <div className="text-xs text-stone-500">más reservas</div>
                                </div>
                                <div className="text-center px-4 py-2 bg-stone-800/50 rounded-lg">
                                    <div className="text-2xl font-bold text-emerald-400">2x</div>
                                    <div className="text-xs text-stone-500">eficiencia</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                name: 'Gratis',
                                price: 0,
                                desc: 'Menú digital básico',
                                features: ['Menú digital para meseros', 'Mesas ilimitadas', 'Reservas ilimitadas', 'Hasta 3 empleados'],
                                popular: false,
                                highlight: null
                            },
                            {
                                name: 'Starter',
                                price: 19,
                                desc: 'Menú QR para clientes',
                                features: ['Todo de Gratis +', 'Menú QR para clientes', 'CRM de clientes', 'Reportes básicos', 'Facturación'],
                                popular: false,
                                highlight: 'Menú QR'
                            },
                            {
                                name: 'Profesional',
                                price: 49,
                                desc: 'Gestión completa',
                                features: ['Todo de Starter +', 'Control de inventario', 'Campañas marketing', 'Reportes avanzados', 'Hasta 15 empleados'],
                                popular: true,
                                highlight: 'Inventario'
                            },
                            {
                                name: 'Empresarial',
                                price: 99,
                                desc: 'Cadenas y franquicias',
                                features: ['Todo de Profesional +', 'Empleados ilimitados', 'Multi-sucursal', 'Acceso API', 'Soporte prioritario'],
                                popular: false,
                                highlight: 'Multi-sucursal'
                            }
                        ].map((plan, i) => (
                            <div
                                key={i}
                                className={`relative rounded-2xl p-6 border transition-all hover:-translate-y-2 ${plan.popular
                                    ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/50 shadow-xl shadow-amber-500/10'
                                    : 'bg-stone-900/50 border-stone-800 hover:border-stone-700'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            MÁS POPULAR
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                                    <p className="text-stone-500 text-sm">{plan.desc}</p>
                                    {plan.highlight && (
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                                            ✨ {plan.highlight}
                                        </span>
                                    )}
                                </div>

                                <div className="text-center mb-6">
                                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                                    <span className="text-stone-500">/mes</span>
                                </div>

                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm text-stone-300">
                                            <CheckCircle className={`h-4 w-4 flex-shrink-0 ${plan.popular ? 'text-amber-400' : 'text-emerald-400'}`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={`w-full rounded-full ${plan.popular
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                                        : plan.price === 0
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : 'bg-white/10 hover:bg-white/20 text-white border border-stone-700'
                                        }`}
                                    onClick={() => router.push(plan.price === 0 ? '/auth/register-business' : `/pricing?plan=${plan.name.toLowerCase()}`)}
                                >
                                    {plan.price === 0 ? 'Comenzar Gratis' : 'Ver características'}
                                </Button>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-stone-500 text-sm mt-8">
                        Mesas y reservas ilimitadas en todos los planes. Planes de pago con 14 días de prueba gratis.
                    </p>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-orange-600/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/30 rounded-full blur-[150px]" />

                <div className="max-w-4xl mx-auto text-center relative">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 rounded-full">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <span className="text-white text-sm">Registro gratuito, sin tarjeta de crédito</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        ¿Listo para empezar?
                    </h2>
                    <p className="text-xl text-stone-300 mb-10 max-w-2xl mx-auto">
                        Únete a miles de usuarios y restaurantes que ya disfrutan ReservaYa.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => router.push('/auth/register')}
                            className="bg-white text-orange-600 hover:bg-orange-50 rounded-full px-12 py-7 text-lg font-bold shadow-2xl"
                        >
                            Crear Cuenta Gratis
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-stone-950 border-t border-stone-800 py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                                    <Utensils className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">ReservaYa</span>
                            </div>
                            <p className="text-stone-500 text-sm">
                                La plataforma líder de reservaciones para restaurantes en LATAM.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Producto</h4>
                            <ul className="space-y-2 text-stone-500 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Características</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Para Restaurantes</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Compañía</h4>
                            <ul className="space-y-2 text-stone-500 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Carreras</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-stone-500 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Términos de Servicio</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-stone-600 text-sm">© 2024 ReservaYa. Todos los derechos reservados.</p>
                        <div className="flex items-center gap-2 text-stone-500 text-sm">
                            <Globe className="h-4 w-4" />
                            <span>Hecho con ❤️ en LATAM</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* CSS for animations */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
            `}</style>
        </div>
    );
}
