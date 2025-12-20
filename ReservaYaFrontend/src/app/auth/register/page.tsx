'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Mail, Phone, Lock, Utensils, ArrowLeft, Building2, CheckCircle, Shield, Clock, Star, Gift, Users, MapPin, KeyRound, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRestaurantMode, setIsRestaurantMode] = useState(false);

  // Customer form
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

  // Restaurant form
  const [restaurantData, setRestaurantData] = useState({ name: '', taxId: '', address: '', ownerEmail: '', ownerName: '', ownerPassword: '', ownerPasswordConfirm: '' });

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          phone: formData.phone || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error en el registro');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userRole', 'USER');
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurantRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (restaurantData.ownerPassword !== restaurantData.ownerPasswordConfirm) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (restaurantData.ownerPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: restaurantData.name,
          tax_id: restaurantData.taxId || undefined,
          owner_email: restaurantData.ownerEmail,
          owner_password: restaurantData.ownerPassword,
          owner_full_name: restaurantData.ownerName || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error en el registro');

      setSuccess(`¡Restaurante registrado! Tu código es: ${data.business_code}`);

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', 'MANAGER');
      localStorage.setItem('restaurantCode', data.business_code);
      localStorage.setItem('restaurantId', data.restaurant.id);

      // Redirect after showing success
      setTimeout(() => {
        router.push('/manage');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  // Customer Registration View
  if (!isRestaurantMode) {
    return (
      <div className="min-h-screen bg-stone-50 flex">
        {/* Left Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <button onClick={() => router.push('/')} className="flex items-center text-stone-500 hover:text-stone-700 mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al inicio
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-800">Crear Cuenta</h1>
                <p className="text-sm text-stone-500">Únete a miles de comensales</p>
              </div>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>}

            <form onSubmit={handleCustomerRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <Input placeholder="Juan Pérez" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required className="pl-12 h-12 border-stone-200 focus:border-orange-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <Input type="email" placeholder="tu@email.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required className="pl-12 h-12 border-stone-200 focus:border-orange-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Teléfono (Opcional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <Input type="tel" placeholder="+52 123 456 7890" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="pl-12 h-12 border-stone-200 focus:border-orange-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} required minLength={8} className="pl-12 pr-10 h-12 border-stone-200 focus:border-orange-400" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Confirmar</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} required minLength={8} className="pl-12 pr-10 h-12 border-stone-200 focus:border-orange-400" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium" disabled={isLoading}>
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <p className="text-center text-stone-500 text-sm">
                ¿Ya tienes cuenta? <button onClick={() => router.push('/auth/login')} className="text-orange-500 hover:text-orange-600 font-medium">Inicia Sesión</button>
              </p>
              <div className="text-center">
                <button onClick={() => setIsRestaurantMode(true)} className="text-sm text-stone-400 hover:text-stone-600 flex items-center justify-center gap-2 mx-auto">
                  <Building2 className="h-4 w-4" /> Registra tu restaurante
                </button>
              </div>
            </div>

            <p className="text-xs text-stone-400 text-center mt-6">
              Al registrarte, aceptas nuestros <button className="text-orange-500 hover:underline">Términos</button> y <button className="text-orange-500 hover:underline">Privacidad</button>
            </p>
          </div>
        </div>

        {/* Right Panel - Benefits */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-500 to-amber-500 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative text-white max-w-md z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Beneficios de tu cuenta</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8">Disfruta de una experiencia gastronómica sin complicaciones.</p>

            <div className="space-y-5">
              {[
                { icon: Clock, text: 'Reservaciones instantáneas 24/7' },
                { icon: Star, text: 'Acumula puntos y obtén recompensas' },
                { icon: CheckCircle, text: 'Código QR para check-in rápido' },
                { icon: Gift, text: 'Ofertas exclusivas para miembros' },
                { icon: Shield, text: 'Historial de reservas siempre disponible' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><item.icon className="h-5 w-5 text-white" /></div>
                  <span className="text-white/90">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Restaurant Registration View
  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left Panel - Key Points */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600 to-teal-600 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative text-white max-w-md z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Haz crecer tu negocio</h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8">Únete a la red de restaurantes más grande y aumenta tu visibilidad.</p>

          <div className="space-y-5">
            {[
              { icon: Users, text: 'Acceso a miles de clientes potenciales' },
              { icon: Clock, text: 'Gestión de reservas en tiempo real' },
              { icon: Star, text: 'Sistema de reseñas y calificaciones' },
              { icon: CheckCircle, text: 'Panel de administración completo' },
              { icon: Shield, text: 'Soporte técnico 24/7' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><item.icon className="h-5 w-5 text-white" /></div>
                <span className="text-white/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Restaurant Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button onClick={() => setIsRestaurantMode(false)} className="flex items-center text-stone-500 hover:text-stone-700 mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al registro de clientes
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800">Registra tu Restaurante</h1>
              <p className="text-sm text-stone-500">Crea tu cuenta de negocio</p>
            </div>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>}
          {success && <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">{success}</div>}

          <form onSubmit={handleRestaurantRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Nombre del Restaurante *</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input placeholder="Mi Restaurante" value={restaurantData.name} onChange={(e) => setRestaurantData(p => ({ ...p, name: e.target.value }))} required className="pl-12 h-12 border-stone-200 focus:border-emerald-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">RFC / ID Fiscal (Opcional)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input placeholder="XAXX010101000" value={restaurantData.taxId} onChange={(e) => setRestaurantData(p => ({ ...p, taxId: e.target.value }))} className="pl-12 h-12 border-stone-200 focus:border-emerald-400" />
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-500 mb-3 font-medium">DATOS DEL ADMINISTRADOR</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Correo del Administrador *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input type="email" placeholder="admin@restaurante.com" value={restaurantData.ownerEmail} onChange={(e) => setRestaurantData(p => ({ ...p, ownerEmail: e.target.value }))} required className="pl-12 h-12 border-stone-200 focus:border-emerald-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Nombre del Administrador</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input placeholder="Nombre completo" value={restaurantData.ownerName} onChange={(e) => setRestaurantData(p => ({ ...p, ownerName: e.target.value }))} className="pl-12 h-12 border-stone-200 focus:border-emerald-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Contraseña *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <Input type={showPin ? 'text' : 'password'} placeholder="••••••••" value={restaurantData.ownerPassword} onChange={(e) => setRestaurantData(p => ({ ...p, ownerPassword: e.target.value }))} required minLength={8} className="pl-12 pr-10 h-12 border-stone-200 focus:border-emerald-400" />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Confirmar *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <Input type={showPin ? 'text' : 'password'} placeholder="••••••••" value={restaurantData.ownerPasswordConfirm} onChange={(e) => setRestaurantData(p => ({ ...p, ownerPasswordConfirm: e.target.value }))} required minLength={8} className="pl-12 h-12 border-stone-200 focus:border-emerald-400" />
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-400">La contraseña debe tener al menos 8 caracteres.</p>

            <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium" disabled={isLoading || !!success}>
              {isLoading ? 'Registrando...' : 'Registrar Restaurante'}
            </Button>
          </form>

          <p className="text-center text-stone-500 text-sm mt-6">
            ¿Ya tienes código? <button onClick={() => router.push('/auth/login')} className="text-emerald-600 hover:text-emerald-700 font-medium">Inicia sesión como empleado</button>
          </p>
        </div>
      </div>
    </div>
  );
}