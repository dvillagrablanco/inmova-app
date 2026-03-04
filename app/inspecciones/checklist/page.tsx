'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Camera, FileText } from 'lucide-react';
import { toast } from 'sonner';

const INSPECTION_TYPES = [
  { value: 'entrada', label: 'Entrada inquilino' },
  { value: 'salida', label: 'Salida inquilino' },
  { value: 'periodica', label: 'Periódica' },
] as const;

const CHECKLIST_CATEGORIES: Record<string, string[]> = {
  Estructura: ['Paredes', 'Suelos', 'Techos', 'Puertas', 'Ventanas'],
  Instalaciones: ['Electricidad', 'Fontanería', 'Calefacción', 'Aire acondicionado'],
  Cocina: ['Electrodomésticos', 'Encimera', 'Grifería', 'Campana'],
  Baño: ['Sanitarios', 'Grifería', 'Azulejos', 'Ducha/Bañera'],
  General: ['Pintura', 'Limpieza', 'Llaves', 'Contadores'],
};

interface ChecklistItemState {
  ok: boolean;
  notes: string;
}

interface Unit {
  id: string;
  numero: string;
  tipo?: string;
  building?: { nombre?: string };
}

export default function InspeccionChecklistPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [inspectionType, setInspectionType] = useState<string>('entrada');
  const [checklistState, setChecklistState] = useState<Record<string, Record<string, ChecklistItemState>>>(() => {
    const state: Record<string, Record<string, ChecklistItemState>> = {};
    for (const [cat, items] of Object.entries(CHECKLIST_CATEGORIES)) {
      state[cat] = {};
      for (const item of items) {
        state[cat][item] = { ok: false, notes: '' };
      }
    }
    return state;
  });

  useEffect(() => {
    async function fetchUnits() {
      try {
        const res = await fetch('/api/units');
        if (!res.ok) throw new Error('Error al cargar unidades');
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setUnits(list);
        if (list.length > 0 && !selectedUnitId) {
          setSelectedUnitId(list[0].id);
        }
      } catch {
        setUnits([]);
      } finally {
        setLoadingUnits(false);
      }
    }
    fetchUnits();
  }, []);

  const updateItem = (category: string, item: string, field: keyof ChecklistItemState, value: boolean | string) => {
    setChecklistState((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: { ...prev[category][item], [field]: value },
      },
    }));
  };

  const handleGenerarActa = () => {
    const okCount = Object.values(checklistState).flatMap((cat) =>
      Object.values(cat).filter((i) => i.ok)
    ).length;
    const totalCount = Object.values(CHECKLIST_CATEGORIES).flat().length;
    toast.success('Acta generada', {
      description: `Resumen: ${okCount}/${totalCount} ítems OK. Unidad: ${units.find((u) => u.id === selectedUnitId)?.numero ?? '-'} | Tipo: ${INSPECTION_TYPES.find((t) => t.value === inspectionType)?.label ?? inspectionType}`,
    });
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inspecciones">Inspecciones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Checklist</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checklist de Inspección</h1>
          <p className="text-muted-foreground">
            Inspección digital por categorías. Marca OK/No OK, añade notas y fotos.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Unidad</Label>
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId} disabled={loadingUnits}>
              <SelectTrigger>
                <SelectValue placeholder={loadingUnits ? 'Cargando...' : 'Seleccionar unidad'} />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.building?.nombre ? `${u.building.nombre} - ` : ''}{u.numero}
                    {u.tipo ? ` (${u.tipo})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de inspección</Label>
            <Select value={inspectionType} onValueChange={setInspectionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSPECTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(CHECKLIST_CATEGORIES).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        id={`${category}-${item}-ok`}
                        checked={checklistState[category]?.[item]?.ok ?? false}
                        onCheckedChange={(c) =>
                          updateItem(category, item, 'ok', c === true)
                        }
                      />
                      <Label
                        htmlFor={`${category}-${item}-ok`}
                        className="font-medium cursor-pointer"
                      >
                        {item}
                      </Label>
                    </div>
                    <Input
                      placeholder="Notas..."
                      value={checklistState[category]?.[item]?.notes ?? ''}
                      onChange={(e) =>
                        updateItem(category, item, 'notes', e.target.value)
                      }
                      className="sm:max-w-[200px]"
                    />
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Camera className="h-4 w-4" />
                      <span className="sr-only">Subir foto</span>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleGenerarActa} size="lg">
            <FileText className="h-4 w-4 mr-2" />
            Generar Acta
          </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
