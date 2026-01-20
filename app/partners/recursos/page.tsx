'use client';

/**
 * Partners - Recursos
 * 
 * Biblioteca de recursos, materiales y herramientas para partners
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FolderOpen,
  Download,
  Search,
  Image,
  FileText,
  Video,
  File,
  Palette,
  Megaphone,
  BookOpen,
  Presentation,
  Eye,
  Calendar,
  FileImage,
  FileVideo,
} from 'lucide-react';
import { toast } from 'sonner';

interface Resource {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'imagen' | 'documento' | 'video' | 'presentacion';
  categoria: 'branding' | 'marketing' | 'documentacion' | 'formacion';
  formato: string;
  tamaño: string;
  fechaActualizacion: string;
  url?: string;
}

const RESOURCES: Resource[] = [
  // Branding
  {
    id: '1',
    nombre: 'Logo Inmova (Principal)',
    descripcion: 'Logotipo oficial en varios formatos',
    tipo: 'imagen',
    categoria: 'branding',
    formato: 'PNG, SVG, PDF',
    tamaño: '2.5 MB',
    fechaActualizacion: '2025-12-01',
  },
  {
    id: '2',
    nombre: 'Logo Inmova (Blanco)',
    descripcion: 'Versión del logo para fondos oscuros',
    tipo: 'imagen',
    categoria: 'branding',
    formato: 'PNG, SVG',
    tamaño: '1.8 MB',
    fechaActualizacion: '2025-12-01',
  },
  {
    id: '3',
    nombre: 'Guía de Marca',
    descripcion: 'Manual de identidad corporativa completo',
    tipo: 'documento',
    categoria: 'branding',
    formato: 'PDF',
    tamaño: '15 MB',
    fechaActualizacion: '2025-11-15',
  },
  {
    id: '4',
    nombre: 'Paleta de Colores',
    descripcion: 'Colores oficiales y códigos HEX/RGB',
    tipo: 'documento',
    categoria: 'branding',
    formato: 'PDF',
    tamaño: '500 KB',
    fechaActualizacion: '2025-11-15',
  },
  // Marketing
  {
    id: '5',
    nombre: 'Banners Redes Sociales',
    descripcion: 'Pack de banners para Facebook, LinkedIn, Twitter',
    tipo: 'imagen',
    categoria: 'marketing',
    formato: 'PNG, PSD',
    tamaño: '25 MB',
    fechaActualizacion: '2026-01-10',
  },
  {
    id: '6',
    nombre: 'Email Templates',
    descripcion: 'Plantillas de email para campañas',
    tipo: 'documento',
    categoria: 'marketing',
    formato: 'HTML, Figma',
    tamaño: '5 MB',
    fechaActualizacion: '2026-01-05',
  },
  {
    id: '7',
    nombre: 'Flyers Promocionales',
    descripcion: 'Diseños para imprimir o digital',
    tipo: 'imagen',
    categoria: 'marketing',
    formato: 'PDF, AI',
    tamaño: '12 MB',
    fechaActualizacion: '2025-12-20',
  },
  // Documentación
  {
    id: '8',
    nombre: 'Presentación Comercial',
    descripcion: 'Deck de ventas para presentar a clientes',
    tipo: 'presentacion',
    categoria: 'documentacion',
    formato: 'PPTX, PDF',
    tamaño: '18 MB',
    fechaActualizacion: '2026-01-08',
  },
  {
    id: '9',
    nombre: 'Ficha de Producto',
    descripcion: 'One-pager con características principales',
    tipo: 'documento',
    categoria: 'documentacion',
    formato: 'PDF',
    tamaño: '2 MB',
    fechaActualizacion: '2025-12-15',
  },
  {
    id: '10',
    nombre: 'Casos de Éxito',
    descripcion: 'Testimonios y resultados de clientes',
    tipo: 'documento',
    categoria: 'documentacion',
    formato: 'PDF',
    tamaño: '8 MB',
    fechaActualizacion: '2025-12-10',
  },
  // Formación
  {
    id: '11',
    nombre: 'Video: Demo Plataforma',
    descripcion: 'Demostración completa de funcionalidades',
    tipo: 'video',
    categoria: 'formacion',
    formato: 'MP4',
    tamaño: '150 MB',
    fechaActualizacion: '2025-11-20',
  },
  {
    id: '12',
    nombre: 'Video: Técnicas de Venta',
    descripcion: 'Formación en argumentación comercial',
    tipo: 'video',
    categoria: 'formacion',
    formato: 'MP4',
    tamaño: '200 MB',
    fechaActualizacion: '2025-10-15',
  },
];

const CATEGORIES = [
  { id: 'all', nombre: 'Todos', icon: FolderOpen },
  { id: 'branding', nombre: 'Branding', icon: Palette },
  { id: 'marketing', nombre: 'Marketing', icon: Megaphone },
  { id: 'documentacion', nombre: 'Documentación', icon: FileText },
  { id: 'formacion', nombre: 'Formación', icon: BookOpen },
];

export default function PartnersRecursosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getTypeIcon = (tipo: Resource['tipo']) => {
    const icons = {
      imagen: FileImage,
      documento: FileText,
      video: FileVideo,
      presentacion: Presentation,
    };
    return icons[tipo] || File;
  };

  const handleDownload = (resource: Resource) => {
    toast.success(`Descargando ${resource.nombre}...`);
  };

  const handlePreview = (resource: Resource) => {
    toast.info('Abriendo vista previa...');
  };

  const filteredResources = RESOURCES.filter((resource) => {
    const matchesSearch =
      resource.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || resource.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: RESOURCES.length,
    imagenes: RESOURCES.filter(r => r.tipo === 'imagen').length,
    documentos: RESOURCES.filter(r => r.tipo === 'documento').length,
    videos: RESOURCES.filter(r => r.tipo === 'video').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recursos</h1>
          <p className="text-muted-foreground">
            Materiales y herramientas de marketing
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Descargar Todo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Recursos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Imágenes</p>
                <p className="text-2xl font-bold">{stats.imagenes}</p>
              </div>
              <Image className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Documentos</p>
                <p className="text-2xl font-bold">{stats.documentos}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Videos</p>
                <p className="text-2xl font-bold">{stats.videos}</p>
              </div>
              <Video className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <cat.icon className="h-4 w-4 mr-1" />
                  {cat.nombre}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Resultados</h3>
            <p className="text-sm text-muted-foreground">
              No se encontraron recursos con los filtros aplicados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const TypeIcon = getTypeIcon(resource.tipo);
            
            return (
              <Card key={resource.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {resource.categoria}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{resource.nombre}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {resource.descripcion}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {resource.formato}
                      </span>
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {resource.tamaño}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Actualizado: {resource.fechaActualizacion}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePreview(resource)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownload(resource)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Acceso Rápido</CardTitle>
          <CardDescription>
            Recursos más descargados y actualizados recientemente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">📁 Pack Completo de Branding</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Todos los logos, colores y guías de marca en un archivo
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Descargar Pack (20 MB)
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">📦 Kit de Marketing</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Banners, flyers y plantillas para campañas
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Descargar Kit (40 MB)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
