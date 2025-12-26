'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import { SubscriptionPlan } from '@/lib/hooks/admin/useCompanies';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  planFilter: string;
  onPlanFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  plans: SubscriptionPlan[];
  onRefresh: () => void;
  onExport?: () => void;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  planFilter,
  onPlanFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  plans,
  onRefresh,
  onExport,
}: FilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, email o contacto..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="activo">Activo</SelectItem>
          <SelectItem value="inactivo">Inactivo</SelectItem>
          <SelectItem value="trial">Trial</SelectItem>
          <SelectItem value="pagado">Pagado</SelectItem>
          <SelectItem value="cancelado">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      {/* Plan Filter */}
      <Select value={planFilter} onValueChange={onPlanFilterChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los planes</SelectItem>
          {plans.map((plan) => (
            <SelectItem key={plan.id} value={plan.id}>
              {plan.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category Filter */}
      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-full md:w-[160px]">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
          <SelectItem value="pyme">PYME</SelectItem>
          <SelectItem value="startup">Startup</SelectItem>
          <SelectItem value="individual">Individual</SelectItem>
        </SelectContent>
      </Select>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={onRefresh} title="Actualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
        {onExport && (
          <Button variant="outline" size="icon" onClick={onExport} title="Exportar">
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
