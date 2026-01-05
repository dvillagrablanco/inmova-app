'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HardHat,
  Building2,
  MapPin,
  Star,
  CheckCircle2,
  Upload,
  FileText,
  Shield,
  Users,
  Briefcase,
  Phone,
  Mail,
  Globe,
  Edit2,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface PerfilEmpresa {
  id: string;
  nombreEmpresa: string;
  tipoEmpresa: string;
  especialidades: string[];
  subespecialidades: string[];
  zonasOperacion: string[];
  radioOperacionKm: number;
  numeroTrabajadores: number;
  experienciaAnios: number;
  valoracionMedia: number;
  totalReviews: number;
  verificado: boolean;
  disponible: boolean;
  descripcion?: string;
  telefono?: string;
  emailContacto?: string;
  web?: string;
  // Documentos
  numeroREA?: string;
  estadoREA: string;
  numeroSeguroRC?: string;
  estadoSeguro: string;
}

export default function EwoorkerPerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilEmpresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await fetch('/api/ewoorker/perfil');
        if (response.ok) {
          const data = await response.json();
          setPerfil(data.perfil);
        } else if (response.status === 404) {
          // No tiene perfil, redirigir a crear
          router.push('/ewoorker/registro');
        }
      } catch (error) {
        console.error('Error fetching perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchPerfil();
    }
  }, [session, router]);

  const handleGuardar = async () => {
    if (!perfil) return;
    
    setGuardando(true);
    try {
      const response = await fetch('/api/ewoorker/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perfil),
      });

      if (response.ok) {
        toast.success('Perfil actualizado correctamente');
        setEditando(false);
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      toast.error('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin perfil de empresa</h3>
            <p className="text-gray-500 mb-6">
              Necesitas crear un perfil de empresa para usar eWoorker
            </p>
            <Link href="/ewoorker/registro">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Crear Perfil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HardHat className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Mi Perfil de Empresa</h1>
                <p className="text-orange-100">Gestiona la información de tu empresa</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {editando ? (
                <>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/20"
                    onClick={() => setEditando(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-white text-orange-600 hover:bg-gray-100"
                    onClick={handleGuardar}
                    disabled={guardando}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/20"
                    onClick={() => setEditando(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Link href="/ewoorker/dashboard">
                    <Button variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
                      Volver al Dashboard
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Info principal */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold mb-1">{perfil.nombreEmpresa}</h2>
                <p className="text-gray-500 mb-3">{perfil.tipoEmpresa}</p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  {perfil.verificado ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Pendiente verificación
                    </Badge>
                  )}
                  {perfil.disponible ? (
                    <Badge className="bg-blue-100 text-blue-800">Disponible</Badge>
                  ) : (
                    <Badge variant="outline">No disponible</Badge>
                  )}
                </div>

                <div className="flex items-center justify-center text-lg mb-4">
                  <Star className="w-5 h-5 text-yellow-500 mr-1" />
                  <span className="font-bold">{perfil.valoracionMedia.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm ml-1">({perfil.totalReviews} reviews)</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="font-semibold">{perfil.numeroTrabajadores}</p>
                    <p className="text-gray-500">Trabajadores</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <Briefcase className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="font-semibold">{perfil.experienciaAnios}</p>
                    <p className="text-gray-500">Años exp.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Shield className="w-5 h-5 mr-2" />
                  Documentación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">REA</p>
                    <p className="text-sm text-gray-500">{perfil.numeroREA || 'No registrado'}</p>
                  </div>
                  <Badge className={
                    perfil.estadoREA === 'VERIFICADO' ? 'bg-green-100 text-green-800' :
                    perfil.estadoREA === 'PENDIENTE_VALIDACION' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {perfil.estadoREA.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Seguro RC</p>
                    <p className="text-sm text-gray-500">{perfil.numeroSeguroRC || 'No registrado'}</p>
                  </div>
                  <Badge className={
                    perfil.estadoSeguro === 'VERIFICADO' ? 'bg-green-100 text-green-800' :
                    perfil.estadoSeguro === 'PENDIENTE_VALIDACION' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {perfil.estadoSeguro.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Documentos
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="info" className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="especialidades">Especialidades</TabsTrigger>
                <TabsTrigger value="contacto">Contacto</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <Card>
                  <CardHeader>
                    <CardTitle>Información General</CardTitle>
                    <CardDescription>Datos básicos de tu empresa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Descripción de la empresa</Label>
                      {editando ? (
                        <Textarea
                          value={perfil.descripcion || ''}
                          onChange={(e) => setPerfil({ ...perfil, descripcion: e.target.value })}
                          placeholder="Describe tu empresa, servicios y experiencia..."
                          rows={4}
                        />
                      ) : (
                        <p className="text-gray-600 mt-1">
                          {perfil.descripcion || 'Sin descripción'}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Número de trabajadores</Label>
                        {editando ? (
                          <Input
                            type="number"
                            value={perfil.numeroTrabajadores}
                            onChange={(e) => setPerfil({ ...perfil, numeroTrabajadores: parseInt(e.target.value) || 0 })}
                          />
                        ) : (
                          <p className="text-gray-600 mt-1">{perfil.numeroTrabajadores}</p>
                        )}
                      </div>
                      <div>
                        <Label>Años de experiencia</Label>
                        {editando ? (
                          <Input
                            type="number"
                            value={perfil.experienciaAnios}
                            onChange={(e) => setPerfil({ ...perfil, experienciaAnios: parseInt(e.target.value) || 0 })}
                          />
                        ) : (
                          <p className="text-gray-600 mt-1">{perfil.experienciaAnios}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Radio de operación</Label>
                      {editando ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={perfil.radioOperacionKm}
                            onChange={(e) => setPerfil({ ...perfil, radioOperacionKm: parseInt(e.target.value) || 50 })}
                            className="w-24"
                          />
                          <span className="text-gray-500">km</span>
                        </div>
                      ) : (
                        <p className="text-gray-600 mt-1">{perfil.radioOperacionKm} km</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="especialidades">
                <Card>
                  <CardHeader>
                    <CardTitle>Especialidades y Zonas</CardTitle>
                    <CardDescription>Áreas de trabajo y cobertura geográfica</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="mb-2 block">Especialidades principales</Label>
                      <div className="flex flex-wrap gap-2">
                        {perfil.especialidades.map((esp, i) => (
                          <Badge key={i} className="bg-orange-100 text-orange-800">
                            {esp}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {perfil.subespecialidades.length > 0 && (
                      <div>
                        <Label className="mb-2 block">Subespecialidades</Label>
                        <div className="flex flex-wrap gap-2">
                          {perfil.subespecialidades.map((esp, i) => (
                            <Badge key={i} variant="outline">
                              {esp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="mb-2 block">Zonas de operación</Label>
                      <div className="flex flex-wrap gap-2">
                        {perfil.zonasOperacion.map((zona, i) => (
                          <Badge key={i} variant="outline" className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {zona}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contacto">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Contacto</CardTitle>
                    <CardDescription>Datos para que te contacten</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        Teléfono
                      </Label>
                      {editando ? (
                        <Input
                          type="tel"
                          value={perfil.telefono || ''}
                          onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                          placeholder="+34 600 000 000"
                        />
                      ) : (
                        <p className="text-gray-600 mt-1">{perfil.telefono || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Email de contacto
                      </Label>
                      {editando ? (
                        <Input
                          type="email"
                          value={perfil.emailContacto || ''}
                          onChange={(e) => setPerfil({ ...perfil, emailContacto: e.target.value })}
                          placeholder="contacto@empresa.com"
                        />
                      ) : (
                        <p className="text-gray-600 mt-1">{perfil.emailContacto || 'No especificado'}</p>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        Página web
                      </Label>
                      {editando ? (
                        <Input
                          type="url"
                          value={perfil.web || ''}
                          onChange={(e) => setPerfil({ ...perfil, web: e.target.value })}
                          placeholder="https://www.empresa.com"
                        />
                      ) : (
                        <p className="text-gray-600 mt-1">
                          {perfil.web ? (
                            <a href={perfil.web} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                              {perfil.web}
                            </a>
                          ) : 'No especificado'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
