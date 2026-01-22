'use client';

/**
 * Real Estate Developer - Marketing
 * 
 * Gestión de marketing y campañas promocionales
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  TrendingUp,
  Target,
  Calendar,
  Euro,
  Eye,
  MousePointer,
  Mail,
  Phone,
  Globe,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface Campana {
  id: string;
  nombre: string;
  proyecto: string;
  canal: 'digital' | 'prensa' | 'exterior' | 'eventos';
  fechaInicio: string;
  fechaFin: string;
  presupuesto: number;
  gastado: number;
  leads: number;
  visitas: number;
  conversiones: number;
  estado: 'activa' | 'pausada' | 'finalizada' | 'planificada';
}

// Datos cargados desde API /api/real-estate-developer/marketing

interface Lead {
  id: string;
  nombre: string;
  proyecto: string;
  origen: string;
  fecha: string;
}

export default function RealEstateDeveloperMarketingPage() {
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [leadsRecientes, setLeadsRecientes] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampanas = async () => {
      try {
        const response = await fetch('/api/real-estate-developer/marketing');
        if (response.ok) {
          const data = await response.json();
          setCampanas(data.data?.campanas || data.data || []);
          setLeadsRecientes(data.data?.leadsRecientes || []);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampanas();
  }, []);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <Badge className="bg-green-100 text-green-700">Activa</Badge>;
      case 'pausada':
        return <Badge className="bg-yellow-100 text-yellow-700">Pausada</Badge>;
      case 'finalizada':
        return <Badge variant="secondary">Finalizada</Badge>;
      case 'planificada':
        return <Badge className="bg-blue-100 text-blue-700">Planificada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case 'digital':
        return <Globe className="h-4 w-4" />;
      case 'prensa':
        return <Mail className="h-4 w-4" />;
      case 'exterior':
        return <Eye className="h-4 w-4" />;
      case 'eventos':
        return <Users className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  // Stats
  const stats = {
    campanasActivas: campanas.filter((c) => c.estado === 'activa').length,
    totalLeads: campanas.reduce((acc, c) => acc + c.leads, 0),
    presupuestoTotal: campanas.reduce((acc, c) => acc + c.presupuesto, 0),
    gastado: campanas.reduce((acc, c) => acc + c.gastado, 0),
    conversiones: campanas.reduce((acc, c) => acc + c.conversiones, 0),
    costePorLead: Math.round(
      campanas.reduce((acc, c) => acc + c.gastado, 0) /
        campanas.reduce((acc, c) => acc + c.leads, 0)
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Marketing
          </h1>
          <p className="text-muted-foreground">
            Gestión de campañas y leads
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Campaña
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Campañas Activas</p>
                <p className="text-2xl font-bold text-green-600">{stats.campanasActivas}</p>
              </div>
              <Target className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversiones</p>
                <p className="text-2xl font-bold text-purple-600">{stats.conversiones}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coste/Lead</p>
                <p className="text-2xl font-bold">€{stats.costePorLead}</p>
              </div>
              <Euro className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campañas */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campañas de Marketing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campanas.map((campana) => (
                <div key={campana.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {getCanalIcon(campana.canal)}
                        <h4 className="font-semibold">{campana.nombre}</h4>
                        {getEstadoBadge(campana.estado)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {campana.proyecto} · {campana.fechaInicio} - {campana.fechaFin}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {campana.canal}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Presupuesto</span>
                      <span>
                        €{campana.gastado.toLocaleString()} / €{campana.presupuesto.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={(campana.gastado / campana.presupuesto) * 100} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-center">
                    <div>
                      <p className="text-lg font-bold">{campana.visitas.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Visitas</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">{campana.leads}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{campana.conversiones}</p>
                      <p className="text-xs text-muted-foreground">Ventas</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Detalle
                    </Button>
                    {campana.estado === 'activa' && (
                      <Button size="sm" className="flex-1">
                        Optimizar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Leads Recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Leads Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leadsRecientes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay leads recientes</p>
              ) : (
                leadsRecientes.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{lead.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.proyecto}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {lead.origen}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lead.fecha}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full">
                Ver Todos los Leads
              </Button>
            </CardContent>
          </Card>

          {/* Métricas Generales */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas del Mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Inversión Total</span>
                <span className="font-medium">€{stats.gastado.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tasa de Conversión</span>
                <span className="font-medium text-green-600">
                  {((stats.conversiones / stats.totalLeads) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Coste por Conversión</span>
                <span className="font-medium">
                  €{Math.round(stats.gastado / stats.conversiones).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ROI Estimado</span>
                <span className="font-medium text-green-600">425%</span>
              </div>
            </CardContent>
          </Card>

          {/* Canales */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Canal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { canal: 'Digital', porcentaje: 65, leads: 355 },
                { canal: 'Eventos', porcentaje: 20, leads: 45 },
                { canal: 'Exterior', porcentaje: 10, leads: 25 },
                { canal: 'Prensa', porcentaje: 5, leads: 0 },
              ].map((item) => (
                <div key={item.canal} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.canal}</span>
                    <span className="text-muted-foreground">
                      {item.leads} leads ({item.porcentaje}%)
                    </span>
                  </div>
                  <Progress value={item.porcentaje} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
