'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Mail,
  Workflow,
  BarChart3,
  Search,
  Star,
  Copy,
  Eye,
  Download,
} from 'lucide-react';
import {
  templates,
  getTemplatesByCategory,
  getPopularTemplates,
  searchTemplates,
  type Template,
} from '@/lib/templates';
import { toast } from 'sonner';

export default function PlantillasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  const filteredTemplates = searchQuery ? searchTemplates(searchQuery) : templates;

  const popularTemplates = getPopularTemplates();
  const contractTemplates = getTemplatesByCategory('contract');
  const emailTemplates = getTemplatesByCategory('email');
  const workflowTemplates = getTemplatesByCategory('workflow');
  const reportTemplates = getTemplatesByCategory('report');

  const handleCopyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    toast.success('Plantilla copiada al portapapeles');
  };

  const handleUseTemplate = (template: Template) => {
    toast.success('Abriendo editor de plantilla...');
    // Aquí abrirías el editor correspondiente
  };

  const getCategoryIcon = (category: Template['category']) => {
    switch (category) {
      case 'contract':
        return <FileText className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'workflow':
        return <Workflow className="h-5 w-5" />;
      case 'report':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const TemplateCard = ({ template }: { template: Template }) => (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setSelectedTemplate(template)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">{getCategoryIcon(template.category)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{template.name}</CardTitle>
                {template.popular && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </div>
              <CardDescription className="mt-1">{template.description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleUseTemplate(template);
            }}
            className="flex-1"
          >
            <Eye className="mr-2 h-3 w-3" />
            Usar Plantilla
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyTemplate(template);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold mb-2">Biblioteca de Plantillas</h1>
              <p className="text-muted-foreground">
                Plantillas profesionales listas para usar. Ahorra tiempo y asegura cumplimiento
                normativo.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar plantillas por nombre, tipo o etiqueta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{templates.length}</p>
                    <p className="text-sm text-muted-foreground">Plantillas Totales</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{contractTemplates.length}</p>
                    <p className="text-sm text-muted-foreground">Contratos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{emailTemplates.length}</p>
                    <p className="text-sm text-muted-foreground">Emails</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{workflowTemplates.length}</p>
                    <p className="text-sm text-muted-foreground">Workflows</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Templates Tabs */}
            <Tabs defaultValue="popular" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="popular">
                  <Star className="mr-2 h-4 w-4" />
                  Populares
                </TabsTrigger>
                <TabsTrigger value="contracts">
                  <FileText className="mr-2 h-4 w-4" />
                  Contratos
                </TabsTrigger>
                <TabsTrigger value="emails">
                  <Mail className="mr-2 h-4 w-4" />
                  Emails
                </TabsTrigger>
                <TabsTrigger value="workflows">
                  <Workflow className="mr-2 h-4 w-4" />
                  Workflows
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reportes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="popular" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {popularTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="contracts" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contractTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="emails" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emailTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="workflows" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workflowTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Help Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">💡 ¿Cómo usar las plantillas?</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Haz clic en "Usar Plantilla" para abrir el editor</li>
                  <li>• Las variables se rellenan automáticamente con datos de tu sistema</li>
                  <li>• Puedes personalizar cualquier parte de la plantilla</li>
                  <li>• Las plantillas se actualizan con cambios normativos</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
