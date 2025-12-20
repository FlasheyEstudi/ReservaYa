'use client';

import { useState, useEffect } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Megaphone, Plus, Send, Users, Mail, MessageSquare, Calendar, Gift, Percent, X, Eye, Edit, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    type: 'promotion' | 'event' | 'newsletter' | 'reminder';
    status: 'draft' | 'scheduled' | 'active' | 'completed';
    message: string;
    discount?: number;
    startDate: string;
    endDate: string;
    targetAudience: 'all' | 'vip' | 'inactive' | 'new';
    sentCount: number;
    openRate: number;
}

interface Promotion {
    id: string;
    name: string;
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
    validFrom: string;
    validTo: string;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
}

export default function ManageMarketing() {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'promotions' | 'messaging'>('campaigns');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newCampaign, setNewCampaign] = useState({ name: '', type: 'promotion', message: '', discount: 0, startDate: '', endDate: '', targetAudience: 'all' });
    const [newPromo, setNewPromo] = useState({ name: '', code: '', discount: 10, type: 'percentage', validFrom: '', validTo: '', usageLimit: 100 });
    const [quickMessage, setQuickMessage] = useState({ subject: '', message: '', audience: 'all' });
    const [toast, setToast] = useState('');

    useEffect(() => {

        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            // Fetch campaigns from a potential marketing API
            const res = await fetch(`${API_URL}/restaurant/marketing`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.campaigns) {
                    setCampaigns(data.campaigns.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        type: c.type || 'promotion',
                        status: c.isActive ? 'active' : 'completed',
                        message: c.description || '',
                        discount: c.discountPercent || c.discountAmount || 0,
                        startDate: c.startDate?.split('T')[0] || '',
                        endDate: c.endDate?.split('T')[0] || '',
                        targetAudience: 'all',
                        sentCount: 0,
                        openRate: 0
                    })));
                }
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            // Keep empty state if API not available
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Activa</span>;
            case 'scheduled': return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 flex items-center gap-1"><Clock className="h-3 w-3" /> Programada</span>;
            case 'draft': return <span className="px-2 py-1 rounded-full text-xs bg-stone-100 text-stone-600 flex items-center gap-1"><Edit className="h-3 w-3" /> Borrador</span>;
            case 'completed': return <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completada</span>;
            default: return null;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'promotion': return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700"><Percent className="h-3 w-3 inline mr-1" />Promoción</span>;
            case 'event': return <span className="px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-700"><Calendar className="h-3 w-3 inline mr-1" />Evento</span>;
            case 'newsletter': return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"><Mail className="h-3 w-3 inline mr-1" />Newsletter</span>;
            case 'reminder': return <span className="px-2 py-1 rounded-full text-xs bg-stone-100 text-stone-600"><MessageSquare className="h-3 w-3 inline mr-1" />Recordatorio</span>;
            default: return null;
        }
    };

    const handleCreateCampaign = () => {
        const campaign: Campaign = {
            id: Date.now().toString(),
            name: newCampaign.name,
            type: newCampaign.type as any,
            status: 'draft',
            message: newCampaign.message,
            discount: newCampaign.discount,
            startDate: newCampaign.startDate,
            endDate: newCampaign.endDate,
            targetAudience: newCampaign.targetAudience as any,
            sentCount: 0,
            openRate: 0
        };
        setCampaigns(prev => [...prev, campaign]);
        setShowCampaignModal(false);
        setNewCampaign({ name: '', type: 'promotion', message: '', discount: 0, startDate: '', endDate: '', targetAudience: 'all' });
    };

    const handleCreatePromo = () => {
        const promo: Promotion = {
            id: Date.now().toString(),
            name: newPromo.name,
            code: newPromo.code.toUpperCase(),
            discount: newPromo.discount,
            type: newPromo.type as any,
            validFrom: newPromo.validFrom,
            validTo: newPromo.validTo,
            usageLimit: newPromo.usageLimit,
            usedCount: 0,
            isActive: true
        };
        setPromotions(prev => [...prev, promo]);
        setShowPromoModal(false);
        setNewPromo({ name: '', code: '', discount: 10, type: 'percentage', validFrom: '', validTo: '', usageLimit: 100 });
    };


    const handleSendMessage = () => {
        showToast(`Mensaje enviado a ${quickMessage.audience === 'all' ? 'todos los clientes' : quickMessage.audience}`);
        setShowMessageModal(false);
        setQuickMessage({ subject: '', message: '', audience: 'all' });
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleViewCampaign = (campaign: Campaign) => {
        setSelectedCampaign(campaign);
        setIsEditing(false);
        setShowViewModal(true);
    };

    const handleEditCampaign = (campaign: Campaign) => {
        setSelectedCampaign(campaign);
        setNewCampaign({
            name: campaign.name,
            type: campaign.type,
            message: campaign.message,
            discount: campaign.discount || 0,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            targetAudience: campaign.targetAudience
        });
        setIsEditing(true);
        setShowCampaignModal(true);
    };

    const handleUpdateCampaign = () => {
        if (!selectedCampaign) return;
        setCampaigns(prev => prev.map(c =>
            c.id === selectedCampaign.id
                ? { ...c, ...newCampaign, type: newCampaign.type as any, targetAudience: newCampaign.targetAudience as any }
                : c
        ));
        setShowCampaignModal(false);
        setIsEditing(false);
        setSelectedCampaign(null);
        setNewCampaign({ name: '', type: 'promotion', message: '', discount: 0, startDate: '', endDate: '', targetAudience: 'all' });
        showToast('Campaña actualizada');
    };

    const handleDeleteCampaign = (campaign: Campaign) => {
        if (confirm(`¿Eliminar la campaña "${campaign.name}"?`)) {
            setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
            showToast('Campaña eliminada');
        }
    };

    const handleActivateCampaign = (campaign: Campaign) => {
        setCampaigns(prev => prev.map(c =>
            c.id === campaign.id
                ? { ...c, status: c.status === 'active' ? 'draft' : 'active' as any }
                : c
        ));
        showToast(campaign.status === 'active' ? 'Campaña pausada' : 'Campaña activada');
    };

    const stats = {

        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalPromotions: promotions.length,
        activePromotions: promotions.filter(p => p.isActive).length,
    };

    return (
        <ManageLayout title="Marketing" subtitle="Campañas, promociones y mensajería">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-purple-100 text-purple-700"><p className="text-2xl font-bold">{stats.totalCampaigns}</p><p className="text-sm">Campañas</p></div>
                <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700"><p className="text-2xl font-bold">{stats.activeCampaigns}</p><p className="text-sm">Activas</p></div>
                <div className="p-4 rounded-xl bg-amber-100 text-amber-700"><p className="text-2xl font-bold">{stats.totalPromotions}</p><p className="text-sm">Promociones</p></div>
                <div className="p-4 rounded-xl bg-blue-100 text-blue-700"><p className="text-2xl font-bold">{stats.activePromotions}</p><p className="text-sm">Cupones Activos</p></div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'campaigns', label: 'Campañas', icon: Megaphone },
                    { id: 'promotions', label: 'Promociones', icon: Gift },
                    { id: 'messaging', label: 'Mensajería', icon: Send },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setShowCampaignModal(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" /> Nueva Campaña</Button>
                    </div>
                    <Card className="border-stone-200">
                        <CardContent className="p-0">
                            <table className="w-full">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Campaña</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Tipo</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Período</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Enviados</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Apertura</th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-600">Estado</th>
                                        <th className="text-right p-4 text-sm font-medium text-stone-600">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map(c => (
                                        <tr key={c.id} className="border-b border-stone-100 hover:bg-stone-50">
                                            <td className="p-4"><p className="font-medium text-stone-800">{c.name}</p><p className="text-xs text-stone-400 truncate max-w-xs">{c.message}</p></td>
                                            <td className="p-4">{getTypeBadge(c.type)}</td>
                                            <td className="p-4 text-sm text-stone-500">{c.startDate} - {c.endDate}</td>
                                            <td className="p-4 font-medium">{c.sentCount}</td>
                                            <td className="p-4"><span className={`font-medium ${c.openRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>{c.openRate}%</span></td>
                                            <td className="p-4">{getStatusBadge(c.status)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button onClick={() => handleViewCampaign(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver"><Eye className="h-4 w-4" /></button>
                                                    <button onClick={() => handleEditCampaign(c)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg" title="Editar"><Edit className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDeleteCampaign(c)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Promotions Tab */}
            {activeTab === 'promotions' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setShowPromoModal(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" /> Nuevo Cupón</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {promotions.map(p => (
                            <Card key={p.id} className={`border-2 ${p.isActive ? 'border-emerald-200' : 'border-stone-200 opacity-60'}`}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-medium text-stone-800">{p.name}</p>
                                            <p className="text-xs text-stone-400">{p.validFrom} - {p.validTo}</p>
                                        </div>
                                        {p.isActive ? <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Activo</span> : <span className="px-2 py-1 rounded-full text-xs bg-stone-100 text-stone-500">Inactivo</span>}
                                    </div>
                                    <div className="bg-stone-100 rounded-lg p-3 text-center mb-3">
                                        <p className="text-xs text-stone-400">Código</p>
                                        <p className="font-mono font-bold text-lg text-stone-800">{p.code}</p>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-500">Descuento:</span>
                                        <span className="font-bold text-emerald-600">{p.type === 'percentage' ? `${p.discount}%` : `$${p.discount}`}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-stone-500">Usado:</span>
                                        <span className="font-medium">{p.usedCount} / {p.usageLimit}</span>
                                    </div>
                                    <div className="mt-3 h-2 bg-stone-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(p.usedCount / p.usageLimit) * 100}%` }}></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Messaging Tab */}
            {activeTab === 'messaging' && (
                <div className="grid grid-cols-2 gap-6">
                    <Card className="border-stone-200">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Send className="h-5 w-5 text-emerald-600" /> Mensaje Rápido</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Audiencia</label>
                                <select value={quickMessage.audience} onChange={(e) => setQuickMessage(p => ({ ...p, audience: e.target.value }))} className="w-full p-3 border border-stone-200 rounded-lg">
                                    <option value="all">Todos los clientes</option>
                                    <option value="vip">Clientes VIP</option>
                                    <option value="inactive">Clientes inactivos (30+ días)</option>
                                    <option value="new">Clientes nuevos (último mes)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Asunto</label>
                                <Input value={quickMessage.subject} onChange={(e) => setQuickMessage(p => ({ ...p, subject: e.target.value }))} placeholder="¡Tenemos promociones!" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Mensaje</label>
                                <textarea value={quickMessage.message} onChange={(e) => setQuickMessage(p => ({ ...p, message: e.target.value }))} className="w-full p-3 border border-stone-200 rounded-lg h-32 resize-none" placeholder="Escribe tu mensaje aquí..." />
                            </div>
                            <Button onClick={handleSendMessage} className="w-full bg-emerald-600 hover:bg-emerald-700"><Send className="h-4 w-4 mr-2" /> Enviar Mensaje</Button>
                        </CardContent>
                    </Card>

                    <Card className="border-stone-200">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /> Plantillas Rápidas</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { title: 'Recordatorio de Reserva', desc: 'Envía un recordatorio a clientes con reservas', icon: Calendar },
                                { title: 'Promoción del Día', desc: 'Comparte la oferta especial del día', icon: Percent },
                                { title: 'Agradecimiento', desc: 'Agradece a clientes recientes por su visita', icon: Gift },
                                { title: 'Evento Especial', desc: 'Anuncia un evento o celebración', icon: Megaphone },
                            ].map((t, i) => (
                                <button key={i} onClick={() => setQuickMessage(p => ({ ...p, subject: t.title }))} className="w-full flex items-center gap-3 p-4 bg-stone-50 hover:bg-stone-100 rounded-lg text-left transition-colors">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><t.icon className="h-5 w-5 text-emerald-600" /></div>
                                    <div><p className="font-medium text-stone-800">{t.title}</p><p className="text-xs text-stone-400">{t.desc}</p></div>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Campaign Modal */}
            {showCampaignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">{isEditing ? 'Editar Campaña' : 'Nueva Campaña'}</h2>
                            <button onClick={() => { setShowCampaignModal(false); setIsEditing(false); setSelectedCampaign(null); setNewCampaign({ name: '', type: 'promotion', message: '', discount: 0, startDate: '', endDate: '', targetAudience: 'all' }); }} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label><Input value={newCampaign.name} onChange={(e) => setNewCampaign(p => ({ ...p, name: e.target.value }))} placeholder="Happy Hour 2x1" /></div>
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Tipo</label>
                                <select value={newCampaign.type} onChange={(e) => setNewCampaign(p => ({ ...p, type: e.target.value }))} className="w-full p-3 border border-stone-200 rounded-lg">
                                    <option value="promotion">Promoción</option><option value="event">Evento</option><option value="newsletter">Newsletter</option><option value="reminder">Recordatorio</option>
                                </select>
                            </div>
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Audiencia</label>
                                <select value={newCampaign.targetAudience} onChange={(e) => setNewCampaign(p => ({ ...p, targetAudience: e.target.value }))} className="w-full p-3 border border-stone-200 rounded-lg">
                                    <option value="all">Todos los clientes</option><option value="vip">Clientes VIP</option><option value="inactive">Clientes inactivos</option><option value="new">Clientes nuevos</option>
                                </select>
                            </div>
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Mensaje</label><textarea value={newCampaign.message} onChange={(e) => setNewCampaign(p => ({ ...p, message: e.target.value }))} className="w-full p-3 border border-stone-200 rounded-lg h-24 resize-none" placeholder="Escribe el mensaje de la campaña..." /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-stone-700 mb-1">Desde</label><Input type="date" value={newCampaign.startDate} onChange={(e) => setNewCampaign(p => ({ ...p, startDate: e.target.value }))} /></div>
                                <div><label className="block text-sm font-medium text-stone-700 mb-1">Hasta</label><Input type="date" value={newCampaign.endDate} onChange={(e) => setNewCampaign(p => ({ ...p, endDate: e.target.value }))} /></div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => { setShowCampaignModal(false); setIsEditing(false); setSelectedCampaign(null); setNewCampaign({ name: '', type: 'promotion', message: '', discount: 0, startDate: '', endDate: '', targetAudience: 'all' }); }} className="flex-1">Cancelar</Button>
                            <Button onClick={isEditing ? handleUpdateCampaign : handleCreateCampaign} className="flex-1 bg-emerald-600 hover:bg-emerald-700">{isEditing ? 'Guardar' : 'Crear Campaña'}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Campaign Modal */}
            {showViewModal && selectedCampaign && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Detalle de Campaña</h2>
                            <button onClick={() => { setShowViewModal(false); setSelectedCampaign(null); }} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-stone-800">{selectedCampaign.name}</h3>
                                {getStatusBadge(selectedCampaign.status)}
                            </div>
                            <div className="flex gap-2">
                                {getTypeBadge(selectedCampaign.type)}
                            </div>
                            <div className="p-4 bg-stone-50 rounded-lg">
                                <p className="text-sm text-stone-600">{selectedCampaign.message || 'Sin mensaje'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-stone-500">Inicio:</span> <span className="font-medium">{selectedCampaign.startDate}</span></div>
                                <div><span className="text-stone-500">Fin:</span> <span className="font-medium">{selectedCampaign.endDate}</span></div>
                                <div><span className="text-stone-500">Enviados:</span> <span className="font-medium">{selectedCampaign.sentCount}</span></div>
                                <div><span className="text-stone-500">Apertura:</span> <span className="font-medium">{selectedCampaign.openRate}%</span></div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => { setShowViewModal(false); setSelectedCampaign(null); }} className="flex-1">Cerrar</Button>
                            <Button onClick={() => { setShowViewModal(false); handleEditCampaign(selectedCampaign); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Editar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Promo Modal */}
            {showPromoModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-stone-800">Nuevo Cupón</h2>
                            <button onClick={() => setShowPromoModal(false)} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label><Input value={newPromo.name} onChange={(e) => setNewPromo(p => ({ ...p, name: e.target.value }))} placeholder="Descuento VIP" /></div>
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Código</label><Input value={newPromo.code} onChange={(e) => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="VIP20" className="font-mono uppercase" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-stone-700 mb-1">Descuento</label><Input type="number" value={newPromo.discount} onChange={(e) => setNewPromo(p => ({ ...p, discount: parseInt(e.target.value) || 0 }))} /></div>
                                <div><label className="block text-sm font-medium text-stone-700 mb-1">Tipo</label>
                                    <select value={newPromo.type} onChange={(e) => setNewPromo(p => ({ ...p, type: e.target.value }))} className="w-full p-3 border border-stone-200 rounded-lg">
                                        <option value="percentage">Porcentaje (%)</option><option value="fixed">Monto Fijo ($)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-stone-700 mb-1">Válido Desde</label><Input type="date" value={newPromo.validFrom} onChange={(e) => setNewPromo(p => ({ ...p, validFrom: e.target.value }))} /></div>
                                <div><label className="block text-sm font-medium text-stone-700 mb-1">Válido Hasta</label><Input type="date" value={newPromo.validTo} onChange={(e) => setNewPromo(p => ({ ...p, validTo: e.target.value }))} /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-stone-700 mb-1">Límite de Uso</label><Input type="number" value={newPromo.usageLimit} onChange={(e) => setNewPromo(p => ({ ...p, usageLimit: parseInt(e.target.value) || 100 }))} /></div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowPromoModal(false)} className="flex-1">Cancelar</Button>
                            <Button onClick={handleCreatePromo} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Crear Cupón</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-4 right-4 bg-stone-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
                    {toast}
                </div>
            )}
        </ManageLayout>

    );
}
