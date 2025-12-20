'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wine, Clock, CheckCircle, AlertCircle, Timer, Volume2, VolumeX, LogOut, Flame, GlassWater } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    notes?: string;
    status: 'pending' | 'preparing' | 'ready';
}

interface Ticket {
    id: string;
    tableNumber: string;
    orderTime: string;
    items: OrderItem[];
    status: 'pending' | 'preparing' | 'ready';
    priority: 'normal' | 'urgent';
}

export default function BarWorkspace() {
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
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const res = await fetch(`${API_URL}/orders?status=active&destination=bar`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                const newTickets = data.orders || [];
                if (newTickets.length > tickets.length && soundEnabled) {
                    playNotification();
                }
                setTickets(newTickets);
            } else {
                console.error('Failed to fetch bar orders');
            }
        } catch (err) {
            console.error('Error fetching bar orders:', err);
        }
    };


    const playNotification = useCallback(() => {
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        setLastNotification('¡Nuevo pedido de bebidas!');
        setTimeout(() => setLastNotification(null), 3000);
    }, []);

    const getTimeElapsed = (orderTime: string) => {
        const diff = Math.floor((currentTime.getTime() - new Date(orderTime).getTime()) / 60000);
        return diff;
    };

    const getTimerColor = (minutes: number) => {
        if (minutes < 5) return 'text-emerald-400';
        if (minutes < 10) return 'text-amber-400';
        return 'text-red-400';
    };

    const handleItemClick = (ticketId: string, itemId: string) => {
        setTickets(prev => prev.map(ticket => {
            if (ticket.id === ticketId) {
                const updatedItems = ticket.items.map(item => {
                    if (item.id === itemId) {
                        const newStatus = item.status === 'pending' ? 'preparing' : 'ready';
                        return { ...item, status: newStatus as any };
                    }
                    return item;
                });
                const allReady = updatedItems.every(i => i.status === 'ready');
                return { ...ticket, items: updatedItems, status: allReady ? 'ready' : 'preparing' as any };
            }
            return ticket;
        }));
    };

    const handleTicketReady = async (ticketId: string) => {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'ready' as any } : t));
        console.log('📡 Socket emit: bar_order_ready', { ticketId });
    };

    const handleArchiveTicket = (ticketId: string) => {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/auth/login';
    };

    const activeTickets = tickets.filter(t => t.status !== 'ready');
    const readyTickets = tickets.filter(t => t.status === 'ready');

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Notification Toast */}
            {lastNotification && (
                <div className="fixed top-4 right-4 z-50 bg-purple-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
                    <div className="flex items-center gap-2">
                        <Wine className="h-5 w-5" />
                        {lastNotification}
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                            <Wine className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Bar</h1>
                            <p className="text-slate-400 text-sm">Sistema de Pedidos de Bebidas</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-lg ${soundEnabled ? 'bg-purple-600' : 'bg-slate-700'}`}>
                            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        </button>
                        <div className="text-right">
                            <div className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString()}</div>
                            <div className="text-sm text-slate-400">{currentTime.toLocaleDateString()}</div>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white"><LogOut className="h-5 w-5" /></button>
                    </div>
                </div>
            </header>

            <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Pendientes', value: tickets.filter(t => t.status === 'pending').length, color: 'text-blue-400' },
                        { label: 'Preparando', value: tickets.filter(t => t.status === 'preparing').length, color: 'text-amber-400' },
                        { label: 'Listos', value: readyTickets.length, color: 'text-emerald-400' },
                        { label: 'Urgentes', value: tickets.filter(t => t.priority === 'urgent').length, color: 'text-red-400' },
                    ].map((s, i) => (
                        <Card key={i} className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4 text-center">
                                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                                <div className="text-sm text-slate-400">{s.label}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Active Tickets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                    {activeTickets.map(ticket => {
                        const elapsed = getTimeElapsed(ticket.orderTime);
                        return (
                            <Card key={ticket.id} className={`bg-slate-800 border-2 ${ticket.priority === 'urgent' ? 'border-red-500' : 'border-slate-700'}`}>
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
                                    {ticket.items.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleItemClick(ticket.id, item.id)}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${item.status === 'pending' ? 'bg-slate-700 border-slate-600 hover:border-purple-500' :
                                                item.status === 'preparing' ? 'bg-purple-900/40 border-purple-500' :
                                                    'bg-emerald-900/40 border-emerald-500'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="text-slate-400 ml-2">x{item.quantity}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {item.status === 'pending' && <Clock className="h-4 w-4 text-slate-400" />}
                                                    {item.status === 'preparing' && <GlassWater className="h-4 w-4 text-purple-400" />}
                                                    {item.status === 'ready' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                                                </div>
                                            </div>
                                            {item.notes && <p className="text-xs text-slate-400 mt-1 italic">📝 {item.notes}</p>}
                                        </div>
                                    ))}
                                    <Button
                                        onClick={() => handleTicketReady(ticket.id)}
                                        disabled={!ticket.items.every(i => i.status === 'ready')}
                                        className="w-full mt-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-lg py-6"
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2" /> ¡BEBIDAS LISTAS!
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
                                        <div className="text-sm text-emerald-400">{t.items.length} bebidas</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {tickets.length === 0 && (
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-16 text-center">
                            <Wine className="h-20 w-20 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-slate-400 mb-2">Sin pedidos de bebidas</h3>
                            <p className="text-slate-500">Los nuevos pedidos aparecerán automáticamente</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
