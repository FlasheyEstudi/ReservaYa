'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Utensils, ArrowLeft, Building2, KeyRound, Shield, Clock, Star, CheckCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmployeeMode, setIsEmployeeMode] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [employeeData, setEmployeeData] = useState({ restaurantCode: '', email: '', pin: '' });

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Frontend validation before sending to backend
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      setError('Por favor ingresa un email válido');
      setIsLoading(false);
      return;
    }
    if (loginData.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Credenciales incorrectas');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userRole', data.user.role);

      // Use router.push for SPA navigation (better performance)
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.role === 'RESTAURANT') {
        localStorage.setItem('restaurantId', data.user.restaurantId);
        router.push('/manage');
      } else {
        // Customer goes to feed
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_code: employeeData.restaurantCode,
          email: employeeData.email,
          pin: employeeData.pin
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Credenciales incorrectas');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userRole', data.user.role.toUpperCase());
      localStorage.setItem('restaurantCode', employeeData.restaurantCode);
      localStorage.setItem('restaurantId', data.user.restaurantId);

      // Use hard navigation to ensure fresh state
      const role = data.user.role.toLowerCase();
      switch (role) {
        case 'chef': window.location.href = '/workspace/kitchen'; break;
        case 'waiter': window.location.href = '/workspace/waiter'; break;
        case 'host': window.location.href = '/workspace/host'; break;
        case 'bartender': window.location.href = '/workspace/bar'; break;
        case 'manager': window.location.href = '/manage'; break;
        default: window.location.href = '/workspace/waiter';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  // User/Admin/Restaurant Login View
  if (!isEmployeeMode) {
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
                <h1 className="text-2xl font-bold text-stone-800">Iniciar Sesión</h1>
                <p className="text-sm text-stone-500">Accede a tu cuenta</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
            )}

            <form onSubmit={handleNormalLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData(p => ({ ...p, email: e.target.value }))}
                    required
                    className="pl-12 h-12 border-stone-200 focus:border-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData(p => ({ ...p, password: e.target.value }))}
                    required
                    className="pl-12 pr-12 h-12 border-stone-200 focus:border-orange-400"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <p className="text-center text-stone-500 text-sm">
                ¿No tienes cuenta? <button onClick={() => router.push('/auth/register')} className="text-orange-500 hover:text-orange-600 font-medium">Regístrate</button>
              </p>
              <div className="text-center">
                <button onClick={() => setIsEmployeeMode(true)} className="text-sm text-stone-400 hover:text-stone-600 flex items-center justify-center gap-2 mx-auto">
                  <Users className="h-4 w-4" /> Acceso para empleados
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Trust & Security */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-500 to-amber-500 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative text-white max-w-md z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Tu cuenta está protegida</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              Utilizamos los más altos estándares de seguridad para proteger tu información.
            </p>

            <div className="space-y-5">
              {[
                { icon: Shield, text: 'Encriptación SSL de 256 bits' },
                { icon: Lock, text: 'Contraseñas hasheadas con bcrypt' },
                { icon: CheckCircle, text: 'Autenticación segura con JWT' },
                { icon: Clock, text: 'Sesiones con expiración automática' },
                { icon: Star, text: 'Protección contra ataques CSRF' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white/90">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Employee Login View
  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left Panel - Key Points */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-indigo-600 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative text-white max-w-md z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Portal de Empleados</h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            Accede a tu espacio de trabajo con tus credenciales de restaurante.
          </p>

          <div className="space-y-5">
            {[
              { icon: Building2, text: 'Código único por restaurante' },
              { icon: KeyRound, text: 'PIN de acceso rápido y seguro' },
              { icon: Shield, text: 'Permisos según tu rol' },
              { icon: Clock, text: 'Registro de actividad' },
              { icon: CheckCircle, text: 'Acceso desde cualquier dispositivo' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-white/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Employee Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button onClick={() => setIsEmployeeMode(false)} className="flex items-center text-stone-500 hover:text-stone-700 mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al login principal
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800">Acceso Empleado</h1>
              <p className="text-sm text-stone-500">Ingresa con tu código de restaurante</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
          )}

          <form onSubmit={handleEmployeeLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Código del Restaurante</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  placeholder="REST-XXXXX"
                  value={employeeData.restaurantCode}
                  onChange={(e) => setEmployeeData(p => ({ ...p, restaurantCode: e.target.value }))}
                  required
                  className="pl-12 h-12 border-stone-200 focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Correo Empleado</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  type="email"
                  placeholder="empleado@restaurante.com"
                  value={employeeData.email}
                  onChange={(e) => setEmployeeData(p => ({ ...p, email: e.target.value }))}
                  required
                  className="pl-12 h-12 border-stone-200 focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">PIN de Acceso</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••••"
                  maxLength={6}
                  value={employeeData.pin}
                  onChange={(e) => setEmployeeData(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
                  required
                  className="pl-12 pr-12 h-12 border-stone-200 focus:border-blue-400 tracking-widest"
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium" disabled={isLoading}>
              {isLoading ? 'Accediendo...' : 'Acceder al Sistema'}
            </Button>
          </form>

          <p className="text-center text-stone-400 text-xs mt-8">
            Contacta a tu manager si olvidaste tus credenciales
          </p>
        </div>
      </div>
    </div>
  );
}