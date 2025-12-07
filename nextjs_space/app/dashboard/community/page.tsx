'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { redirect } from 'next/navigation';
import {
  Calendar,
  MessageSquare,
  Megaphone,
  TrendingUp,
  Users,
  Heart,
  Eye,
  Plus,
  Settings,
  BarChart3,
  CalendarDays,
  FileText,
  Bell
} from 'lucide-react';
import CommunityEventsPanel from './components/CommunityEventsPanel';
import SocialFeedPanel from './components/SocialFeedPanel';
import AnnouncementsPanel from './components/AnnouncementsPanel';
import EngagementMetrics from './components/EngagementMetrics';

export default function CommunityDashboard() {
  const { data: session, status } = useSession() || {};
  const { isCommunityManager, isAdmin, canManageEvents, canViewEngagement } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/community/engagement?period=30');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (canViewEngagement) {
      fetchMetrics();
    } else {
      setLoading(false);
    }
  }, [canViewEngagement]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Verificar acceso
  if (!isCommunityManager && !isAdmin && !canManageEvents) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
                    <p className="text-muted-foreground">
                      No tienes permisos para acceder al panel de gestión de comunidad.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Gestión de Comunidad
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona eventos, contenido social y comunicaciones con la comunidad
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Evento
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Eventos Activos</p>
                  <p className="text-2xl font-bold">{metrics.eventos?.total || 0}</p>
                  {metrics.eventos?.tendencia !== 0 && (
                    <p className={`text-xs ${Number(metrics.eventos.tendencia) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(metrics.eventos.tendencia) > 0 ? '+' : ''}{metrics.eventos.tendencia}% vs mes anterior
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Posts Publicados</p>
                  <p className="text-2xl font-bold">{metrics.posts?.total || 0}</p>
                  {metrics.posts?.tendencia !== 0 && (
                    <p className={`text-xs ${Number(metrics.posts.tendencia) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(metrics.posts.tendencia) > 0 ? '+' : ''}{metrics.posts.tendencia}% vs mes anterior
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Interacciones</p>
                  <p className="text-2xl font-bold">{metrics.interacciones?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.interacciones?.reacciones || 0} reacciones, {metrics.interacciones?.comentarios || 0} comentarios
                  </p>
                </div>
                <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Anuncios Activos</p>
                  <p className="text-2xl font-bold">{metrics.anuncios?.total || 0}</p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Megaphone className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Eventos</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Anuncios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <EngagementMetrics />
        </TabsContent>

        <TabsContent value="events">
          <CommunityEventsPanel />
        </TabsContent>

        <TabsContent value="social">
          <SocialFeedPanel />
        </TabsContent>

        <TabsContent value="announcements">
          <AnnouncementsPanel />
        </TabsContent>
      </Tabs>
    </div>
      </div>
        </main>
      </div>
    </div>
  );
}
