'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Send, Plus, Megaphone, X, Trash2, Users, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Campaign {
  id: string;
  title: string;
  message: string;
  segment: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function AdminMarketing() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Campaign | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', segment: 'all' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (!token || userRole !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
    fetchCampaigns(token);
  }, [router]);

  const fetchCampaigns = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/marketing/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token || !formData.title || !formData.message) return;
    setIsSending(true);
    try {
      const response = await fetch(`${API_URL}/admin/marketing/campaigns`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setFormData({ title: '', message: '', segment: 'all' });
        setShowCreateModal(false);
        fetchCampaigns(token);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_URL}/admin/marketing/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getSegmentLabel = (segment: string) => {
    switch (segment) {
      case 'all': return 'Todos';
      case 'inactive': return 'Inactivos';
      case 'vip': return 'VIP';
      case 'new': return 'Nuevos';
      default: return segment;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-50 text-green-600';
      case 'draft': return 'bg-stone-100 text-stone-600';
      case 'scheduled': return 'bg-blue-50 text-blue-600';
      default: return 'bg-stone-100 text-stone-600';
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div></div>;
  }

  return (
    <AdminLayout title="Marketing" subtitle="Campañas y comunicación con clientes">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
          <CardContent className="p-5"><p className="text-2xl font-semibold text-stone-800">{campaigns.length}</p><p className="text-stone-500 text-sm">Total Campañas</p></CardContent>
        </Card>
        <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
          <CardContent className="p-5"><p className="text-2xl font-semibold text-green-600">{campaigns.filter(c => c.status === 'sent').length}</p><p className="text-stone-500 text-sm">Enviadas</p></CardContent>
        </Card>
        <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
          <CardContent className="p-5"><p className="text-2xl font-semibold text-blue-600">{campaigns.filter(c => c.status === 'scheduled').length}</p><p className="text-stone-500 text-sm">Programadas</p></CardContent>
        </Card>
        <Card className="bg-white border border-stone-200 hover:border-orange-400 transition-colors">
          <CardContent className="p-5">
            <Button onClick={() => setShowCreateModal(true)} className="w-full bg-orange-500 hover:bg-orange-600"><Plus className="h-4 w-4 mr-2" />Nueva Campaña</Button>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card className="bg-white border border-stone-200">
        <CardHeader className="border-b border-stone-100 pb-4">
          <CardTitle className="text-lg font-semibold text-stone-800">Campañas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay campañas</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Campaña</th>
                  <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Segmento</th>
                  <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Estado</th>
                  <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Fecha</th>
                  <th className="text-left py-3 px-5 font-medium text-stone-600 text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600"><Megaphone className="h-5 w-5" /></div>
                        <div>
                          <p className="font-medium text-stone-800">{campaign.title}</p>
                          <p className="text-stone-400 text-sm truncate max-w-[200px]">{campaign.message}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs"><Users className="h-3 w-3 inline mr-1" />{getSegmentLabel(campaign.segment)}</span></td>
                    <td className="py-4 px-5"><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(campaign.status)}`}>{campaign.status}</span></td>
                    <td className="py-4 px-5"><span className="text-sm text-stone-600 flex items-center gap-1"><Calendar className="h-3 w-3 text-stone-400" />{new Date(campaign.createdAt).toLocaleDateString()}</span></td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-orange-50 rounded-lg" onClick={() => setShowDetailModal(campaign)}><Eye className="h-4 w-4 text-orange-500" /></button>
                        <button className="p-2 hover:bg-red-50 rounded-lg" onClick={() => handleDelete(campaign.id)}><Trash2 className="h-4 w-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800">Nueva Campaña</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-stone-100 rounded-lg"><X className="h-5 w-5 text-stone-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700">Título *</label>
                <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Título de la campaña" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Mensaje *</label>
                <Textarea value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} placeholder="Contenido del mensaje" rows={4} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-2">Segmento</label>
                <div className="flex flex-wrap gap-2">
                  {[{ key: 'all', label: 'Todos' }, { key: 'vip', label: 'VIP' }, { key: 'new', label: 'Nuevos' }, { key: 'inactive', label: 'Inactivos' }].map(seg => (
                    <button key={seg.key} onClick={() => setFormData(prev => ({ ...prev, segment: seg.key }))} className={`px-4 py-2 rounded-lg text-sm transition-colors ${formData.segment === seg.key ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                      {seg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-stone-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleCreate} disabled={!formData.title || !formData.message || isSending}>
                <Send className="h-4 w-4 mr-2" />{isSending ? 'Enviando...' : 'Enviar Campaña'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800">{showDetailModal.title}</h3>
              <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-stone-100 rounded-lg"><X className="h-5 w-5 text-stone-400" /></button>
            </div>
            <div className="p-5">
              <div className="flex gap-3 mb-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(showDetailModal.status)}`}>{showDetailModal.status}</span>
                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs"><Users className="h-3 w-3 inline mr-1" />{getSegmentLabel(showDetailModal.segment)}</span>
              </div>
              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-stone-700">{showDetailModal.message}</p>
              </div>
              <div className="mt-4 text-sm text-stone-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Creada: {new Date(showDetailModal.createdAt).toLocaleString()}
                {showDetailModal.sentAt && <span className="ml-4">• Enviada: {new Date(showDetailModal.sentAt).toLocaleString()}</span>}
              </div>
            </div>
            <div className="p-5 border-t border-stone-100">
              <Button variant="outline" className="w-full" onClick={() => setShowDetailModal(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}