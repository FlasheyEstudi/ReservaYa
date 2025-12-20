'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Users, Clock, MapPin, CheckCircle, X, AlertCircle, User, Phone, Search, LogOut, UserPlus, QrCode, Camera, List, CalendarDays, Filter } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Reservation {
  id: string;
  customerName: string;
  partySize: number;
  time: string;
  date?: string;
  status: 'confirmed' | 'seated' | 'no_show' | 'cancelled';
  phone?: string;
  notes?: string;
  tableId?: string;
  tableNumber?: string;
}

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'free' | 'occupied' | 'reserved';
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'round' | 'square' | 'rectangle';
}

export default function HostWorkspace() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]); // All reservations including seated/no-show
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInData, setWalkInData] = useState({ name: '', partySize: 2, tableId: '' });
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQRCode] = useState('');
  const scannerRef = useRef<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // New state for enhanced views
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchAllDates, setSearchAllDates] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  // Function to start camera
  const startCamera = async () => {
    // Check if we're on HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isSecure) {
      alert('⚠️ La cámara solo funciona en localhost o HTTPS.\n\nEstás accediendo desde: ' + window.location.hostname + '\n\nUsa la opción "Subir imagen" o ingresa el código manualmente.');
      return;
    }

    try {
      // Request camera permission first
      await navigator.mediaDevices.getUserMedia({ video: true });

      const { Html5Qrcode } = await import('html5-qrcode');

      // Stop previous scanner if exists
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }

      const scanner = new Html5Qrcode('qr-scanner-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          setQRCode(decodedText);
          scanner.stop().catch(console.error);
          setIsCameraActive(false);
          // Find and process reservation
          const reservation = reservations.find(r => r.id === decodedText || r.phone?.includes(decodedText));
          if (reservation) {
            setSelectedReservation(reservation);
            setShowQRModal(false);
            setShowAssignModal(true);
            showToast(`✅ ${reservation.customerName}`);
          } else {
            showToast(`📷 Código: ${decodedText}`);
          }
        },
        () => { }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        alert('❌ Permiso de cámara denegado.\n\nPor favor permite el acceso a la cámara en la configuración del navegador.');
      } else if (err.name === 'NotFoundError') {
        alert('❌ No se encontró ninguna cámara en este dispositivo.');
      } else {
        alert('❌ Error al acceder a la cámara:\n' + (err.message || 'Error desconocido') + '\n\nUsa "Subir imagen" o ingresa el código manualmente.');
      }
    }
  };

  // Function to scan QR from uploaded image
  const scanQRFile = async (file: File) => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-scanner-container');

      const result = await scanner.scanFile(file, true);
      setQRCode(result);

      // Find and process reservation
      const reservation = reservations.find(r => r.id === result || r.phone?.includes(result));
      if (reservation) {
        setSelectedReservation(reservation);
        setShowQRModal(false);
        setShowAssignModal(true);
        showToast(`✅ ${reservation.customerName}`);
      } else {
        showToast(`📷 Código: ${result}`);
      }
    } catch (err) {
      console.error('QR scan error:', err);
      alert('❌ No se pudo leer el código QR de la imagen.');
    }
  };

  // Cleanup camera when modal closes
  useEffect(() => {
    if (!showQRModal && scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(console.error);
      setIsCameraActive(false);
    }
  }, [showQRModal]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (date?: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Fetch Tables
      const tablesRes = await fetch(`${API_URL}/restaurant/layout`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (tablesRes.ok) {
        const data = await tablesRes.json();
        const apiTables = (data.tables || []).map((t: any) => ({
          id: t.id,
          number: t.tableNumber || `T${t.id}`,
          capacity: t.capacity || 4,
          status: t.currentStatus || 'free',
          x: t.x || 0,
          y: t.y || 0,
          width: t.width || 60,
          height: t.height || 60,
          shape: t.shape || 'square'
        }));
        setTables(apiTables.length > 0 ? apiTables : []);
      }

      // Fetch Reservations for selected date
      const targetDate = date || selectedDate;
      const reservationsRes = await fetch(`${API_URL}/reservations/today?date=${targetDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (reservationsRes.ok) {
        const data = await reservationsRes.json();
        // Transform API response
        const apiReservations = (data || []).map((r: any) => ({
          id: r.id,
          customerName: r.customerName || r.clientName || 'Cliente',
          partySize: r.pax || r.partySize || 2,
          time: new Date(r.reservationDate || r.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(r.reservationDate || r.reservationTime).toLocaleDateString('es-ES'),
          status: r.status,
          phone: r.phone || '',
          notes: r.notes || '',
          tableId: r.tableId || null,
          tableNumber: r.tableNumber || null
        }));
        setReservations(apiReservations);
        setAllReservations(apiReservations);
      } else {
        setReservations([]);
        setAllReservations([]);
      }

    } catch (error) {
      console.error('Error fetching host data:', error);
    }
  };

  // Search reservations by name (optionally across all dates)
  const searchReservations = async (query: string) => {
    if (!query.trim()) {
      fetchData(selectedDate);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setIsSearching(true);
    try {
      const url = searchAllDates
        ? `${API_URL}/reservations/today?search=${encodeURIComponent(query)}&allDates=true`
        : `${API_URL}/reservations/today?search=${encodeURIComponent(query)}&date=${selectedDate}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const searchResults = (data || []).map((r: any) => ({
          id: r.id,
          customerName: r.customerName || r.clientName || 'Cliente',
          partySize: r.pax || r.partySize || 2,
          time: new Date(r.reservationDate || r.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(r.reservationDate || r.reservationTime).toLocaleDateString('es-ES'),
          status: r.status,
          phone: r.phone || '',
          notes: r.notes || '',
          tableId: r.tableId || null,
          tableNumber: r.tableNumber || null
        }));
        setAllReservations(searchResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchReservations(searchTerm);
      } else {
        fetchData(selectedDate);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchAllDates]);

  // Re-fetch when date changes
  useEffect(() => {
    if (!searchTerm) {
      fetchData(selectedDate);
    }
  }, [selectedDate]);

  // Smart check-in: if reservation has a pre-assigned table, do direct check-in
  // Otherwise, open the table selection modal
  const handleSmartCheckIn = async (reservation: Reservation) => {
    if (reservation.tableId) {
      // Has pre-assigned table - do direct check-in
      const table = tables.find(t => t.id === reservation.tableId);

      // Update local state immediately
      setReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: 'seated' as const } : r));
      setAllReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: 'seated' as const } : r));
      if (reservation.tableId) {
        setTables(prev => prev.map(t => t.id === reservation.tableId ? { ...t, status: 'occupied' as const } : t));
      }

      const tableName = table?.number || reservation.tableNumber || 'su mesa';
      showToast(`✅ ${reservation.customerName} sentado en ${tableName}`);

      // Persist to backend
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Update table status
          if (reservation.tableId) {
            await fetch(`${API_URL}/restaurant/tables/${reservation.tableId}/status`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'occupied' })
            });
          }
          // Update reservation status via check-in endpoint
          await fetch(`${API_URL}/reservations/${reservation.id}/check-in`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
        } catch (err) {
          console.error('Error updating status:', err);
          showToast('⚠️ Error de conexión');
        }
      }
    } else {
      // No pre-assigned table - open modal to select one
      setSelectedReservation(reservation);
      setShowAssignModal(true);
    }
  };

  const handleCheckIn = async (reservation: Reservation, tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    // Capacity check
    if (table.capacity < reservation.partySize) {
      if (!confirm(`⚠️ Mesa ${table.number} tiene capacidad ${table.capacity}, pero el grupo es de ${reservation.partySize}. ¿Continuar?`)) {
        return;
      }
    }

    // Update local state immediately
    setReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: 'seated' as const } : r));
    setAllReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: 'seated' as const } : r));
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'occupied' as const } : t));
    setShowAssignModal(false);
    showToast(`${reservation.customerName} sentado en ${table.number}`);

    // Persist to backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Update table status
        const tableRes = await fetch(`${API_URL}/restaurant/tables/${tableId}/status`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'occupied' })
        });
        // Update reservation status via check-in endpoint
        const resRes = await fetch(`${API_URL}/reservations/${reservation.id}/check-in`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!tableRes.ok || !resRes.ok) {
          showToast('⚠️ Error al guardar - recarga la página');
        }
      } catch (err) {
        console.error('Error updating status:', err);
        showToast('⚠️ Error de conexión');
      }
    }
  };

  const handleNoShow = (reservation: Reservation) => {
    if (confirm(`¿Marcar a ${reservation.customerName} como No-Show?`)) {
      setReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: 'no_show' as const } : r));
      showToast('Marcado como No-Show');
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

  const handleWalkIn = async () => {
    const table = tables.find(t => t.id === walkInData.tableId);
    if (!table) return;

    if (table.capacity < walkInData.partySize) {
      if (!confirm(`⚠️ Mesa ${table.number} tiene capacidad ${table.capacity}, pero el grupo es de ${walkInData.partySize}. ¿Continuar?`)) {
        return;
      }
    }

    // Update local state immediately for responsiveness
    setTables(prev => prev.map(t => t.id === walkInData.tableId ? { ...t, status: 'occupied' as const } : t));
    setShowWalkInModal(false);
    showToast(`Walk-in: ${walkInData.name || 'Cliente'} sentado en ${table.number}`);

    // Persist to backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch(`${API_URL}/restaurant/tables/${walkInData.tableId}/status`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'occupied' })
        });
        if (!res.ok) {
          showToast('⚠️ Error al guardar - recarga la página');
        }
      } catch (err) {
        console.error('Error updating table status:', err);
        showToast('⚠️ Error de conexión');
      }
    }

    setWalkInData({ name: '', partySize: 2, tableId: '' });
  };

  const handleQRCheckInDirect = async (code: string) => {
    const token = localStorage.getItem('token');

    // Extract reservation ID from QR format (e.g., "RES-abc123" -> "abc123" or full ID)
    let reservationId = code;
    if (code.startsWith('RES-')) {
      // The QR contains format "RES-{fullId}", we need to find matching reservation
      reservationId = code.replace('RES-', '');
    }

    // First try to find in local reservations (match by id ending)
    const reservation = reservations.find(r =>
      r.id === reservationId ||
      r.id.endsWith(reservationId) ||
      r.phone?.includes(code)
    );

    if (reservation) {
      // Call backend to update reservation status and get table info
      if (token) {
        try {
          const response = await fetch(`${API_URL}/reservations/${reservation.id}/check-in`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();

            // Update reservation status locally
            setReservations(prev => prev.map(r =>
              r.id === reservation.id ? { ...r, status: 'seated' as const } : r
            ));

            // If table was assigned by backend, update table status
            if (data.reservation?.tableId) {
              setTables(prev => prev.map(t =>
                t.id === data.reservation.tableId ? { ...t, status: 'occupied' as const } : t
              ));

              const table = tables.find(t => t.id === data.reservation.tableId);
              showToast(`✅ ${reservation.customerName} sentado en ${table?.number || 'mesa asignada'}`);
            } else {
              showToast(`✅ Check-in exitoso: ${reservation.customerName}`);
            }
          } else if (response.status === 403) {
            const data = await response.json();
            alert(`❌ ${data.error || 'Esta reservación pertenece a otro restaurante'}`);
            setShowQRModal(false);
            setQRCode('');
            return;
          }
        } catch (err) {
          console.error('Error checking in:', err);
        }
      }

      setSelectedReservation(reservation);
      setShowQRModal(false);
      setShowAssignModal(true);
      setQRCode('');
    } else {
      // Try to fetch from backend by code
      if (token) {
        try {
          // Try direct check-in with the code
          const checkInResponse = await fetch(`${API_URL}/reservations/${reservationId}/check-in`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (checkInResponse.ok) {
            const data = await checkInResponse.json();
            if (data.success && data.reservation) {
              // Refresh data to get updated table statuses
              await fetchData();

              const tableName = data.reservation.tableNumber ||
                tables.find(t => t.id === data.reservation.tableId)?.number ||
                'mesa';

              showToast(`✅ Check-in exitoso: ${data.reservation.customerName || 'Cliente'} - ${tableName}`);
              setShowQRModal(false);
              setQRCode('');
              return;
            }
          }

          // Fallback: try lookup endpoint
          const res = await fetch(`${API_URL}/reservations/lookup?code=${reservationId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.reservation) {
              const r = data.reservation;
              const newReservation: Reservation = {
                id: r.id,
                customerName: r.customerName || r.user?.fullName || 'Cliente',
                partySize: r.partySize || 2,
                time: new Date(r.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'confirmed',
                phone: r.phone || ''
              };
              setSelectedReservation(newReservation);
              setShowQRModal(false);
              setShowAssignModal(true);
              setQRCode('');
              showToast(`✅ Reservación encontrada: ${newReservation.customerName}`);
              return;
            }
          }
        } catch (err) {
          console.error('Error fetching reservation:', err);
        }
      }

      alert('❌ Código de reservación no encontrado');
    }
  };

  const handleQRCheckIn = () => {
    handleQRCheckInDirect(qrCode);
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'free': return 'bg-emerald-100 border-emerald-400';
      case 'occupied': return 'bg-red-100 border-red-400';
      case 'reserved': return 'bg-blue-100 border-blue-400';
      default: return 'bg-stone-100 border-stone-300';
    }
  };

  const pendingReservations = reservations.filter(r => r.status === 'confirmed').sort((a, b) => a.time.localeCompare(b.time));
  const filteredReservations = pendingReservations.filter(r =>
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone?.includes(searchTerm)
  );
  const freeTables = tables.filter(t => t.status === 'free');

  const stats = {
    pending: reservations.filter(r => r.status === 'confirmed').length,
    seated: reservations.filter(r => r.status === 'seated').length,
    noShow: reservations.filter(r => r.status === 'no_show').length,
    totalGuests: reservations.filter(r => r.status === 'confirmed').reduce((s, r) => s + r.partySize, 0),
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800">Recepción</h1>
              <p className="text-stone-500 text-sm">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
            <Button onClick={() => setShowListModal(true)} variant="outline" className="bg-white">
              <List className="h-4 w-4 mr-2" /> Ver Lista
            </Button>
            <Button onClick={() => setShowQRModal(true)} variant="outline" className="bg-white">
              <QrCode className="h-4 w-4 mr-2" /> Check-in QR
            </Button>
            <Button onClick={() => setShowWalkInModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="h-4 w-4 mr-2" /> Walk-in
            </Button>
            <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-stone-600"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Por Llegar', value: stats.pending, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Sentados', value: stats.seated, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'No-Show', value: stats.noShow, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Personas Esperadas', value: stats.totalGuests, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((s, i) => (
            <Card key={i} className="border-stone-200">
              <CardContent className={`p-4 ${s.bg}`}>
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-stone-600">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reservations List */}
          <div className="lg:col-span-1">
            <Card className="border-stone-200">
              <CardHeader className="border-b border-stone-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-purple-600" /> Reservas del Día
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input placeholder="Buscar por nombre o teléfono..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredReservations.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Sin reservas pendientes</p>
                    </div>
                  ) : (
                    filteredReservations.map(res => (
                      <div key={res.id} className="p-4 bg-white border border-stone-200 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-stone-800">{res.customerName}</h4>
                            <div className="flex items-center gap-3 text-sm text-stone-500">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {res.time}</span>
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {res.partySize}p</span>
                              {res.tableNumber && (
                                <span className="flex items-center gap-1 text-purple-600 font-medium">
                                  <MapPin className="h-3 w-3" /> Mesa {res.tableNumber}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className="bg-blue-100 text-blue-700">Pendiente</Badge>
                            {res.tableNumber && (
                              <span className="text-[10px] text-purple-500">Mesa asignada</span>
                            )}
                          </div>
                        </div>

                        {res.notes && (
                          <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mb-3">
                            <AlertCircle className="h-3 w-3 inline mr-1" /> {res.notes}
                          </div>
                        )}

                        {res.phone && (
                          <div className="text-xs text-stone-400 mb-3">
                            <Phone className="h-3 w-3 inline mr-1" /> {res.phone}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSmartCheckIn(res)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {res.tableNumber ? `Sentar en Mesa ${res.tableNumber}` : 'Check-in'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleNoShow(res)} className="text-red-600 hover:bg-red-50">
                            No-Show
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Map */}
          <div className="lg:col-span-2">
            <Card className="border-stone-200">
              <CardHeader className="border-b border-stone-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-purple-600" /> Plano del Restaurante
                  <Badge variant="outline" className="ml-2">{freeTables.length} libres</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-3">
                  {tables.map(table => (
                    <div
                      key={table.id}
                      className={`aspect-square border-2 rounded-xl flex flex-col items-center justify-center transition-all ${getTableColor(table.status)}`}
                    >
                      <span className="font-bold text-lg text-stone-800">{table.number}</span>
                      <span className="text-xs text-stone-500">{table.capacity}p</span>
                      <span className="text-[10px] mt-1 text-stone-400 capitalize">{table.status === 'free' ? 'Libre' : table.status === 'occupied' ? 'Ocupada' : 'Reservada'}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-6 text-sm">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-400"></div> Libre</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-100 border-2 border-red-400"></div> Ocupada</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400"></div> Reservada</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assign Table Modal */}
      {showAssignModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-800">Asignar Mesa</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-6 p-4 bg-stone-50 rounded-lg">
              <p className="font-medium text-stone-800">{selectedReservation.customerName}</p>
              <p className="text-sm text-stone-500">{selectedReservation.partySize} personas • {selectedReservation.time}</p>
            </div>

            <h3 className="font-medium text-stone-700 mb-3">Mesas Disponibles</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {freeTables.map(table => (
                <button
                  key={table.id}
                  onClick={() => handleCheckIn(selectedReservation, table.id)}
                  className={`p-4 border-2 rounded-xl text-center hover:shadow-md transition-all ${table.capacity >= selectedReservation.partySize
                    ? 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100'
                    : 'border-amber-400 bg-amber-50 hover:bg-amber-100'
                    }`}
                >
                  <div className="font-bold text-stone-800">{table.number}</div>
                  <div className="text-sm text-stone-500">{table.capacity}p</div>
                  {table.capacity < selectedReservation.partySize && (
                    <AlertCircle className="h-4 w-4 text-amber-500 mx-auto mt-1" />
                  )}
                </button>
              ))}
            </div>

            {freeTables.length === 0 && (
              <div className="text-center py-8 text-stone-400">
                No hay mesas disponibles
              </div>
            )}
          </div>
        </div>
      )}

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-800">Walk-in (Sin Reserva)</h2>
              <button onClick={() => setShowWalkInModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nombre (opcional)</label>
                <Input value={walkInData.name} onChange={(e) => setWalkInData(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del cliente" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Personas</label>
                <Input type="number" min="1" value={walkInData.partySize} onChange={(e) => setWalkInData(p => ({ ...p, partySize: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>

            <h3 className="font-medium text-stone-700 mb-3">Seleccionar Mesa</h3>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {freeTables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setWalkInData(p => ({ ...p, tableId: table.id }))}
                  className={`p-3 border-2 rounded-xl text-center transition-all ${walkInData.tableId === table.id ? 'border-emerald-500 bg-emerald-50' :
                    table.capacity >= walkInData.partySize ? 'border-stone-200 hover:border-emerald-300' : 'border-amber-300 bg-amber-50'
                    }`}
                >
                  <div className="font-bold text-stone-800">{table.number}</div>
                  <div className="text-xs text-stone-500">{table.capacity}p</div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowWalkInModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleWalkIn} disabled={!walkInData.tableId} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="h-4 w-4 mr-2" /> Sentar Cliente
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Check-in Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-800">Check-in con QR</h2>
              <button onClick={() => setShowQRModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
            </div>

            {/* Camera Scanner Area */}
            <div className="mb-4">
              <div
                id="qr-scanner-container"
                className="w-full aspect-square max-w-[250px] mx-auto rounded-xl overflow-hidden bg-stone-900 flex items-center justify-center"
              >
                {!isCameraActive && (
                  <div className="flex flex-col items-center gap-3 text-white p-4">
                    <button
                      onClick={startCamera}
                      className="flex flex-col items-center gap-2 hover:text-emerald-400 transition-colors"
                    >
                      <Camera className="h-10 w-10" />
                      <span className="text-xs font-medium">Activar Cámara</span>
                    </button>

                    <div className="text-stone-500 text-xs">— o —</div>

                    <label className="flex flex-col items-center gap-1 cursor-pointer hover:text-blue-400 transition-colors">
                      <QrCode className="h-8 w-8" />
                      <span className="text-xs font-medium">Subir imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) scanQRFile(file);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
              {isCameraActive && (
                <p className="text-center text-xs text-emerald-600 mt-2 animate-pulse">
                  📷 Escaneando... Apunta al código QR
                </p>
              )}
            </div>

            <div className="text-center text-xs text-stone-400 mb-3">— o ingresa código manualmente —</div>

            <div className="mb-4">
              <Input value={qrCode} onChange={(e) => setQRCode(e.target.value)} placeholder="Código de reserva" className="text-center" />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowQRModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleQRCheckIn} disabled={!qrCode} className="flex-1 bg-purple-600 hover:bg-purple-700">
                <CheckCircle className="h-4 w-4 mr-2" /> Verificar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation List Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-stone-800">
                  <CalendarDays className="h-5 w-5 inline mr-2 text-purple-600" />
                  Reservaciones - {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                <button onClick={() => setShowListModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
              </div>

              {/* Search Bar */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchAllDates}
                    onChange={(e) => setSearchAllDates(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-purple-600 focus:ring-purple-500"
                  />
                  Buscar en todas las fechas
                </label>
              </div>
            </div>

            {/* Reservations List */}
            <div className="flex-1 overflow-y-auto p-4">
              {allReservations.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No se encontraron reservaciones</p>
                  <p className="text-sm">{searchTerm ? 'Intenta con otro término de búsqueda' : 'No hay reservaciones para esta fecha'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allReservations.map(res => (
                    <div key={res.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-stone-800">{res.customerName}</h4>
                            <Badge className={
                              res.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                res.status === 'seated' ? 'bg-emerald-100 text-emerald-700' :
                                  res.status === 'no_show' ? 'bg-red-100 text-red-700' :
                                    res.status === 'cancelled' ? 'bg-stone-100 text-stone-500' :
                                      'bg-stone-100 text-stone-700'
                            }>
                              {res.status === 'confirmed' ? 'Pendiente' :
                                res.status === 'seated' ? 'Sentado' :
                                  res.status === 'no_show' ? 'No-Show' :
                                    res.status === 'cancelled' ? 'Cancelado' : res.status}
                            </Badge>
                            {res.tableNumber && (
                              <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">
                                Mesa {res.tableNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-stone-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {res.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {res.partySize} personas
                            </span>
                            {searchAllDates && res.date && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" /> {res.date}
                              </span>
                            )}
                            {res.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {res.phone}
                              </span>
                            )}
                          </div>
                          {res.notes && (
                            <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                              <AlertCircle className="h-3 w-3 inline mr-1" /> {res.notes}
                            </div>
                          )}
                        </div>
                        {res.status === 'confirmed' && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => {
                                setShowListModal(false);
                                handleSmartCheckIn(res);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              {res.tableNumber ? `Sentar Mesa ${res.tableNumber}` : 'Check-in'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNoShow(res)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              No-Show
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50 rounded-b-xl">
              <div className="flex items-center justify-between text-sm text-stone-600">
                <span>{allReservations.length} reservación(es) encontrada(s)</span>
                <Button variant="outline" onClick={() => setShowListModal(false)}>Cerrar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}