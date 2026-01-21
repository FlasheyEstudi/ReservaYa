'use client';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, EyeOff, Copy, Trash2, X, Save, UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { getApiUrl } from '@/lib/api';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: 'chef' | 'waiter' | 'host' | 'manager';
  isActive: boolean;
  createdAt: string;
}

const ROLES = [
  { value: 'chef', label: 'Chef', color: 'bg-orange-100 text-orange-700' },
  { value: 'waiter', label: 'Mesero', color: 'bg-blue-100 text-blue-700' },
  { value: 'host', label: 'Recepción', color: 'bg-purple-100 text-purple-700' },
];

export default function ManageStaff() {
  const { showSuccess, showError } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', role: 'waiter' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/restaurant/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateEmployee = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const pin = generatePin();

    try {
      const res = await fetch(`${getApiUrl()}/restaurant/staff`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          pin
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(prev => [...prev, data.employee]);
        setGeneratedPin(pin);
        setShowModal(false);
        setShowPinModal(true);
        setFormData({ fullName: '', email: '', role: 'waiter' });
      } else {
        const data = await res.json();
        showError('Error', data.message || data.error || 'No se pudo crear el empleado');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
    }
  };

  const toggleStatus = async (emp: Employee) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/restaurant/staff/${emp.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !emp.isActive })
      });

      if (res.ok) {
        setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, isActive: !e.isActive } : e));
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`¿Eliminar a ${emp.fullName}?`)) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/restaurant/staff/${emp.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setEmployees(prev => prev.filter(e => e.id !== emp.id));
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const copyPin = () => {
    navigator.clipboard.writeText(generatedPin);
    showSuccess('PIN copiado', 'El PIN ha sido copiado al portapapeles');
  };

  const getRoleBadge = (role: string) => {
    const r = ROLES.find(x => x.value === role);
    return r ? <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.color}`}>{r.label}</span> : role;
  };

  const filteredEmployees = employees.filter(e =>
    (e.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <ManageLayout title="Personal" subtitle="Gestiona empleados y credenciales">
      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input placeholder="Buscar empleado..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-stone-200" />
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="h-4 w-4 mr-2" /> Nuevo Empleado
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-stone-100 text-stone-700">
          <p className="text-2xl font-bold">{employees.length}</p>
          <p className="text-sm">Total</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700">
          <p className="text-2xl font-bold">{employees.filter(e => e.isActive).length}</p>
          <p className="text-sm">Activos</p>
        </div>
        <div className="p-4 rounded-xl bg-orange-100 text-orange-700">
          <p className="text-2xl font-bold">{employees.filter(e => e.role === 'chef').length}</p>
          <p className="text-sm">Chefs</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-100 text-blue-700">
          <p className="text-2xl font-bold">{employees.filter(e => e.role === 'waiter').length}</p>
          <p className="text-sm">Meseros</p>
        </div>
      </div>

      {/* Employee Table */}
      <Card className="border-stone-200">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-stone-600">Empleado</th>
                <th className="text-left p-4 text-sm font-medium text-stone-600">Email</th>
                <th className="text-left p-4 text-sm font-medium text-stone-600">Rol</th>
                <th className="text-left p-4 text-sm font-medium text-stone-600">Estado</th>
                <th className="text-right p-4 text-sm font-medium text-stone-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-stone-400">Cargando...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-stone-400">Sin empleados</td></tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className={`border-b border-stone-100 ${!emp.isActive ? 'bg-stone-50 opacity-60' : 'hover:bg-stone-50'}`}>
                    <td className="p-4 font-medium text-stone-800">{emp.fullName || emp.email?.split('@')[0] || 'Sin nombre'}</td>
                    <td className="p-4 text-sm text-stone-500">{emp.email}</td>
                    <td className="p-4">{getRoleBadge(emp.role)}</td>
                    <td className="p-4">
                      {emp.isActive
                        ? <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Activo</span>
                        : <span className="px-2 py-1 rounded-full text-xs bg-stone-200 text-stone-600">Inactivo</span>
                      }
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => toggleStatus(emp)} className={`p-2 rounded-lg ${emp.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-stone-400 hover:bg-stone-100'}`} title={emp.isActive ? 'Desactivar' : 'Activar'}>
                          {emp.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button onClick={() => handleDelete(emp)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-800">Nuevo Empleado</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nombre Completo</label>
                <Input value={formData.fullName} onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))} placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="empleado@restaurante.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Rol</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => (
                    <button key={r.value} onClick={() => setFormData(p => ({ ...p, role: r.value }))} className={`p-3 rounded-lg border-2 text-center ${formData.role === r.value ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'}`}>
                      <p className="font-medium text-sm">{r.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreateEmployee} className="flex-1 bg-emerald-600 hover:bg-emerald-700"><Save className="h-4 w-4 mr-2" /> Crear</Button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">¡Empleado Creado!</h2>
            <p className="text-sm text-stone-500 mb-6">Guarda este PIN, solo se mostrará una vez</p>

            <div className="bg-stone-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-stone-500 mb-2">PIN de Acceso</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-mono font-bold tracking-widest text-stone-800">
                  {showPin ? generatedPin : '••••••'}
                </span>
                <button onClick={() => setShowPin(!showPin)} className="p-2 text-stone-400 hover:text-stone-600">
                  {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={copyPin} variant="outline" className="flex-1"><Copy className="h-4 w-4 mr-2" /> Copiar</Button>
              <Button onClick={() => setShowPinModal(false)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Listo</Button>
            </div>
          </div>
        </div>
      )}
    </ManageLayout>
  );
}