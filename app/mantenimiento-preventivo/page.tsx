'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Calendar,
  Clock,
  Plus,
  Check,
  X,
  Building2,
  Home as HomeIcon,
  AlertCircle,
  Edit,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger, { logError } from '@/lib/logger';


interface MaintenanceSchedule {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  building?: any;
  unit?: any;
  frecuencia: string;
  proximaFecha: string;
  ultimaFecha?: string;
  diasAnticipacion: number;
  activo: boolean;
  provider?: any;
  costoEstimado?: number;
  notas?: string;
  createdAt: string;
}

export default function MantenimientoPreventivoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<MaintenanceSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterActivo, setFilterActivo] = useState('true');
  const [filterUpcoming, setFilterUpcoming] = useState('all');

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'inspeccion',
    buildingId: '',
    unitId: '',
    frecuencia: 'mensual',
    proximaFecha: '',
    diasAnticipacion: '15',
    providerId: '',
    costoEstimado: '',
    notas: '',
  });

  const [buildings, setBuildings] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return;

      setIsLoading(true);
      try {
        const [schedRes, buildRes, provRes] = await Promise.all([
          fetch('/api/maintenance-schedule'),
          fetch('/api/buildings'),
          fetch('/api/providers'),
        ]);

        if (schedRes.ok) setSchedules(await schedRes.json());
        if (buildRes.ok) setBuildings(await buildRes.json());
        if (provRes.ok) setProviders(await provRes.json());
      } catch (error) {
        logger.error('Error fetching data:', error);
        toast.error('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status]);

  useEffect(() => {
    let filtered = [...schedules];

    if (filterActivo !== 'all') {
      filtered = filtered.filter((s) => s.activo === (filterActivo === 'true'));
    }

    if (filterUpcoming === 'upcoming') {
      const now = new Date();
      const in30Days = new Date(now);
      in30Days.setDate(in30Days.getDate() + 30);
      filtered = filtered.filter((s) => {
        const fecha = new Date(s.proximaFecha);
        return fecha >= now && fecha <= in30Days;
      });
    }

    setFilteredSchedules(filtered);
  }, [schedules, filterActivo, filterUpcoming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/maintenance-schedule/${editingId}`
        : '/api/maintenance-schedule';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingId ? 'Mantenimiento actualizado' : 'Mantenimiento programado creado');
        setShowModal(false);
        resetForm();

        const schedRes = await fetch('/api/maintenance-schedule');
        if (schedRes.ok) setSchedules(await schedRes.json());
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al guardar');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/maintenance-schedule/${id}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Mantenimiento completado. Próxima fecha calculada.');
        const schedRes = await fetch('/api/maintenance-schedule');
        if (schedRes.ok) setSchedules(await schedRes.json());
      } else {
        toast.error('Error al completar mantenimiento');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al completar mantenimiento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta programación?')) return;

    try {
      const response = await fetch(`/api/maintenance-schedule/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Mantenimiento eliminado');
        setSchedules(schedules.filter((s) => s.id !== id));
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  const handleEdit = (schedule: MaintenanceSchedule) => {
    setEditingId(schedule.id);
    setFormData({
      titulo: schedule.titulo,
      descripcion: schedule.descripcion,
      tipo: schedule.tipo,
      buildingId: schedule.building?.id || '',
      unitId: schedule.unit?.id || '',
      frecuencia: schedule.frecuencia,
      proximaFecha: schedule.proximaFecha.split('T')[0],
      diasAnticipacion: schedule.diasAnticipacion.toString(),
      providerId: schedule.provider?.id || '',
      costoEstimado: schedule.costoEstimado?.toString() || '',
      notas: schedule.notas || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'inspeccion',
      buildingId: '',
      unitId: '',
      frecuencia: 'mensual',
      proximaFecha: '',
      diasAnticipacion: '15',
      providerId: '',
      costoEstimado: '',
      notas: '',
    });
    setEditingId(null);
  };

  const getDaysUntil = (fecha: string) => {
    const now = new Date();
    const target = new Date(fecha);
    const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getPriorityColor = (days: number) => {
    if (days < 0) return 'text-red-600 bg-red-50';
    if (days <= 7) return 'text-orange-600 bg-orange-50';
    if (days <= 15) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <HomeIcon className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Mantenimiento Preventivo</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mantenimiento Preventivo</h1>
              <p className="text-muted-foreground">
                Gestiona las programaciones de mantenimiento recurrente
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select
                    value={filterActivo}
                    onChange={(e) => setFilterActivo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtro Temporal
                  </label>
                  <select
                    value={filterUpcoming}
                    onChange={(e) => setFilterUpcoming(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">Todos</option>
                    <option value="upcoming">Próximos 30 días</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Plus size={20} />
                  Nuevo Mantenimiento
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredSchedules.map((schedule) => {
                const daysUntil = getDaysUntil(schedule.proximaFecha);
                const priorityColor = getPriorityColor(daysUntil);
                const location = schedule.unit
                  ? `${schedule.unit.building?.nombre || ''} - ${schedule.unit.numero}`
                  : schedule.building?.nombre || 'General';

                return (
                  <div
                    key={schedule.id}
                    className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
                      schedule.activo ? 'border-gray-100' : 'border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{schedule.titulo}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColor}`}
                          >
                            {daysUntil < 0
                              ? `Vencido hace ${Math.abs(daysUntil)} días`
                              : daysUntil === 0
                                ? 'Hoy'
                                : `En ${daysUntil} días`}
                          </span>
                          {!schedule.activo && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                              Inactivo
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3">{schedule.descripcion}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Ubicación:</span>
                            <p className="font-medium text-gray-900">{location}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Tipo:</span>
                            <p className="font-medium text-gray-900 capitalize">{schedule.tipo}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Frecuencia:</span>
                            <p className="font-medium text-gray-900 capitalize">
                              {schedule.frecuencia}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Próxima Fecha:</span>
                            <p className="font-medium text-gray-900">
                              {new Date(schedule.proximaFecha).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          {schedule.ultimaFecha && (
                            <div>
                              <span className="text-gray-500">Última Ejecución:</span>
                              <p className="font-medium text-gray-900">
                                {new Date(schedule.ultimaFecha).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          )}
                          {schedule.provider && (
                            <div>
                              <span className="text-gray-500">Proveedor:</span>
                              <p className="font-medium text-gray-900">
                                {schedule.provider.nombre}
                              </p>
                            </div>
                          )}
                          {schedule.costoEstimado && (
                            <div>
                              <span className="text-gray-500">Costo Estimado:</span>
                              <p className="font-medium text-gray-900">
                                €{schedule.costoEstimado.toLocaleString('es-ES')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleComplete(schedule.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Marcar como completado"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredSchedules.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay mantenimientos programados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza creando tu primera programación de mantenimiento preventivo
                  </p>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowModal(true);
                    }}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Crear Primer Mantenimiento
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingId ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento Preventivo'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    >
                      <option value="inspeccion">Inspección</option>
                      <option value="limpieza">Limpieza</option>
                      <option value="revision_tecnica">Revisión Técnica</option>
                      <option value="certificacion">Certificación</option>
                      <option value="reparacion">Reparación</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frecuencia *
                    </label>
                    <select
                      value={formData.frecuencia}
                      onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    >
                      <option value="mensual">Mensual</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Edificio</label>
                    <select
                      value={formData.buildingId}
                      onChange={(e) =>
                        setFormData({ ...formData, buildingId: e.target.value, unitId: '' })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">General/Todos</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="ID de unidad específica"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Próxima Fecha *
                    </label>
                    <input
                      type="date"
                      value={formData.proximaFecha}
                      onChange={(e) => setFormData({ ...formData, proximaFecha: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Días de Anticipación
                    </label>
                    <input
                      type="number"
                      value={formData.diasAnticipacion}
                      onChange={(e) =>
                        setFormData({ ...formData, diasAnticipacion: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      min="1"
                      max="90"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedor
                    </label>
                    <select
                      value={formData.providerId}
                      onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Sin asignar</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Costo Estimado (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.costoEstimado}
                      onChange={(e) => setFormData({ ...formData, costoEstimado: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    {editingId ? 'Actualizar' : 'Crear'} Mantenimiento
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
