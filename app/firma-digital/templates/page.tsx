'use client';

export const dynamic = 'force-dynamic';

/**
 * Página de gestión de Templates de Contratos
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Eliminado import recursivo de LoadingState si existiera
import { Loader2 } from 'lucide-react'; // Usar icono directo para loading simple

// Componente simple de loading para evitar recursión
function SimpleLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Cargando templates...</p>
    </div>
  );
}
import { es } from 'date-fns/locale';

interface ContractTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  activo: boolean;
  createdAt: string;
  _count: {
    documents: number;
  };
}

export default function TemplatesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      cargarTemplates();
    }
  }, [status, router]);

  const cargarTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contract-templates');
      
      if (!response.ok) {
        throw new Error('Error al cargar templates');
      }

      const data = await response.json();
      setTemplates(data);
    } catch (error: any) {
      logError(error, { message: 'Error al cargar templates' });
    } finally {
      setLoading(false);
    }
  };

  const templatesFiltrados = templates.filter((template) =>
    template.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || status === 'loading') {
    return (
      <AuthenticatedLayout>
        <SimpleLoading />
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/firma-digital">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-8 w-8" />
                  Templates de Contratos
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Plantillas reutilizables para generación de contratos
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Template
              </Button>
            </div>

            {/* Búsqueda */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de templates */}
          {templatesFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay templates
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm
                      ? 'No se encontraron templates con la búsqueda aplicada.'
                      : 'Comienza creando tu primer template de contrato.'}
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templatesFiltrados.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {template.nombre}
                        </CardTitle>
                        <CardDescription>
                          {template.descripcion || 'Sin descripción'}
                        </CardDescription>
                      </div>
                      {template.activo ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Tipo</span>
                        <span className="font-medium">{template.tipo}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Documentos</span>
                        <span className="font-medium">{template._count.documents}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Creado</span>
                        <span className="font-medium">
                          {format(new Date(template.createdAt), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </AuthenticatedLayout>
  );
}
