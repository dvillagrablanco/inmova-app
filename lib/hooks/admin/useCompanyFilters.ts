import { useState, useEffect, useMemo } from 'react';
import { CompanyData } from './useCompanies';

export function useCompanyFilters(companies: CompanyData[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(company =>
        company.nombre.toLowerCase().includes(query) ||
        company.emailContacto?.toLowerCase().includes(query) ||
        company.contactoPrincipal?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'activo') {
        filtered = filtered.filter(c => c.activo);
      } else if (statusFilter === 'inactivo') {
        filtered = filtered.filter(c => !c.activo);
      } else {
        filtered = filtered.filter(c => c.estadoCliente === statusFilter);
      }
    }

    // Plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(c => c.subscriptionPlan?.id === planFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'nombre':
          aVal = a.nombre.toLowerCase();
          bVal = b.nombre.toLowerCase();
          break;
        case 'buildings':
          aVal = a._count.buildings;
          bVal = b._count.buildings;
          break;
        case 'users':
          aVal = a._count.users;
          bVal = b._count.users;
          break;
        case 'plan':
          aVal = a.subscriptionPlan?.precioMensual || 0;
          bVal = b.subscriptionPlan?.precioMensual || 0;
          break;
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [companies, searchQuery, statusFilter, planFilter, categoryFilter, sortBy, sortOrder]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    planFilter,
    setPlanFilter,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredCompanies,
  };
}
