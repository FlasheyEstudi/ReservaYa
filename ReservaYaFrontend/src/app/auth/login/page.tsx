'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Utensils, ArrowLeft, Building2, KeyRound, Shield, Users, ArrowRight, ChefHat, Wine, Home } from 'lucide-react';
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

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.role === 'RESTAURANT') {
        localStorage.setItem('restaurantId', data.user.restaurantId);
        router.push('/manage');
      } else {
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

  // Normal Login
  if (!isEmployeeMode) {
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
                <h1 className="text-2xl font-bold text-white">Iniciar Sesión</h1>
                <p className="text-sm text-zinc-500">Accede a tu cuenta</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>
            )}

            <form onSubmit={handleNormalLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData(p => ({ ...p, email: e.target.value }))}
                    required
                    className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-orange-500 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData(p => ({ ...p, password: e.target.value }))}
                    required
                    className="pl-12 pr-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-orange-500 rounded-xl"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              <p className="text-center text-zinc-500 text-sm">
                ¿No tienes cuenta?{' '}
                <button onClick={() => router.push('/auth/register')} className="text-orange-400 hover:text-orange-300 font-medium">
                  Regístrate
                </button>
              </p>
              <div className="text-center">
                <button onClick={() => setIsEmployeeMode(true)} className="text-sm text-zinc-600 hover:text-zinc-400 flex items-center justify-center gap-2 mx-auto transition-colors">
                  <Users className="h-4 w-4" /> Acceso para empleados
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Visual */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-zinc-900 to-zinc-950 items-center justify-center p-12 relative border-l border-zinc-800">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px]" />

          <div className="relative text-white max-w-md z-10">
            <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-8">
              <Shield className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Bienvenido de vuelta</h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              Tu cuenta está protegida con los más altos estándares de seguridad.
            </p>

            <div className="space-y-4">
              {[
                'Encriptación SSL de 256 bits',
                'Autenticación segura con JWT',
                'Sesiones con expiración automática',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-zinc-300">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Employee Login
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-zinc-900 to-zinc-950 items-center justify-center p-12 relative border-r border-zinc-800">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />

        <div className="relative text-white max-w-md z-10">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-8">
            <Users className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Portal de Empleados</h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Accede a tu espacio de trabajo con tus credenciales de restaurante.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ChefHat, role: 'Cocina', color: 'text-red-400' },
              { icon: Utensils, role: 'Mesero', color: 'text-blue-400' },
              { icon: Wine, role: 'Bar', color: 'text-purple-400' },
              { icon: Home, role: 'Host', color: 'text-green-400' }
            ].map((ws, i) => (
              <div key={i} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-zinc-700/50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <ws.icon className={`h-5 w-5 ${ws.color}`} />
                </div>
                <span className="text-xs text-zinc-400">{ws.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button onClick={() => setIsEmployeeMode(false)} className="flex items-center text-zinc-500 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al login principal
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Acceso Empleado</h1>
              <p className="text-sm text-zinc-500">Ingresa con tu código de restaurante</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>
          )}

          <form onSubmit={handleEmployeeLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Código del Restaurante</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  placeholder="REST-XXXXX"
                  value={employeeData.restaurantCode}
                  onChange={(e) => setEmployeeData(p => ({ ...p, restaurantCode: e.target.value }))}
                  required
                  className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-blue-500 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Correo Empleado</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  type="email"
                  placeholder="empleado@restaurante.com"
                  value={employeeData.email}
                  onChange={(e) => setEmployeeData(p => ({ ...p, email: e.target.value }))}
                  required
                  className="pl-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-blue-500 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">PIN de Acceso</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••••"
                  maxLength={6}
                  value={employeeData.pin}
                  onChange={(e) => setEmployeeData(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
                  required
                  className="pl-12 pr-12 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-blue-500 rounded-xl tracking-widest"
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl" disabled={isLoading}>
              {isLoading ? 'Accediendo...' : 'Acceder al Sistema'}
            </Button>
          </form>

          <p className="text-center text-zinc-600 text-xs mt-8">
            Contacta a tu manager si olvidaste tus credenciales
          </p>
        </div>
      </div>
    </div>
  );
}