/**
 * Hook para gestionar la empresa seleccionada
 * Permite seleccionar la empresa activa en la app
 */
import { useState, useEffect, useCallback } from 'react';
import { safeLocalStorage } from '@/lib/safe-storage';
import logger from '@/lib/logger';

const STORAGE_KEY = 'selected_company';

export interface SelectedCompany {
  id: string;
  nombre: string;
  logoUrl?: string | null;
  estadoCliente?: string | null;
}

export function useSelectedCompany() {
  const [selectedCompany, setSelectedCompanyState] = useState<SelectedCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar empresa seleccionada desde localStorage al montar
  useEffect(() => {
    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSelectedCompanyState(parsed);
        logger.info('Empresa seleccionada cargada desde localStorage', { companyId: parsed.id });
      }
    } catch (error) {
      logger.error('Error al cargar empresa seleccionada:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Seleccionar una empresa
  const selectCompany = useCallback((company: SelectedCompany | null) => {
    setSelectedCompanyState(company);
    try {
      if (company) {
        safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(company));
        logger.info('Empresa seleccionada guardada', { companyId: company.id, nombre: company.nombre });
      } else {
        safeLocalStorage.removeItem(STORAGE_KEY);
        logger.info('Empresa seleccionada eliminada');
      }
    } catch (error) {
      logger.error('Error al guardar empresa seleccionada:', error);
    }
  }, []);

  // Limpiar selección
  const clearSelection = useCallback(() => {
    selectCompany(null);
  }, [selectCompany]);

  return {
    selectedCompany,
    selectCompany,
    clearSelection,
    isLoading,
    hasSelection: !!selectedCompany,
  };
}
