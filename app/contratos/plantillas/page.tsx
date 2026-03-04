'use client';

import { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Copy, Trash2, Home, Save } from 'lucide-react';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface ContractTemplate {
  id: string;
  nombre: string;
  duracionMeses: number;
  tipoIncremento: string;
  fianzaMeses: number;
  clausulas: string;
  createdAt: string;
}

const DEFAULT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'vivienda-estandar',
    nombre: 'Vivienda Estándar (5+3)',
    duracionMeses: 60,
    tipoIncremento: 'ipc',
    fianzaMeses: 1,
    clausulas: 'Contrato de arrendamiento de vivienda sujeto a la LAU. Duración 5 años con prórroga de 3 años.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'local-comercial',
    nombre: 'Local Comercial',
    duracionMeses: 120,
    tipoIncremento: 'ipc_mas_diferencial',
    fianzaMeses: 2,
    clausulas: 'Arrendamiento de local comercial. Libre pacto de duración. Fianza de 2 meses.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'temporal-corta',
    nombre: 'Temporal Corta Duración',
    duracionMeses: 11,
    tipoIncremento: 'fijo',
    fianzaMeses: 1,
    clausulas: 'Contrato temporal de uso distinto a vivienda. Duración inferior a 1 año.',
    createdAt: new Date().toISOString(),
  },
];

export default function PlantillasContratosPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>(DEFAULT_TEMPLATES);
  const [editing, setEditing] = useState<ContractTemplate | null>(null);

  const handleUseTemplate = (template: ContractTemplate) => {
    const params = new URLSearchParams({
      duracion: template.duracionMeses.toString(),
      incremento: template.tipoIncremento,
      fianza: template.fianzaMeses.toString(),
    });
    window.location.href = `/contratos/nuevo?${params.toString()}`;
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Plantillas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Plantillas de Contratos
            </h1>
            <p className="text-muted-foreground">
              Modelos predefinidos para crear contratos rápidamente
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{template.nombre}</CardTitle>
                <CardDescription className="line-clamp-2">{template.clausulas}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duración</span>
                    <p className="font-medium">{template.duracionMeses} meses</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Incremento</span>
                    <p className="font-medium capitalize">{template.tipoIncremento.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fianza</span>
                    <p className="font-medium">{template.fianzaMeses} {template.fianzaMeses === 1 ? 'mes' : 'meses'}</p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => handleUseTemplate(template)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Usar Plantilla
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
