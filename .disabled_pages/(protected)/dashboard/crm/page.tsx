/**
 * 📊 CRM Dashboard - Dashboard Principal del CRM
 * 
 * Funcionalidades:
 * - KPIs principales (leads, deals, win rate)
 * - Pipeline visual con drag & drop
 * - Lista de leads con filtros
 * - Importación de leads
 * - LinkedIn scraping
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Plus,
  Filter,
  Download,
  Upload,
  Search,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Linkedin,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';

export default function CRMDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScrapingModal, setShowScrapingModal] = useState(false);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    loadStats();
    loadLeads();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/crm/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (statusFilter.length > 0) params.append('status', statusFilter.join(','));
      if (sourceFilter.length > 0) params.append('source', sourceFilter.join(','));
      if (priorityFilter.length > 0) params.append('priority', priorityFilter.join(','));
      
      const response = await fetch(`/api/crm/leads?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recargar leads cuando cambien filtros
  useEffect(() => {
    loadLeads();
  }, [statusFilter, sourceFilter, priorityFilter]);

  const importTargetClients = async () => {
    try {
      const response = await fetch('/api/crm/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'target_clients',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Importados ${result.imported} leads de clientes objetivo de INMOVA`);
        loadStats();
        loadLeads();
      }
    } catch (error) {
      console.error('Error importing target clients:', error);
      alert('Error al importar clientes objetivo');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-purple-100 text-purple-800',
      qualified: 'bg-green-100 text-green-800',
      negotiation: 'bg-yellow-100 text-yellow-800',
      won: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800',
      nurturing: 'bg-indigo-100 text-indigo-800',
      unresponsive: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority: string) => {
    const icons: Record<string, JSX.Element> = {
      urgent: <AlertCircle className="h-4 w-4 text-red-600" />,
      high: <TrendingUp className="h-4 w-4 text-orange-600" />,
      medium: <Clock className="h-4 w-4 text-yellow-600" />,
      low: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    };
    return icons[priority] || null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-blue-600 font-semibold';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 CRM Dashboard</h1>
            <p className="text-gray-600 mt-1">Gestión de leads y pipeline de ventas</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-5 w-5" />
              Importar
            </button>
            
            <button
              onClick={() => setShowScrapingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Linkedin className="h-5 w-5" />
              LinkedIn Scraping
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard/crm/leads/new'}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nuevo Lead
            </button>
          </div>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.leads.total}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats.leads.new} nuevos
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Deals Activos</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.deals.open}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    de {stats.deals.total} total
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    €{(stats.deals.totalValue / 1000).toFixed(0)}k
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    €{(stats.deals.wonValue / 1000).toFixed(0)}k ganados
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Win Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.leads.winRate}%</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {stats.leads.won} ganados
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <select
              multiple
              value={statusFilter}
              onChange={(e) => setStatusFilter(Array.from(e.target.selectedOptions, option => option.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="qualified">Calificado</option>
              <option value="negotiation">Negociación</option>
              <option value="won">Ganado</option>
              <option value="lost">Perdido</option>
            </select>

            <select
              multiple
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(Array.from(e.target.selectedOptions, option => option.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>

            <button
              onClick={() => {
                setStatusFilter([]);
                setSourceFilter([]);
                setPriorityFilter([]);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Lista de Leads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Leads Recientes</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-4">
                        <Users className="h-12 w-12 text-gray-400" />
                        <p>No hay leads. Comienza importando clientes objetivo.</p>
                        <button
                          onClick={importTargetClients}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Importar Clientes Objetivo de INMOVA
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lead.firstName} {lead.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{lead.jobTitle || 'Sin cargo'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.companyName}</div>
                        <div className="text-sm text-gray-500">{lead.city || 'Sin ubicación'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(lead.priority)}
                          <span className="text-sm text-gray-900 capitalize">{lead.priority}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </a>
                          )}
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => window.location.href = `/dashboard/crm/leads/${lead.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <Linkedin className="h-10 w-10 text-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">LinkedIn Scraping</h3>
            <p className="text-sm text-gray-600 mb-4">
              Busca y extrae perfiles de LinkedIn automáticamente
            </p>
            <button
              onClick={() => setShowScrapingModal(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Scraping
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <FileSpreadsheet className="h-10 w-10 text-green-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Importar CSV</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sube un archivo CSV con tus contactos
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Subir CSV
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <BarChart3 className="h-10 w-10 text-purple-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Clientes Objetivo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Importa clientes objetivo predefinidos de INMOVA
            </p>
            <button
              onClick={importTargetClients}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Importar Ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
