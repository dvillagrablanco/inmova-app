'use client';

/**
 * Selector de Empresa
 * Permite seleccionar la empresa activa para operar en la app
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, X, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelectedCompany, type SelectedCompany } from '@/lib/hooks/admin/useSelectedCompany';
import { Input } from '@/components/ui/input';
import logger from '@/lib/logger';

interface Company {
  id: string;
  nombre: string;
  logoUrl?: string | null;
  estadoCliente?: string | null;
  activo: boolean;
  hasChildren?: boolean;
}

interface CompanySelectorProps {
  className?: string;
  onCompanyChange?: (company: SelectedCompany | null) => void;
}

export function CompanySelector({ className, onCompanyChange }: CompanySelectorProps) {
  const router = useRouter();
  const { selectedCompany, selectCompany, clearSelection, isLoading: isLoadingSelection } = useSelectedCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  // Cargar lista de empresas cuando se abre el selector
  useEffect(() => {
    if ((isOpen || !selectedCompany) && companies.length === 0) {
      fetchCompanies();
    }
  }, [isOpen, selectedCompany, companies.length]);

  const fetchCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      setError(null);
      const res = await fetch('/api/user/companies');
      if (!res.ok) {
        throw new Error('Error al cargar empresas');
      }
      const data = await res.json();
      const list = Array.isArray(data.companies) ? data.companies : [];
      setCompanies(list);
      setCurrentCompanyId(data.currentCompanyId || null);

      if (!selectedCompany && data.currentCompanyId) {
        const current = list.find((company) => company.id === data.currentCompanyId);
        if (current) {
          const selected: SelectedCompany = {
            id: current.id,
            nombre: current.nombre,
            logoUrl: current.logoUrl,
            estadoCliente: current.estadoCliente,
          };
          selectCompany(selected);
          onCompanyChange?.(selected);
        }
      }
    } catch (err) {
      logger.error('Error al cargar empresas:', err);
      setError('Error al cargar empresas');
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleSelectCompany = async (company: Company) => {
    try {
      const response = await fetch('/api/user/switch-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id }),
      });

      if (!response.ok) {
        throw new Error('No se pudo cambiar de empresa');
      }
    } catch (err) {
      logger.error('Error al cambiar empresa:', err);
      setError('No se pudo cambiar la empresa');
      return;
    }

    const selected: SelectedCompany = {
      id: company.id,
      nombre: company.nombre,
      logoUrl: company.logoUrl,
      estadoCliente: company.estadoCliente,
    };
    selectCompany(selected);
    onCompanyChange?.(selected);
    setIsOpen(false);
    setSearchQuery('');

    router.refresh();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentCompanyId) {
      const current = companies.find((company) => company.id === currentCompanyId);
      if (current) {
        void handleSelectCompany(current);
        return;
      }
    }

    clearSelection();
    onCompanyChange?.(null);
  };

  // Filtrar empresas por búsqueda
  const filteredCompanies = companies.filter(company =>
    company.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Estado de carga inicial
  if (isLoadingSelection) {
    return (
      <div className={cn('px-4 py-3', className)}>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Botón del Selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
          'border border-gray-700 hover:border-gray-600',
          selectedCompany
            ? 'bg-indigo-900/30 border-indigo-600 hover:border-indigo-500'
            : 'bg-gray-800/50 hover:bg-gray-800'
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          selectedCompany ? 'bg-indigo-600' : 'bg-gray-700'
        )}>
          <Building2 size={16} className="text-white" />
        </div>
        
        <div className="flex-1 text-left min-w-0">
          {selectedCompany ? (
            <>
              <p className="text-sm font-medium text-white truncate">
                {selectedCompany.nombre}
              </p>
              <p className="text-xs text-indigo-400">
                Empresa seleccionada
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400">
                Seleccionar empresa
              </p>
              <p className="text-xs text-gray-500">
                Para gestión específica
              </p>
            </>
          )}
        </div>

        {selectedCompany ? (
          <button
            onClick={handleClearSelection}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Quitar selección"
          >
            <X size={16} className="text-gray-400 hover:text-white" />
          </button>
        ) : (
          <ChevronDown 
            size={16} 
            className={cn(
              'text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )} 
          />
        )}
      </button>

      {/* Dropdown de Empresas */}
      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel de selección */}
          <div className="absolute left-0 right-0 mt-2 z-[101] bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            {/* Buscador */}
            <div className="p-2 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <Input
                  type="text"
                  placeholder="Buscar empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 bg-gray-800 border-gray-700 text-white text-sm placeholder:text-gray-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de empresas */}
            <div className="max-h-64 overflow-y-auto">
              {isLoadingCompanies ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="py-4 px-3 text-center">
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={fetchCompanies}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Reintentar
                  </button>
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="py-4 px-3 text-center text-sm text-gray-400">
                  {searchQuery ? 'No se encontraron empresas' : 'No hay empresas disponibles'}
                </div>
              ) : (
                filteredCompanies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelectCompany(company)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors text-left',
                      selectedCompany?.id === company.id && 'bg-indigo-900/30'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-xs font-semibold',
                      company.activo ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'
                    )}>
                      {company.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{company.nombre}</p>
                      <p className={cn(
                        'text-xs',
                        company.activo ? 'text-green-400' : 'text-gray-500'
                      )}>
                        {company.estadoCliente || (company.activo ? 'Activo' : 'Inactivo')}
                      </p>
                    </div>
                    {selectedCompany?.id === company.id && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer con info */}
            {!isLoadingCompanies && !error && filteredCompanies.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-700 bg-gray-800/50">
                <p className="text-xs text-gray-500 text-center">
                  {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? 's' : ''} disponible{filteredCompanies.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
