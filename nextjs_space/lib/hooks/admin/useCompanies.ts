import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

export interface CompanyData {
  id: string;
  nombre: string;
  activo: boolean;
  estadoCliente: string;
  dominioPersonalizado: string | null;
  contactoPrincipal: string | null;
  emailContacto: string | null;
  parentCompanyId?: string | null;
  category?: string | null;
  subscriptionPlan: {
    id: string;
    nombre: string;
    tier: string;
    precioMensual: number;
  } | null;
  parentCompany?: {
    id: string;
    nombre: string;
  } | null;
  childCompanies?: {
    id: string;
    nombre: string;
    estadoCliente: string;
  }[];
  createdAt: string;
  _count: {
    users: number;
    buildings: number;
    tenants: number;
    childCompanies?: number;
  };
}

export interface SubscriptionPlan {
  id: string;
  nombre: string;
  tier: string;
  precioMensual: number;
}

export function useCompanies() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/companies');
      if (!res.ok) throw new Error('Error al cargar clientes');
      const data = await res.json();
      setCompanies(data.companies || []);
      logger.info('Clientes cargados exitosamente', { count: data.companies?.length || 0 });
    } catch (error) {
      logError(error as Error, { context: 'useCompanies.fetchCompanies' });
      toast.error('Error al cargar clientes');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch plans
  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/subscription-plans');
      if (!res.ok) throw new Error('Error al cargar planes');
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      logError(error as Error, { context: 'useCompanies.fetchPlans' });
      toast.error('Error al cargar planes de suscripción');
    }
  };

  // Create company
  const createCompany = async (companyData: any) => {
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear empresa');
      }
      
      const data = await res.json();
      toast.success(`Empresa "${data.company.nombre}" creada exitosamente`);
      await fetchCompanies();
      return data.company;
    } catch (error) {
      logError(error as Error, { context: 'useCompanies.createCompany' });
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Delete company
  const deleteCompany = async (companyId: string) => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar empresa');
      }
      
      toast.success('Empresa eliminada exitosamente');
      await fetchCompanies();
      return true;
    } catch (error) {
      logError(error as Error, { context: 'useCompanies.deleteCompany' });
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Update company category
  const updateCategory = async (companyId: string, newCategory: string) => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/category`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });
      
      if (!res.ok) throw new Error('Error al actualizar categoría');
      
      toast.success('Categoría actualizada');
      await fetchCompanies();
      return true;
    } catch (error) {
      logError(error as Error, { context: 'useCompanies.updateCategory' });
      toast.error('Error al actualizar categoría');
      throw error;
    }
  };

  // Bulk operations
  const bulkToggleStatus = async (companyIds: string[], activate: boolean) => {
    try {
      const res = await fetch('/api/admin/companies/bulk-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyIds, activate }),
      });
      
      if (!res.ok) throw new Error('Error en operación masiva');
      
      const data = await res.json();
      toast.success(data.message);
      await fetchCompanies();
      return data;
    } catch (error) {
      logError(error as Error, { context: 'useCompanies.bulkToggleStatus' });
      toast.error('Error en operación masiva');
      throw error;
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchPlans();
  }, []);

  return {
    companies,
    plans,
    loading,
    fetchCompanies,
    fetchPlans,
    createCompany,
    deleteCompany,
    updateCategory,
    bulkToggleStatus,
  };
}
