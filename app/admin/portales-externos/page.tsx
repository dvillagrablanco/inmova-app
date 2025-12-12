'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Users,
  Home,
  Wrench,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Activity,
  BarChart3,
  FileText,
  Globe,
  Shield,
  Bell,
  Palette,
  Save,
  ExternalLink,
} from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';


interface PortalConfig {
  enabled: boolean;
  title: string;
  description: string;
  features: {
    payments: boolean;
    documents: boolean;
    maintenance: boolean;
    communications: boolean;
    reports: boolean;
  };
  branding?: {
    primaryColor: string;
    logo?: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface PortalStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  lastActivity: string;
}

interface Portal {
  id: string;
  name: string;
  type: 'inquilino' | 'propietario' | 'proveedor';
  icon: any;
  url: string;
  config: PortalConfig;
  stats: PortalStats;
}

export default function PortalesExternosPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [portals, setPortals] = useState<Portal[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
      } else {
        loadPortals();
      }
    }
  }, [status, session, router]);

  const loadPortals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/external-portals');
      if (response.ok) {
        const data = await response.json();
        setPortals(data);
      } else {
        throw new Error('Error al cargar portales');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar portales');
      // Set default portals if API fails
      setPortals(getDefaultPortals());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPortals = (): Portal[] => [
    {
      id: '1',
      name: 'Portal Inquilinos',
      type: 'inquilino',
      icon: Users,
      url: '/portal-inquilino',
      config: {
        enabled: true,
        title: 'Portal del Inquilino',
        description: 'Acceso para inquilinos a pagos, documentos y solicitudes',
        features: {
          payments: true,
          documents: true,
          maintenance: true,
          communications: true,
          reports: true,
        },
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        pendingApprovals: 0,
        lastActivity: new Date().toISOString(),
      },
    },
    {
      id: '2',
      name: 'Portal Propietarios',
      type: 'propietario',
      icon: Home,
      url: '/portal-propietario',
      config: {
        enabled: true,
        title: 'Portal del Propietario',
        description: 'Acceso para propietarios a reportes financieros y gestión',
        features: {
          payments: true,
          documents: true,
          maintenance: true,
          communications: true,
          reports: true,
        },
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        pendingApprovals: 0,
        lastActivity: new Date().toISOString(),
      },
    },
    {
      id: '3',
      name: 'Portal Proveedores',
      type: 'proveedor',
      icon: Wrench,
      url: '/portal-proveedor',
      config: {
        enabled: true,
        title: 'Portal del Proveedor',
        description: 'Acceso para proveedores a órdenes de trabajo y facturación',
        features: {
          payments: true,
          documents: true,
          maintenance: true,
          communications: true,
          reports: true,
        },
        notifications: {
          email: true,
          push: false,
          sms: false,
        },
      },
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        pendingApprovals: 0,
        lastActivity: new Date().toISOString(),
      },
    },
  ];

  const handleTogglePortal = async (portalId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/external-portals/${portalId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        toast.success(`Portal ${enabled ? 'activado' : 'desactivado'} correctamente`);
        loadPortals();
      } else {
        throw new Error('Error al actualizar portal');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar portal');
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedPortal) return;

    try {
      const response = await fetch(`/api/admin/external-portals/${selectedPortal.id}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedPortal.config),
      });

      if (response.ok) {
        toast.success('Configuración guardada correctamente');
        setShowConfigDialog(false);
        loadPortals();
      } else {
        throw new Error('Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar configuración');
    }
  };

  const updatePortalConfig = (updates: Partial<PortalConfig>) => {
    if (!selectedPortal) return;
    setSelectedPortal({
      ...selectedPortal,
      config: { ...selectedPortal.config, ...updates },
    });
  };

  const updatePortalFeatures = (feature: keyof PortalConfig['features'], value: boolean) => {
    if (!selectedPortal) return;
    setSelectedPortal({
      ...selectedPortal,
      config: {
        ...selectedPortal.config,
        features: { ...selectedPortal.config.features, [feature]: value },
      },
    });
  };

  const updatePortalNotifications = (
    notification: keyof PortalConfig['notifications'],
    value: boolean
  ) => {
    if (!selectedPortal) return;
    setSelectedPortal({
      ...selectedPortal,
      config: {
        ...selectedPortal.config,
        notifications: { ...selectedPortal.config.notifications, [notification]: value },
      },
    });
  };

  if (status === 'loading' || loading) {
    return <LoadingState message="Cargando portales externos..." />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Gestión de Portales Externos
            </h1>
            <p className="mt-1 text-muted-foreground">
              Controla y configura los portales de acceso para inquilinos, propietarios y proveedores
            </p>
          </div>

          {/* Portal Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Card key={portal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>{portal.name}</CardTitle>
                          <CardDescription className="mt-1">{portal.config.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Estado */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estado</span>
                      <div className="flex items-center gap-2">
                        {portal.config.enabled ? (
                          <Badge variant="default" className="gap-1">
                            <Unlock className="h-3 w-3" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Inactivo
                          </Badge>
                        )}
                        <Switch
                          checked={portal.config.enabled}
                          onCheckedChange={(checked) => handleTogglePortal(portal.id, checked)}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total usuarios</span>
                        <span className="font-semibold">{portal.stats.totalUsers}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Usuarios activos</span>
                        <span className="font-semibold text-green-600">
                          {portal.stats.activeUsers}
                        </span>
                      </div>
                      {portal.stats.pendingApprovals > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Pendientes aprobación</span>
                          <span className="font-semibold text-orange-600">
                            {portal.stats.pendingApprovals}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedPortal(portal);
                          setShowConfigDialog(true);
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Configurar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(portal.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Configuration Dialog */}
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedPortal && (
                    <>
                      {(() => {
                        const Icon = selectedPortal.icon;
                        return <Icon className="h-5 w-5" />;
                      })()}
                      Configuración - {selectedPortal.name}
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>

              {selectedPortal && (
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="features">Funcionalidades</TabsTrigger>
                    <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título del Portal</Label>
                      <Input
                        id="title"
                        value={selectedPortal.config.title}
                        onChange={(e) => updatePortalConfig({ title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={selectedPortal.config.description}
                        onChange={(e) => updatePortalConfig({ description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Portal Habilitado</Label>
                        <p className="text-sm text-muted-foreground">
                          Permite que los usuarios accedan al portal
                        </p>
                      </div>
                      <Switch
                        checked={selectedPortal.config.enabled}
                        onCheckedChange={(checked) => updatePortalConfig({ enabled: checked })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecciona qué funcionalidades estarán disponibles en este portal
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Pagos</p>
                            <p className="text-sm text-muted-foreground">
                              Gestión de pagos y recibos
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={selectedPortal.config.features.payments}
                          onCheckedChange={(checked) => updatePortalFeatures('payments', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Documentos</p>
                            <p className="text-sm text-muted-foreground">
                              Contratos y documentos legales
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={selectedPortal.config.features.documents}
                          onCheckedChange={(checked) => updatePortalFeatures('documents', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Wrench className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Mantenimiento</p>
                            <p className="text-sm text-muted-foreground">
                              Solicitudes de mantenimiento
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={selectedPortal.config.features.maintenance}
                          onCheckedChange={(checked) => updatePortalFeatures('maintenance', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Comunicaciones</p>
                            <p className="text-sm text-muted-foreground">Mensajería y avisos</p>
                          </div>
                        </div>
                        <Switch
                          checked={selectedPortal.config.features.communications}
                          onCheckedChange={(checked) =>
                            updatePortalFeatures('communications', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Reportes</p>
                            <p className="text-sm text-muted-foreground">
                              Informes y estadísticas
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={selectedPortal.config.features.reports}
                          onCheckedChange={(checked) => updatePortalFeatures('reports', checked)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="notifications" className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Configura los métodos de notificación para los usuarios de este portal
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Notificaciones Email</p>
                            <p className="text-sm text-muted-foreground">
                              Envío de notificaciones por correo electrónico
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={selectedPortal.config.notifications.email}
                          onCheckedChange={(checked) => updatePortalNotifications('email', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Notificaciones Push</p>
                            <p className="text-sm text-muted-foreground">
                              Notificaciones en el navegador o app
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={selectedPortal.config.notifications.push}
                          onCheckedChange={(checked) => updatePortalNotifications('push', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Notificaciones SMS</p>
                            <p className="text-sm text-muted-foreground">
                              Mensajes de texto para alertas urgentes
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={selectedPortal.config.notifications.sms}
                          onCheckedChange={(checked) => updatePortalNotifications('sms', checked)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="branding" className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Personaliza la apariencia del portal para esta audiencia
                    </p>
                    <div>
                      <Label htmlFor="primaryColor">Color Principal</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={selectedPortal.config.branding?.primaryColor || '#6366f1'}
                          onChange={(e) =>
                            updatePortalConfig({
                              branding: {
                                ...selectedPortal.config.branding,
                                primaryColor: e.target.value,
                              },
                            })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          value={selectedPortal.config.branding?.primaryColor || '#6366f1'}
                          onChange={(e) =>
                            updatePortalConfig({
                              branding: {
                                ...selectedPortal.config.branding,
                                primaryColor: e.target.value,
                              },
                            })
                          }
                          placeholder="#6366f1"
                        />
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-start gap-2">
                        <Palette className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Vista Previa</p>
                          <p className="text-sm text-muted-foreground">
                            Los cambios de branding se aplicarán en tiempo real al portal
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig} className="gradient-primary">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
