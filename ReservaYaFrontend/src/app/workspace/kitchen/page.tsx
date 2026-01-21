'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Clock, CheckCircle, AlertCircle, Timer, Volume2, VolumeX, LogOut, Flame } from 'lucide-react';

import { getApiUrl } from '@/lib/api';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'cooking' | 'ready';
  destination: 'kitchen' | 'bar';
}

interface Ticket {
  id: string;
  tableNumber: string;
  orderTime: string;
  items: OrderItem[];
  status: 'pending' | 'cooking' | 'ready';
  priority: 'normal' | 'urgent';
}

export default function KitchenWorkspace() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchOrders();
    // Real-time polling every 5 seconds
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/orders?status=active&destination=kitchen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Map API response to Ticket interface
        const mappedTickets: Ticket[] = (data.orders || []).map((order: any) => ({
          id: order.id,
          tableNumber: order.table_number || `Mesa ${order.table_id?.slice(-4) || '?'}`,
          orderTime: order.created_at || new Date().toISOString(),
          status: order.status === 'open' ? 'pending' : order.status,
          priority: 'normal',
          items: (order.items || []).map((item: any) => ({
            id: item.id,
            name: item.menu_item_name || item.name || 'Item',
            quantity: item.quantity || 1,
            notes: item.notes || '',
            status: item.status || 'pending',
            destination: item.station || 'kitchen'
          }))
        }));
        // Check for new orders
        if (mappedTickets.length > tickets.length && soundEnabled) {
          playNotification();
        }
        setTickets(mappedTickets);
      }
    } catch {
      console.error('Error fetching kitchen orders');
    }
  };


  const playNotification = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    // Could add audio notification here
    setLastNotification('¡Nuevo pedido recibido!');
    setTimeout(() => setLastNotification(null), 3000);
  }, []);

  const getTimeElapsed = (orderTime: string) => {
    const diff = Math.floor((currentTime.getTime() - new Date(orderTime).getTime()) / 60000);
    return diff;
  };

  const getTimerColor = (minutes: number) => {
    if (minutes < 10) return 'text-emerald-400';
    if (minutes < 20) return 'text-amber-400';
    return 'text-red-400';
  };

  const handleItemClick = async (ticketId: string, itemId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const item = ticket?.items.find(i => i.id === itemId);
    if (!item) return;

    const newStatus = item.status === 'pending' ? 'cooking' : 'ready';

    // Optimistic update
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const updatedItems = t.items.map(i => i.id === itemId ? { ...i, status: newStatus as any } : i);
        const allReady = updatedItems.every(i => i.status === 'ready');
        return { ...t, items: updatedItems, status: allReady ? 'ready' : 'cooking' as any };
      }
      return t;
    }));

    // Persist to backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${getApiUrl()}/orders/items/${itemId}/status`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {
        console.error('Error updating item status:', err);
        // Revert on error
        fetchOrders();
      }
    }
  };

  const handleTicketReady = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Optimistic update
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'ready' as any } : t));

    // Mark all items as ready in backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await Promise.all(ticket.items.map(item =>
          fetch(`${getApiUrl()}/orders/items/${item.id}/status`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ready' })
          })
        ));
        console.log('📡 All items marked ready for ticket:', ticketId);
      } catch (err) {
        console.error('Error marking items ready:', err);
        fetchOrders();
      }
    }
  };

  const handleArchiveTicket = (ticketId: string) => {
    // Optimistically remove from view (items are already 'ready' so they won't re-appear in active query)
    setTickets(prev => prev.filter(t => t.id !== ticketId));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth/login';
  };

  const activeTickets = tickets.filter(t => t.status !== 'ready');
  const readyTickets = tickets.filter(t => t.status === 'ready');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Notification Toast */}
      {lastNotification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {lastNotification}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
              <ChefHat className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cocina</h1>
              <p className="text-gray-400 text-sm">Sistema de Pedidos (KDS)</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-lg ${soundEnabled ? 'bg-emerald-600' : 'bg-gray-700'}`}>
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString()}</div>
              <div className="text-sm text-gray-400">{currentTime.toLocaleDateString()}</div>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Activos', value: activeTickets.length, color: 'text-blue-400' },
            { label: 'Cocinando', value: tickets.filter(t => t.status === 'cooking').length, color: 'text-amber-400' },
            { label: 'Listos', value: readyTickets.length, color: 'text-emerald-400' },
            { label: 'Urgentes', value: tickets.filter(t => t.priority === 'urgent').length, color: 'text-red-400' },
          ].map((s, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-gray-400">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {activeTickets.map(ticket => {
            const elapsed = getTimeElapsed(ticket.orderTime);
            return (
              <Card key={ticket.id} className={`bg-gray-800 border-2 ${ticket.priority === 'urgent' ? 'border-red-500' : 'border-gray-700'}`}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl font-bold">{ticket.tableNumber}</CardTitle>
                    {ticket.priority === 'urgent' && <Badge className="bg-red-600"><Flame className="h-3 w-3 mr-1" /> URGENTE</Badge>}
                  </div>
                  <div className={`flex items-center gap-1 font-mono text-lg ${getTimerColor(elapsed)}`}>
                    <Timer className="h-5 w-5" />
                    <span>{elapsed}m</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ticket.items.filter(i => i.destination === 'kitchen').map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(ticket.id, item.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${item.status === 'pending' ? 'bg-gray-700 border-gray-600 hover:border-amber-500' :
                        item.status === 'cooking' ? 'bg-amber-900/40 border-amber-500' :
                          'bg-emerald-900/40 border-emerald-500'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-400 ml-2">x{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                          {item.status === 'cooking' && <Flame className="h-4 w-4 text-amber-400" />}
                          {item.status === 'ready' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                        </div>
                      </div>
                      {item.notes && <p className="text-xs text-gray-400 mt-1 italic">📝 {item.notes}</p>}
                    </div>
                  ))}
                  <Button
                    onClick={() => handleTicketReady(ticket.id)}
                    disabled={!ticket.items.every(i => i.status === 'ready')}
                    className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-lg py-6"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" /> ¡PEDIDO LISTO!
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ready Section */}
        {readyTickets.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" /> Listos para Entregar ({readyTickets.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {readyTickets.map(t => (
                <Card key={t.id} className="bg-emerald-900/30 border-emerald-600 relative group">
                  <button
                    onClick={() => handleArchiveTicket(t.id)}
                    className="absolute top-1 right-1 p-1 bg-emerald-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-700"
                    title="Archivar"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </button>
                  <CardContent className="p-4 text-center">
                    <div className="text-xl font-bold">{t.tableNumber}</div>
                    <div className="text-sm text-emerald-400">{t.items.length} items</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tickets.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-16 text-center">
              <ChefHat className="h-20 w-20 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-400 mb-2">Sin pedidos activos</h3>
              <p className="text-gray-500">Los nuevos pedidos aparecerán automáticamente</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}