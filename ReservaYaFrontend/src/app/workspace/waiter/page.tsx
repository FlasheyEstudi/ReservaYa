'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, Plus, Receipt, CreditCard, Clock, CheckCircle, Utensils,
  AlertTriangle, X, ShoppingCart, LogOut, Send, Wine, Trash2,
  Percent, DollarSign, Banknote
} from 'lucide-react';
import { Input } from '@/components/ui/input';

import { getApiUrl } from '@/lib/api';

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'free' | 'occupied' | 'reserved' | 'payment_pending';
  occupiedSince?: string;
  pax?: number;
  currentOrder?: { id: string; items: OrderItem[]; total: number };
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: 'pending' | 'cooking' | 'ready' | 'served';
  station: 'kitchen' | 'bar';
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  station: 'kitchen' | 'bar';
}

export default function WaiterWorkspace() {
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeView, setActiveView] = useState<'tables' | 'order' | 'menu'>('tables');
  // Per-table cart storage: { [tableId]: CartItem[] }
  const [tableCartsMap, setTableCartsMap] = useState<Record<string, any[]>>({});
  const [walkInPax, setWalkInPax] = useState(2);
  const [notification, setNotification] = useState<string | null>(null);
  const [menuCategory, setMenuCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  // Checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutTip, setCheckoutTip] = useState(0);
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [checkoutDiscountType, setCheckoutDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');

  // Current table's cart (derived from tableCartsMap)
  const cartItems = selectedTable ? (tableCartsMap[selectedTable.id] || []) : [];
  const setCartItems = (updater: any[] | ((prev: any[]) => any[])) => {
    if (!selectedTable) return;
    setTableCartsMap(prev => {
      const currentCart = prev[selectedTable.id] || [];
      const newCart = typeof updater === 'function' ? updater(currentCart) : updater;
      return { ...prev, [selectedTable.id]: newCart };
    });
  };

  const categories = ['all', ...new Set(menuItems.map(i => i.category))];

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchTables, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchTables(), fetchMenu()]);
    setIsLoading(false);
  };

  const fetchMenu = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/menu`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Backend returns menu_items
        const rawItems = data.menu_items || data.items || data.menuItems || [];
        const items = (Array.isArray(rawItems) ? rawItems : []).map((item: any) => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price) || 0,
          category: item.category?.name || item.categoryName || item.category || 'General',
          station: item.station || 'kitchen'
        }));
        setMenuItems(items);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    }
  };

  const fetchTables = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token - cannot fetch tables');
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/restaurant/layout`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const apiTables = (data.tables || []).map((t: any) => ({
          id: t.id,
          number: t.tableNumber || `T${t.id}`,
          capacity: t.capacity || 4,
          status: t.currentStatus || 'free',
          pax: t.pax,
          occupiedSince: t.occupiedSince,
          currentOrder: t.currentOrder
        }));
        setTables(apiTables);
      } else {
        console.error('Failed to fetch tables:', res.status);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  // No mock data - if API fails, show empty state

  const getElapsedTime = (since: string) => {
    const mins = Math.floor((Date.now() - new Date(since).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'free': return 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100';
      case 'occupied': return 'bg-red-50 border-red-300';
      case 'reserved': return 'bg-blue-50 border-blue-300';
      case 'payment_pending': return 'bg-amber-50 border-amber-300 animate-pulse';
      default: return 'bg-stone-50 border-stone-300';
    }
  };

  const handleTableClick = async (table: Table) => {
    setSelectedTable(table);
    setActiveView('order');

    // Fetch current order for this table if occupied
    if (table.status === 'occupied' || table.status === 'payment_pending') {
      setIsLoadingOrder(true);
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(`${getApiUrl()}/orders?tableId=${table.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.order) {
              // Update table with loaded order
              const orderWithItems = {
                id: data.order.id,
                items: (data.order.items || []).map((item: any) => ({
                  id: item.id,
                  name: item.menuItem?.name || item.name || 'Item',
                  quantity: item.quantity,
                  price: parseFloat(item.menuItem?.price || item.price || 0),
                  status: item.status,
                  station: item.station || 'kitchen'
                })),
                total: parseFloat(data.order.total) || 0
              };
              setSelectedTable({ ...table, currentOrder: orderWithItems });
              setTables(prev => prev.map(t => t.id === table.id ? { ...t, currentOrder: orderWithItems } : t));
            }
          }
        } catch (err) {
          console.error('Error fetching order:', err);
        } finally {
          setIsLoadingOrder(false);
        }
      } else {
        setIsLoadingOrder(false);
      }
    }
  };

  const handleOccupyTable = async () => {
    if (!selectedTable) return;
    if (walkInPax > selectedTable.capacity) {
      if (!confirm(`⚠️ Mesa para ${selectedTable.capacity}, intentas sentar ${walkInPax}. ¿Continuar?`)) return;
    }

    // Update local state immediately for UX
    setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'occupied' as const, pax: walkInPax, occupiedSince: new Date().toISOString() } : t));
    setSelectedTable({ ...selectedTable, status: 'occupied', pax: walkInPax, occupiedSince: new Date().toISOString() });
    setWalkInPax(2);
    showToast(`Mesa ${selectedTable.number} ocupada`);

    // Persist to backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch(`${getApiUrl()}/restaurant/tables/${selectedTable.id}/status`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'occupied' })
        });
        if (!res.ok) {
          showToast('⚠️ Error al guardar - verifica conexión');
        }
      } catch (err) {
        console.error('Error updating table status:', err);
        showToast('⚠️ Error de conexión');
      }
    }
  };

  const handleForceFree = async () => {
    if (!selectedTable) return;
    if (!confirm(`⚠️ ¿Estás seguro de liberar la Mesa ${selectedTable.number} forzosamente?\n\nEsto borrará el estado de la mesa sin cerrar ninguna orden asociada.`)) return;

    const token = localStorage.getItem('token');

    // Clear cart for this table
    setTableCartsMap(prev => {
      const newMap = { ...prev };
      delete newMap[selectedTable.id];
      return newMap;
    });

    // Update local state
    setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'free' as const, currentOrder: undefined, pax: undefined } : t));
    setSelectedTable(null);
    setActiveView('tables');
    showToast(`Mesa ${selectedTable.number} liberada forzosamente`);

    // Persist 'free' status to backend
    if (token) {
      try {
        await fetch(`${getApiUrl()}/restaurant/tables/${selectedTable.id}/status`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'free' })
        });
      } catch (err) {
        console.error('Error updating table status:', err);
      }
    }
  };


  const handleAddToCart = (item: MenuItem) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing && existing.quantity > 1) return prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter(c => c.id !== itemId);
    });
  };

  const handleSendOrder = async () => {
    if (!selectedTable || cartItems.length === 0) return;

    const kitchenItems = cartItems.filter(i => i.station === 'kitchen');
    const barItems = cartItems.filter(i => i.station === 'bar');
    const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

    // Create order items with pending status
    const orderItems = cartItems.map(i => ({ ...i, status: 'pending' as const }));

    // Update table with new order
    const existingOrder = selectedTable.currentOrder;
    const newOrder = {
      id: existingOrder?.id || `o${Date.now()}`,
      items: [...(existingOrder?.items || []), ...orderItems],
      total: (existingOrder?.total || 0) + total
    };

    setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, currentOrder: newOrder } : t));
    setSelectedTable({ ...selectedTable, currentOrder: newOrder });

    // Send to kitchen/bar
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Format items for backend: expects { menu_item_id, quantity, notes }
        const orderPayload = {
          table_id: selectedTable.id,
          items: cartItems.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            notes: ''
          }))
        };
        const res = await fetch(`${getApiUrl()}/orders`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        if (!res.ok) {
          const errData = await res.json();
          showToast(`⚠️ Error: ${errData.error || 'No se pudo enviar'}`);
        }
      } catch (err) {
        console.error('Error sending order:', err);
        showToast('⚠️ Error de conexión');
      }
    }

    setCartItems([]);
    setActiveView('order');

    if (kitchenItems.length && barItems.length) {
      showToast(`Enviado: ${kitchenItems.length} a cocina, ${barItems.length} a bar`);
    } else if (kitchenItems.length) {
      showToast(`${kitchenItems.length} items enviados a cocina`);
    } else {
      showToast(`${barItems.length} items enviados a bar`);
    }
  };

  const handleRequestBill = async () => {
    if (!selectedTable) return;

    // Update local state
    setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'payment_pending' as const } : t));
    setSelectedTable({ ...selectedTable, status: 'payment_pending' });
    showToast('Cuenta solicitada - enviar a caja');

    // Persist to backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${getApiUrl()}/restaurant/tables/${selectedTable.id}/status`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'payment_pending' })
        });
      } catch (err) {
        console.error('Error updating table status:', err);
      }
    }
  };

  const openCheckoutModal = () => {
    if (!selectedTable?.currentOrder) {
      // If table is payment_pending but no order loaded, offer to force free
      if (selectedTable?.status === 'payment_pending' || selectedTable?.status === 'occupied') {
        if (confirm('⚠️ No se encontró orden para esta mesa. ¿Deseas liberarla forzosamente?')) {
          handleForceFree();
        }
      }
      return;
    }
    setCheckoutTip(0);
    setCheckoutDiscount(0);
    setCheckoutDiscountType('percentage');
    setCheckoutPaymentMethod('cash');
    setShowCheckoutModal(true);
  };

  const calculateCheckoutTotal = () => {
    if (!selectedTable?.currentOrder) return 0;
    let subtotal = selectedTable.currentOrder.total;
    let discountAmount = 0;
    if (checkoutDiscount > 0) {
      discountAmount = checkoutDiscountType === 'percentage'
        ? subtotal * (checkoutDiscount / 100)
        : checkoutDiscount;
    }
    return Math.max(0, subtotal - discountAmount) + checkoutTip;
  };

  const handleCloseTable = async () => {
    if (!selectedTable) return;
    const tableId = selectedTable.id;
    const tableNumber = selectedTable.number;
    const orderId = selectedTable.currentOrder?.id;
    const token = localStorage.getItem('token');

    // Validate we have an order to close
    if (!orderId) {
      showToast('⚠️ No hay orden activa para cerrar');
      setShowCheckoutModal(false);
      return;
    }

    setShowCheckoutModal(false);

    // Close the order with checkout data
    if (token) {
      try {
        const res = await fetch(`${getApiUrl()}/restaurant/orders/${orderId}/close`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tip: checkoutTip,
            discount: checkoutDiscount,
            discountType: checkoutDiscountType,
            paymentMethod: checkoutPaymentMethod
          })
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          showToast(`⚠️ ${errorData.error || 'Error al cerrar la orden'}`);
          return;
        }
      } catch (err) {
        console.error('Error closing order:', err);
        showToast('⚠️ Error de conexión al cerrar');
        return;
      }
    }

    // Clear cart for this table
    setTableCartsMap(prev => {
      const newMap = { ...prev };
      delete newMap[tableId];
      return newMap;
    });

    // Update local state
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'free' as const, currentOrder: undefined, pax: undefined } : t));
    setSelectedTable(null);
    setActiveView('tables');
    showToast(`✅ Mesa ${tableNumber} cobrada correctamente`);

    // Persist 'free' status to backend
    if (token) {
      try {
        await fetch(`${getApiUrl()}/restaurant/tables/${tableId}/status`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'free' })
        });
      } catch (err) {
        console.error('Error updating table status:', err);
      }
    }

    // After 5 minutes, auto-free the table
    setTimeout(async () => {
      setTables(prev => prev.map(t => t.id === tableId && t.status === 'reserved' ? { ...t, status: 'free' as const, occupiedSince: undefined } : t));
      showToast(`Mesa ${tableNumber} liberada automáticamente`);

      if (token) {
        try {
          await fetch(`${getApiUrl()}/restaurant/tables/${tableId}/status`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'free' })
          });
        } catch (err) {
          console.error('Error auto-freeing table:', err);
        }
      }
    }, 5 * 60 * 1000);
  };


  const handlePrintBill = () => {
    if (!selectedTable?.currentOrder) return;
    const order = selectedTable.currentOrder;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Cuenta</title>
      <style>
        * { margin: 0; padding: 0; font-family: 'Courier New', monospace; }
        body { width: 72mm; padding: 4mm; font-size: 12px; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
        .item { display: flex; justify-content: space-between; margin: 4px 0; }
        .total { border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; font-weight: bold; font-size: 14px; }
      </style></head><body>
      <div class="header"><h2>ReservaYA Grill</h2><p>Mesa: ${selectedTable.number}</p><p>${new Date().toLocaleString()}</p></div>
      ${order.items.map(i => `<div class="item"><span>${i.name} x${i.quantity}</span><span>$${(i.price * i.quantity).toFixed(2)}</span></div>`).join('')}
      <div class="item total"><span>TOTAL</span><span>$${order.total.toFixed(2)}</span></div>
      <p style="text-align:center;margin-top:16px;font-size:10px;">¡Gracias por su visita!</p>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 200);
  };

  const handleMarkServed = async (itemId: string, itemName: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${getApiUrl()}/orders/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'served' })
      });

      if (res.ok) {
        showToast(`Entregado: ${itemName}`);
        // Refresh tables to update status UI
        fetchTables();
      }
    } catch (err) {
      console.error('Error marking as served:', err);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth/login';
  };

  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const stats = {
    occupied: tables.filter(t => t.status === 'occupied').length,
    free: tables.filter(t => t.status === 'free').length,
    pending: tables.filter(t => t.status === 'payment_pending').length,
    readyToServe: tables.reduce((acc, table) => {
      return acc + (table.currentOrder?.items.filter(i => i.status === 'ready').length || 0);
    }, 0)
  };
  const filteredMenu = menuCategory === 'all' ? menuItems : menuItems.filter(m => m.category === menuCategory);

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
          <CheckCircle className="h-5 w-5" /> {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-800">Mesero</h1>
              <p className="text-stone-500 text-xs">{new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-3 text-xs">
              <div className="text-center px-3 py-1 bg-emerald-50 rounded-lg"><span className="block text-lg font-bold text-emerald-600">{stats.free}</span>Libres</div>
              <div className="text-center px-3 py-1 bg-red-50 rounded-lg"><span className="block text-lg font-bold text-red-600">{stats.occupied}</span>Ocupadas</div>
              <div className="text-center px-3 py-1 bg-amber-50 rounded-lg"><span className="block text-lg font-bold text-amber-600">{stats.pending}</span>Por cobrar</div>
              {stats.readyToServe > 0 && (
                <div className="text-center px-3 py-1 bg-purple-100 rounded-lg animate-pulse border border-purple-300">
                  <span className="block text-lg font-bold text-purple-700">{stats.readyToServe}</span>Listos
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-stone-600"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left: Tables Grid */}
        <div className="w-1/2 p-4 overflow-auto">
          <h2 className="text-sm font-semibold text-stone-600 mb-3">MESAS</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-stone-400 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-stone-300 border-t-blue-600 rounded-full mx-auto mb-2"></div>
                <p>Cargando mesas...</p>
              </div>
            </div>
          ) : tables.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-stone-400 text-center">
                <Utensils className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No hay mesas configuradas</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {tables.map(table => (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`aspect-square border-2 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${getTableColor(table.status)} ${selectedTable?.id === table.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                >
                  <span className="font-bold text-lg text-stone-800">{table.number}</span>
                  <span className="text-xs text-stone-500">{table.capacity}p</span>
                  {table.pax && <span className="text-xs text-stone-600 mt-1"><Users className="h-3 w-3 inline" /> {table.pax}</span>}
                  {table.occupiedSince && <span className="text-[10px] text-stone-400"><Clock className="h-3 w-3 inline" /> {getElapsedTime(table.occupiedSince)}</span>}
                  {table.currentOrder && <Badge className="text-[10px] mt-1 bg-stone-800">${table.currentOrder.total.toFixed(0)}</Badge>}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-4 text-xs text-stone-500">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></div> Libre</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div> Ocupada</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div> Reservada</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></div> Por cobrar</span>
          </div>
        </div>

        {/* Right: Order Panel */}
        <div className="w-1/2 bg-white border-l border-stone-200 flex flex-col">
          {!selectedTable ? (
            <div className="flex-1 flex items-center justify-center text-stone-400">
              <div className="text-center">
                <Utensils className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Selecciona una mesa para comenzar</p>
              </div>
            </div>
          ) : (
            <>
              {/* Table Info Header */}
              <div className="p-4 border-b border-stone-100 bg-stone-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-800">{selectedTable.number}</h2>
                    <p className="text-sm text-stone-500">
                      {selectedTable.status === 'free' ? 'Mesa libre' : `${selectedTable.pax || 0} personas`}
                      {selectedTable.occupiedSince && ` • ${getElapsedTime(selectedTable.occupiedSince)}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {activeView !== 'menu' && selectedTable.status !== 'free' && (
                      <Button size="sm" onClick={() => setActiveView('menu')} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-1" /> Agregar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { setSelectedTable(null); setActiveView('tables'); setCartItems([]); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-auto">
                {/* Free Table - Occupy Options */}
                {selectedTable.status === 'free' && activeView !== 'menu' && (
                  <div className="p-6">
                    <h3 className="font-semibold text-stone-700 mb-4">Ocupar Mesa</h3>
                    <p className="text-stone-500 mb-4">Capacidad: {selectedTable.capacity} personas</p>
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <button onClick={() => setWalkInPax(Math.max(1, walkInPax - 1))} className="w-14 h-14 rounded-full bg-stone-100 text-2xl font-bold hover:bg-stone-200">-</button>
                      <div className="text-5xl font-bold text-stone-800 w-20 text-center">{walkInPax}</div>
                      <button onClick={() => setWalkInPax(walkInPax + 1)} className="w-14 h-14 rounded-full bg-stone-100 text-2xl font-bold hover:bg-stone-200">+</button>
                    </div>
                    {walkInPax > selectedTable.capacity && (
                      <p className="text-amber-600 text-sm text-center mb-4 flex items-center justify-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Excede capacidad
                      </p>
                    )}
                    <Button onClick={handleOccupyTable} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg">
                      <Users className="h-5 w-5 mr-2" /> Ocupar Mesa
                    </Button>
                  </div>
                )}

                {/* Occupied Table - Current Order */}
                {selectedTable.status !== 'free' && activeView === 'order' && (
                  <div className="p-4">
                    <h3 className="font-semibold text-stone-700 mb-3">Pedido Actual</h3>
                    {selectedTable.currentOrder?.items.length ? (
                      <div className="space-y-2 mb-4">
                        {selectedTable.currentOrder.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {item.station === 'kitchen' ? <Utensils className="h-4 w-4 text-orange-500" /> : <Wine className="h-4 w-4 text-purple-500" />}
                              <div>
                                <p className="font-medium text-stone-800">{item.name}</p>
                                <p className="text-xs text-stone-500">x{item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                              <Badge className={`text-[10px] ${item.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : item.status === 'cooking' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                                {item.status === 'ready' ? 'Listo' : item.status === 'cooking' ? 'Preparando' : 'Pendiente'}
                              </Badge>
                              {item.status === 'ready' && (
                                <button
                                  onClick={() => handleMarkServed(item.id, item.name)}
                                  className="ml-2 p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  title="Marcar como entregado"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {item.status === 'served' && (
                                <span className="ml-2 text-gray-400 text-xs">Entregado</span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between p-3 bg-stone-800 text-white rounded-lg font-bold">
                          <span>TOTAL</span>
                          <span>${selectedTable.currentOrder.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-stone-400 text-center py-8">Sin pedidos aún</p>
                    )}
                  </div>
                )}

                {/* Menu View */}
                {activeView === 'menu' && (
                  <div className="flex flex-col h-full">
                    <div className="p-3 border-b flex gap-2 overflow-x-auto">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setMenuCategory(cat)}
                          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${menuCategory === cat ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                        >
                          {cat === 'all' ? 'Todos' : cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 overflow-auto p-3">
                      <div className="grid grid-cols-2 gap-2">
                        {filteredMenu.map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleAddToCart(item)}
                            className="p-3 border border-stone-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-stone-800 text-sm">{item.name}</p>
                                <p className="text-xs text-stone-500">{item.category}</p>
                              </div>
                              {item.station === 'bar' && <Wine className="h-4 w-4 text-purple-400" />}
                            </div>
                            <p className="text-blue-600 font-bold mt-1">${item.price.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cartItems.length > 0 && (
                <div className="border-t border-stone-200 bg-stone-50 p-4">
                  <div className="max-h-32 overflow-auto mb-3 space-y-1">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {item.station === 'bar' ? <Wine className="h-3 w-3 text-purple-500" /> : <Utensils className="h-3 w-3 text-orange-500" />}
                          {item.name} x{item.quantity}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 font-medium"><ShoppingCart className="h-4 w-4" /> {cartItems.reduce((s, i) => s + i.quantity, 0)} items</span>
                    <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
                  </div>
                  <Button onClick={handleSendOrder} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                    <Send className="h-4 w-4 mr-2" /> Enviar Pedido
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              {selectedTable.status !== 'free' && activeView === 'order' && cartItems.length === 0 && (
                <div className="border-t border-stone-200 p-4 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveView('menu')} className="flex-1">
                      <Plus className="h-4 w-4 mr-1" /> Agregar Items
                    </Button>

                    {/* Actions for valid orders */}
                    {selectedTable.currentOrder ? (
                      <>
                        {selectedTable.status === 'occupied' && (
                          <Button variant="outline" onClick={handleRequestBill} className="flex-1">
                            <Receipt className="h-4 w-4 mr-1" /> Pedir Cuenta
                          </Button>
                        )}
                        {selectedTable.status === 'payment_pending' && (
                          <>
                            <Button variant="outline" onClick={handlePrintBill} className="flex-1">
                              <Receipt className="h-4 w-4 mr-1" /> Imprimir
                            </Button>
                            <Button onClick={openCheckoutModal} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                              <CreditCard className="h-4 w-4 mr-1" /> Cobrar
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      /* Zombie table handling */
                      <Button onClick={handleForceFree} variant="destructive" className="flex-1">
                        <Trash2 className="h-4 w-4 mr-1" /> Liberar Mesa Error
                      </Button>
                    )}
                  </div>

                  {/* Warning for zombie tables */}
                  {!selectedTable.currentOrder && (
                    <p className="text-xs text-center text-amber-600 mt-1">
                      ⚠️ Mesa ocupada sin orden visible. Intenta "Liberar Mesa" si está bloqueada.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && selectedTable?.currentOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-800">Cobrar Mesa {selectedTable.number}</h2>
              <button onClick={() => setShowCheckoutModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-stone-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-stone-600">Subtotal:</span>
                <span className="font-medium">${selectedTable.currentOrder.total.toFixed(2)}</span>
              </div>
              {checkoutDiscount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Descuento ({checkoutDiscountType === 'percentage' ? `${checkoutDiscount}%` : 'fijo'}):</span>
                  <span>-${(checkoutDiscountType === 'percentage'
                    ? selectedTable.currentOrder.total * (checkoutDiscount / 100)
                    : checkoutDiscount).toFixed(2)}</span>
                </div>
              )}
              {checkoutTip > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Propina:</span>
                  <span>+${checkoutTip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-stone-200">
                <span>Total:</span>
                <span className="text-emerald-600">${calculateCheckoutTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Discount Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">Descuento (opcional)</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={checkoutDiscount || ''}
                    onChange={(e) => setCheckoutDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div className="flex rounded-lg border border-stone-200 overflow-hidden">
                  <button
                    onClick={() => setCheckoutDiscountType('percentage')}
                    className={`px-3 py-2 flex items-center ${checkoutDiscountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-white text-stone-600'}`}
                  >
                    <Percent className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCheckoutDiscountType('fixed')}
                    className={`px-3 py-2 flex items-center ${checkoutDiscountType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-white text-stone-600'}`}
                  >
                    <DollarSign className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tip Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">Propina (opcional)</label>
              <div className="flex gap-2 mb-2">
                {[10, 15, 20].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setCheckoutTip(selectedTable.currentOrder!.total * (pct / 100))}
                    className={`flex-1 py-2 text-sm rounded-lg border ${checkoutTip === selectedTable.currentOrder!.total * (pct / 100) ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                  >
                    {pct}%
                  </button>
                ))}
                <button
                  onClick={() => setCheckoutTip(0)}
                  className={`flex-1 py-2 text-sm rounded-lg border ${checkoutTip === 0 ? 'bg-stone-100 border-stone-300 text-stone-700' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                >
                  Sin
                </button>
              </div>
              <Input
                type="number"
                value={checkoutTip || ''}
                onChange={(e) => setCheckoutTip(parseFloat(e.target.value) || 0)}
                placeholder="Propina personalizada"
                min="0"
                step="0.01"
              />
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">Método de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'cash', label: 'Efectivo', icon: Banknote },
                  { value: 'card', label: 'Tarjeta', icon: CreditCard },
                  { value: 'transfer', label: 'Transfer', icon: Receipt }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setCheckoutPaymentMethod(value as any)}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${checkoutPaymentMethod === value ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCheckoutModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleCloseTable} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="h-4 w-4 mr-2" /> Confirmar Cobro
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}