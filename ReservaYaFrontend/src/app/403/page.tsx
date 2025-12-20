'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-0 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Acceso Denegado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500">
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Button 
              onClick={() => router.push('/')}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Ir al Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}