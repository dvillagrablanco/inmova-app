'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Building2, Layers, ChevronDown, ChevronRight, Filter, RotateCcw } from 'lucide-react';
import type { FiltrosDisponibles, CuadroMandosFilters } from '@/types/finanzas';

interface FilterPanelProps {
  filtros: FiltrosDisponibles;
  currentFilters: CuadroMandosFilters;
  onFiltersChange: (filters: CuadroMandosFilters) => void;
}

export function FilterPanel({ filtros, currentFilters, onFiltersChange }: FilterPanelProps) {
  const [inmueblesSectionOpen, setInmueblesSectionOpen] = useState(true);
  const [centrosSectionOpen, setCentrosSectionOpen] = useState(true);

  const selectedBuildingIds = new Set(currentFilters.buildingIds || []);
  const selectedCostCenterIds = new Set(currentFilters.costCenterIds || []);

  function toggleBuilding(id: string) {
    const next = new Set(selectedBuildingIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onFiltersChange({
      ...currentFilters,
      buildingIds: next.size > 0 ? Array.from(next) : undefined,
    });
  }

  function toggleCostCenter(id: string) {
    const next = new Set(selectedCostCenterIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onFiltersChange({
      ...currentFilters,
      costCenterIds: next.size > 0 ? Array.from(next) : undefined,
    });
  }

  function resetFilters() {
    onFiltersChange({
      ejercicio: currentFilters.ejercicio,
      buildingIds: undefined,
      costCenterIds: undefined,
    });
  }

  const hasActiveFilters =
    (currentFilters.buildingIds && currentFilters.buildingIds.length > 0) ||
    (currentFilters.costCenterIds && currentFilters.costCenterIds.length > 0);

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ejercicio */}
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Ejercicio</Label>
          <Select
            value={String(currentFilters.ejercicio)}
            onValueChange={(v) =>
              onFiltersChange({ ...currentFilters, ejercicio: parseInt(v) })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filtros.ejercicios.map((ej) => (
                <SelectItem key={ej} value={String(ej)}>
                  {ej}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Inmuebles */}
        <Collapsible open={inmueblesSectionOpen} onOpenChange={setInmueblesSectionOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 py-1">
            {inmueblesSectionOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <Building2 className="h-3 w-3" />
            Inmuebles
            {selectedBuildingIds.size > 0 && (
              <span className="ml-auto text-blue-600 font-normal normal-case">
                {selectedBuildingIds.size} selec.
              </span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filtros.edificios.map((edificio) => (
                <div key={edificio.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`building-${edificio.id}`}
                    checked={selectedBuildingIds.has(edificio.id)}
                    onCheckedChange={() => toggleBuilding(edificio.id)}
                    className="h-3.5 w-3.5"
                  />
                  <Label
                    htmlFor={`building-${edificio.id}`}
                    className="text-xs cursor-pointer truncate flex-1"
                    title={edificio.nombre}
                  >
                    {edificio.nombre}
                    <span className="text-gray-400 ml-1">({edificio.unidades.length})</span>
                  </Label>
                </div>
              ))}
              {filtros.edificios.length === 0 && (
                <p className="text-xs text-gray-400 italic">Sin edificios</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Filtro de Centros de Coste */}
        <Collapsible open={centrosSectionOpen} onOpenChange={setCentrosSectionOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 py-1">
            {centrosSectionOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <Layers className="h-3 w-3" />
            Centros de Coste
            {selectedCostCenterIds.size > 0 && (
              <span className="ml-auto text-blue-600 font-normal normal-case">
                {selectedCostCenterIds.size} selec.
              </span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <div className="space-y-1.5">
              {filtros.centrosCoste.map((cc) => (
                <div key={cc.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`cc-${cc.id}`}
                    checked={selectedCostCenterIds.has(cc.id)}
                    onCheckedChange={() => toggleCostCenter(cc.id)}
                    className="h-3.5 w-3.5"
                  />
                  <Label
                    htmlFor={`cc-${cc.id}`}
                    className="text-xs cursor-pointer truncate flex-1"
                    title={`${cc.codigo} - ${cc.nombre}`}
                  >
                    <span className="font-medium">{cc.codigo}</span>
                    <span className="text-gray-500 ml-1">- {cc.nombre}</span>
                  </Label>
                </div>
              ))}
              {filtros.centrosCoste.length === 0 && (
                <p className="text-xs text-gray-400 italic">Sin centros de coste configurados</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
