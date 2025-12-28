'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Mail, Phone, Lock, Utensils, ArrowLeft, Building2, CheckCircle, Clock, Star, Gift, Users, FileText } from 'lucide-react';
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

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
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

      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', 'MANAGER');
      localStorage.setItem('restaurantCode', data.business_code);
      localStorage.setItem('restaurantId', data.restaurant.id);

      setTimeout(() => {
        router.push('/manage');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  // Customer Registration
  if (!isRestaurantMode) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex">
        {/* Left - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <button onClick={() => router.push('/')} className="flex items-center text-zinc-500 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al inicio
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Crear Cuenta</h1>
                <p className="text-sm text-zinc-500">Únete a miles de comensales</p>
              </div>
            </div>

            {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}

            <form onSubmit={handleCustomerRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input placeholder="Juan Pérez" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-orange-500 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input type="email" placeholder="tu@email.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-orange-500 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Teléfono (Opcional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input type="tel" placeholder="+505 8888 8888" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-orange-500 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} required minLength={8} className="pl-12 pr-10 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-orange-500 rounded-xl" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Confirmar</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} required minLength={8} className="pl-12 pr-10 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-orange-500 rounded-xl" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl" disabled={isLoading}>
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              <p className="text-center text-zinc-500 text-sm">
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => router.push('/auth/login')} className="text-orange-400 hover:text-orange-300 font-medium">Inicia Sesión</button>
              </p>
              <div className="text-center">
                <button onClick={() => setIsRestaurantMode(true)} className="text-sm text-zinc-600 hover:text-zinc-400 flex items-center justify-center gap-2 mx-auto transition-colors">
                  <Building2 className="h-4 w-4" /> Registra tu restaurante
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-600 text-center mt-6">
              Al registrarte, aceptas nuestros <button className="text-orange-400 hover:underline">Términos</button> y <button className="text-orange-400 hover:underline">Privacidad</button>
            </p>
          </div>
        </div>

        {/* Right - Visual */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-zinc-900 to-zinc-950 items-center justify-center p-12 relative border-l border-zinc-800">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px]" />

          <div className="relative text-white max-w-md z-10">
            <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-8">
              <Gift className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Beneficios de tu cuenta</h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              Disfruta de una experiencia gastronómica sin complicaciones.
            </p>

            <div className="space-y-4">
              {[
                { icon: Clock, text: 'Reservaciones instantáneas 24/7' },
                { icon: Star, text: 'Acumula puntos y recompensas' },
                { icon: CheckCircle, text: 'Código QR para check-in rápido' },
                { icon: Gift, text: 'Ofertas exclusivas para miembros' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-zinc-300">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Restaurant Registration
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-zinc-900 to-zinc-950 items-center justify-center p-12 relative border-r border-zinc-800">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />

        <div className="relative text-white max-w-md z-10">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-8">
            <Building2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Haz crecer tu negocio</h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Únete a la red de restaurantes más grande y aumenta tu visibilidad.
          </p>

          <div className="space-y-4">
            {[
              { icon: Users, text: 'Acceso a miles de clientes' },
              { icon: Clock, text: 'Gestión de reservas en tiempo real' },
              { icon: Star, text: 'Sistema de reseñas' },
              { icon: CheckCircle, text: 'Panel de administración completo' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300">
                <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button onClick={() => setIsRestaurantMode(false)} className="flex items-center text-zinc-500 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al registro de clientes
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Registra tu Restaurante</h1>
              <p className="text-sm text-zinc-500">Crea tu cuenta de negocio</p>
            </div>
          </div>

          {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
          {success && <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">{success}</div>}

          <form onSubmit={handleRestaurantRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre del Restaurante *</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input placeholder="Mi Restaurante" value={restaurantData.name} onChange={(e) => setRestaurantData(p => ({ ...p, name: e.target.value }))} required className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500 rounded-xl" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">RUC / ID Fiscal (Opcional)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input placeholder="J0000000000000" value={restaurantData.taxId} onChange={(e) => setRestaurantData(p => ({ ...p, taxId: e.target.value }))} className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500 rounded-xl" />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">Datos del Administrador</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Correo del Administrador *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input type="email" placeholder="admin@restaurante.com" value={restaurantData.ownerEmail} onChange={(e) => setRestaurantData(p => ({ ...p, ownerEmail: e.target.value }))} required className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500 rounded-xl" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre del Administrador</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input placeholder="Nombre completo" value={restaurantData.ownerName} onChange={(e) => setRestaurantData(p => ({ ...p, ownerName: e.target.value }))} className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Contraseña *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input type={showPin ? 'text' : 'password'} placeholder="••••••••" value={restaurantData.ownerPassword} onChange={(e) => setRestaurantData(p => ({ ...p, ownerPassword: e.target.value }))} required minLength={8} className="pl-12 pr-10 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500 rounded-xl" />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Confirmar *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input type={showPin ? 'text' : 'password'} placeholder="••••••••" value={restaurantData.ownerPasswordConfirm} onChange={(e) => setRestaurantData(p => ({ ...p, ownerPasswordConfirm: e.target.value }))} required minLength={8} className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500 rounded-xl" />
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-600">La contraseña debe tener al menos 8 caracteres.</p>

            <Button type="submit" className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl" disabled={isLoading || !!success}>
              {isLoading ? 'Registrando...' : 'Registrar Restaurante'}
            </Button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            ¿Ya tienes código?{' '}
            <button onClick={() => router.push('/auth/login')} className="text-emerald-400 hover:text-emerald-300 font-medium">Inicia sesión como empleado</button>
          </p>
        </div>
      </div>
    </div>
  );
}