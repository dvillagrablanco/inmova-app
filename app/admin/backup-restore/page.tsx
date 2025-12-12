'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Database, Download, Upload, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import logger from '@/lib/logger';
import { toast } from 'sonner';


interface Backup {
  filename: string;
  path: string;
  size: number;
  createdAt: string;
}

export default function BackupRestorePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/backup');

      if (!response.ok) {
        throw new Error('Error al obtener backups');
      }

      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      logger.error('Error al cargar backups:', error);
      toast.error('Error al cargar la lista de backups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      fetchBackups();
    }
  }, [session]);

  const createBackup = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'full' }),
      });

      if (!response.ok) {
        throw new Error('Error al crear backup');
      }

      const data = await response.json();
      toast.success('Backup creado exitosamente');
      await fetchBackups();
    } catch (error) {
      logger.error('Error al crear backup:', error);
      toast.error('Error al crear el backup');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    try {
      setRestoring(true);
      const response = await fetch('/api/admin/backup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedBackup.filename }),
      });

      if (!response.ok) {
        throw new Error('Error al restaurar backup');
      }

      toast.success('Backup restaurado exitosamente');
      setShowRestoreDialog(false);
      setSelectedBackup(null);
    } catch (error) {
      logger.error('Error al restaurar backup:', error);
      toast.error('Error al restaurar el backup');
    } finally {
      setRestoring(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session?.user?.role !== 'super_admin') {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Acceso Denegado</AlertTitle>
                <AlertDescription>No tienes permisos para acceder a esta página.</AlertDescription>
              </Alert>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Backup y Restauración</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona copias de seguridad de la base de datos
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchBackups} variant="outline" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                <Button onClick={createBackup} disabled={creating}>
                  <Download className={`h-4 w-4 mr-2 ${creating ? 'animate-spin' : ''}`} />
                  {creating ? 'Creando...' : 'Crear Backup'}
                </Button>
              </div>
            </div>

            {/* Advertencia */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                La restauración de un backup sobrescribirá todos los datos actuales de la base de
                datos. Asegúrate de crear un backup antes de restaurar uno anterior.
              </AlertDescription>
            </Alert>

            {/* Información de Configuración */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Configuración de Backups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tipo de backup:</span>
                    <Badge>Completo (Full)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Formato:</span>
                    <Badge variant="outline">PostgreSQL Custom Format</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total de backups:</span>
                    <Badge variant="secondary">{backups.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Backups */}
            <Card>
              <CardHeader>
                <CardTitle>Backups Disponibles</CardTitle>
                <CardDescription>
                  Selecciona un backup para restaurar o descarga uno para guardarlo externamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {backups.length > 0 ? (
                  <div className="space-y-2">
                    {backups.map((backup) => (
                      <div
                        key={backup.filename}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                      >
                        <div className="flex items-center gap-4">
                          <Database className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">{backup.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(backup.createdAt).toLocaleString()} •{' '}
                              {formatBytes(backup.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowRestoreDialog(true);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Restaurar
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold text-muted-foreground">
                      No hay backups disponibles
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Crea tu primer backup para comenzar
                    </p>
                    <Button onClick={createBackup} disabled={creating} className="mt-4">
                      <Download className="h-4 w-4 mr-2" />
                      Crear Primer Backup
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dialog de Confirmación de Restauración */}
            <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Restauración</DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de que deseas restaurar este backup?
                  </DialogDescription>
                </DialogHeader>
                {selectedBackup && (
                  <div className="space-y-2 py-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Archivo:</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedBackup.filename}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Fecha:</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(selectedBackup.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Tamaño:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatBytes(selectedBackup.size)}
                      </span>
                    </div>
                  </div>
                )}
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Advertencia</AlertTitle>
                  <AlertDescription>
                    Esta acción sobrescribirá todos los datos actuales y no se puede deshacer. Se
                    recomienda crear un backup actual antes de continuar.
                  </AlertDescription>
                </Alert>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRestoreDialog(false);
                      setSelectedBackup(null);
                    }}
                    disabled={restoring}
                  >
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleRestore} disabled={restoring}>
                    {restoring ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Restaurando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Restaurar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
