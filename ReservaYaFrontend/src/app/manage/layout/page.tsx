'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Circle, Square, RectangleHorizontal, Save, Trash2, X, AlertTriangle, Wrench } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface TableItem {
  id: string;
  type: 'round' | 'square' | 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  number: string;
  zone: string;
  capacity: number;
  status: 'free' | 'occupied' | 'reserved' | 'maintenance' | 'dirty';
}

const tableTemplates = [
  { type: 'round' as const, name: 'Redonda 2p', width: 60, height: 60, capacity: 2, icon: Circle },
  { type: 'square' as const, name: 'Cuadrada 4p', width: 80, height: 80, capacity: 4, icon: Square },
  { type: 'rectangle' as const, name: 'Larga 8p', width: 120, height: 60, capacity: 8, icon: RectangleHorizontal },
];

export default function RestaurantLayout() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    const token = localStorage.getItem('token');

    // Prioritize API fetch for cross-device sync
    if (token) {
      try {
        const res = await fetch(`${API_URL}/restaurant/layout`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const apiTables = (data.tables || []).map((t: any) => ({
            id: t.id,
            type: t.type || 'square',
            x: t.posX || 100,
            y: t.posY || 100,
            width: t.width || 80,
            height: t.height || 80,
            number: t.tableNumber || t.id,
            zone: t.zone || 'salon',
            capacity: t.capacity || 4,
            status: t.currentStatus || 'free'
          }));
          if (apiTables.length > 0) {
            setTables(apiTables);
            return;
          }
        }
      } catch (err) {
        console.error('Layout fetch error:', err);
      }
    }

    // Fallback to localStorage logic ONLY if API fails/empty
    const savedLayout = localStorage.getItem('restaurantLayout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (parsed.tables && parsed.tables.length > 0) {
          setTables(parsed.tables);
          return;
        }
      } catch { }
    }

    // Default demo tables
    setTables([
      { id: '1', type: 'round', x: 100, y: 100, width: 60, height: 60, number: 'T1', zone: 'salon', capacity: 2, status: 'free' },
      { id: '2', type: 'square', x: 200, y: 100, width: 80, height: 80, number: 'T2', zone: 'salon', capacity: 4, status: 'free' },
      { id: '3', type: 'rectangle', x: 320, y: 100, width: 120, height: 60, number: 'T3', zone: 'salon', capacity: 8, status: 'free' },
    ]);
  };

  const handleDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - (draggedItem.width || 60) / 2;
    const y = e.clientY - rect.top - (draggedItem.height || 60) / 2;

    if (draggedItem.id) {
      setTables(prev => prev.map(t => t.id === draggedItem.id ? { ...t, x, y } : t));
    } else {
      const newTable: TableItem = {
        id: Date.now().toString(),
        type: draggedItem.type,
        x, y,
        width: draggedItem.width || 60,
        height: draggedItem.height || 60,
        number: `T${tables.length + 1}`,
        zone: 'salon',
        capacity: draggedItem.capacity || 2,
        status: 'free'
      };
      setTables(prev => [...prev, newTable]);
    }
    setDraggedItem(null);
  }, [draggedItem, tables.length]);

  const handleTableClick = (table: TableItem) => {
    setSelectedTable({ ...table });
    setShowModal(true);
  };

  const handleUpdateTable = () => {
    if (!selectedTable) return;
    setTables(prev => prev.map(t => t.id === selectedTable.id ? selectedTable : t));
    setShowModal(false);
  };

  const handleDeleteTable = () => {
    if (!selectedTable) return;
    setTables(prev => prev.filter(t => t.id !== selectedTable.id));
    setShowModal(false);
  };

  const handleSaveLayout = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');

    // Always save to localStorage first (guaranteed to work)
    const layoutData = {
      tables: tables.map(t => ({
        id: t.id,
        type: t.type,
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        number: t.number,
        zone: t.zone,
        capacity: t.capacity,
        status: t.status
      })),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('restaurantLayout', JSON.stringify(layoutData));

    // Also try API
    try {
      await fetch(`${API_URL}/restaurant/layout`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: tables.map(t => ({ id: t.id, tableNumber: t.number, capacity: t.capacity, posX: t.x, posY: t.y, type: t.type, width: t.width, height: t.height })) })
      });
    } catch (err) {
      console.log('API save failed, but localStorage saved');
    }

    alert('Distribución guardada');
    setSaving(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free': return 'bg-emerald-100 border-emerald-500';
      case 'occupied': return 'bg-red-100 border-red-500';
      case 'reserved': return 'bg-blue-100 border-blue-500';
      case 'maintenance': return 'bg-stone-200 border-stone-500';
      case 'dirty': return 'bg-amber-100 border-amber-500';
      default: return 'bg-stone-100 border-stone-400';
    }
  };

  return (
    <ManageLayout title="Editor de Plano" subtitle="Diseña la distribución de mesas">
      <div className="flex gap-4 mb-6">
        <Button onClick={handleSaveLayout} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 ml-auto">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Toolbar */}
        <div className="col-span-3">
          <Card className="border-stone-200">
            <CardHeader className="border-b border-stone-100 pb-4">
              <CardTitle className="text-lg">Mesas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {tableTemplates.map((t) => (
                <div key={t.type} draggable onDragStart={(e) => handleDragStart(e, t)} className="flex items-center gap-3 p-3 border border-stone-200 rounded-lg cursor-move hover:bg-stone-50">
                  <t.icon className="h-6 w-6 text-stone-500" />
                  <div>
                    <p className="font-medium text-sm text-stone-700">{t.name}</p>
                    <p className="text-xs text-stone-400">{t.capacity} personas</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-stone-200 mt-4">
            <CardHeader className="border-b border-stone-100 pb-4">
              <CardTitle className="text-lg">Leyenda</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-500"></div> Libre</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-100 border border-red-500"></div> Ocupada</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-100 border border-blue-500"></div> Reservada</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-stone-200 border border-stone-500"></div> Mantenimiento</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-100 border border-amber-500"></div> Sucia</div>
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="col-span-9">
          <Card className="border-stone-200">
            <CardContent className="p-4">
              <div ref={canvasRef} className="relative bg-stone-50 border-2 border-dashed border-stone-300 rounded-lg" style={{ height: '600px' }} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`absolute border-2 cursor-pointer transition-all hover:shadow-lg flex items-center justify-center ${table.type === 'round' ? 'rounded-full' : 'rounded-lg'} ${getStatusColor(table.status)}`}
                    style={{ left: table.x, top: table.y, width: table.width, height: table.height }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, table)}
                    onClick={() => handleTableClick(table)}
                  >
                    <div className="text-center">
                      <p className="font-bold text-xs text-stone-700">{table.number}</p>
                      <p className="text-[10px] text-stone-500">{table.capacity}p</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-800">Editar Mesa</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Número</label>
                <Input value={selectedTable.number} onChange={(e) => setSelectedTable({ ...selectedTable, number: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Capacidad</label>
                <Input type="number" min={1} max={12} value={selectedTable.capacity} onChange={(e) => setSelectedTable({ ...selectedTable, capacity: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Zona</label>
                <select value={selectedTable.zone} onChange={(e) => setSelectedTable({ ...selectedTable, zone: e.target.value })} className="w-full p-2 border border-stone-200 rounded-lg">
                  <option value="salon">Salón</option>
                  <option value="terraza">Terraza</option>
                  <option value="privado">Área Privada</option>
                  <option value="bar">Barra</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Estado</label>
                <div className="grid grid-cols-3 gap-2">
                  {['free', 'maintenance', 'dirty'].map((s) => (
                    <button key={s} onClick={() => setSelectedTable({ ...selectedTable, status: s as any })} className={`p-2 rounded-lg border text-xs font-medium ${selectedTable.status === s ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'}`}>
                      {s === 'free' ? 'Libre' : s === 'maintenance' ? 'Mantenimiento' : 'Sucia'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handleDeleteTable} className="text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" /> Eliminar</Button>
              <Button onClick={handleUpdateTable} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </ManageLayout>
  );
}