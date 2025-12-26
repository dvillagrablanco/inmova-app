'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Users,
  TrendingUp,
  Eye,
  Trash2,
  MoreVertical,
  LogIn,
  CreditCard,
  Pencil,
} from 'lucide-react';
import { CompanyData } from '@/lib/hooks/admin/useCompanies';

interface CompanyCardProps {
  company: CompanyData;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onView: (company: CompanyData) => void;
  onEdit: (company: CompanyData) => void;
  onDelete: (company: CompanyData) => void;
  onChangePlan: (company: CompanyData) => void;
  onLoginAs: (companyId: string) => void;
}

export function CompanyCard({
  company,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onChangePlan,
  onLoginAs,
}: CompanyCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(company.id, checked as boolean)}
            />
            <div className="flex-1">
              <CardTitle className="text-lg mb-1 flex items-center gap-2">
                {company.nombre}
                {company.parentCompanyId && (
                  <Badge variant="outline" className="text-xs">
                    Filial
                  </Badge>
                )}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant={company.activo ? 'default' : 'secondary'}>
                  {company.activo ? 'Activo' : 'Inactivo'}
                </Badge>
                {company.estadoCliente && <Badge variant="outline">{company.estadoCliente}</Badge>}
                {company.category && <Badge variant="secondary">{company.category}</Badge>}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(company)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(company)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onLoginAs(company.id)}>
                <LogIn className="h-4 w-4 mr-2" />
                Acceder como Cliente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangePlan(company)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Cambiar Plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(company)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {/* Plan Info */}
        {company.subscriptionPlan && (
          <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
            <div className="text-sm font-semibold text-indigo-900">
              {company.subscriptionPlan.nombre}
            </div>
            <div className="text-xs text-indigo-600">
              €{company.subscriptionPlan.precioMensual}/mes
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center mb-1">
              <Building2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">{company._count.buildings}</div>
            <div className="text-xs text-gray-600">Inmuebles</div>
          </div>
          <div>
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{company._count.users}</div>
            <div className="text-xs text-gray-600">Usuarios</div>
          </div>
          <div>
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{company._count.tenants}</div>
            <div className="text-xs text-gray-600">Inquilinos</div>
          </div>
        </div>

        {/* Contact Info */}
        {(company.contactoPrincipal || company.emailContacto) && (
          <div className="mt-4 pt-4 border-t text-xs text-gray-600 space-y-1">
            {company.contactoPrincipal && <div>Contacto: {company.contactoPrincipal}</div>}
            {company.emailContacto && <div>Email: {company.emailContacto}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
