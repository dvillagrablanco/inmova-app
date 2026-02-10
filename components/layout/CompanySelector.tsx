'use client';

/**
 * Selector de Empresa
 * Permite seleccionar la empresa activa para operar en la app.
 * Muestra las sociedades accesibles del usuario con jerarquía holding/filiales.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Search, Loader2, Check, Crown } from 'lucide-react';
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
  isCurrent?: boolean;
  isPrimary?: boolean;
  parentCompanyId?: string | null;
  parentCompany?: { id: string; nombre: string } | null;
}

interface CompanySelectorProps {
  className?: string;
  onCompanyChange?: (company: SelectedCompany | null) => void;
}

// Colores por posición para diferenciar las empresas
const COMPANY_COLORS = [
  { bg: 'bg-indigo-600', text: 'text-indigo-400', ring: 'ring-indigo-500/50', bgLight: 'bg-indigo-900/30' },
  { bg: 'bg-emerald-600', text: 'text-emerald-400', ring: 'ring-emerald-500/50', bgLight: 'bg-emerald-900/30' },
  { bg: 'bg-rose-600', text: 'text-rose-400', ring: 'ring-rose-500/50', bgLight: 'bg-rose-900/30' },
  { bg: 'bg-amber-600', text: 'text-amber-400', ring: 'ring-amber-500/50', bgLight: 'bg-amber-900/30' },
  { bg: 'bg-cyan-600', text: 'text-cyan-400', ring: 'ring-cyan-500/50', bgLight: 'bg-cyan-900/30' },
];

export function CompanySelector({ className, onCompanyChange }: CompanySelectorProps) {
  const router = useRouter();
  const { selectedCompany, selectCompany, clearSelection, isLoading: isLoadingSelection } = useSelectedCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  // Cargar lista de empresas al montar y cuando se abre el selector
  useEffect(() => {
    if (companies.length === 0) {
      fetchCompanies();
    }
  }, []);

  useEffect(() => {
    if (isOpen && companies.length === 0) {
      fetchCompanies();
    }
  }, [isOpen]);

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

      // Auto-seleccionar la empresa actual si no hay selección
      if (!selectedCompany && data.currentCompanyId) {
        const current = list.find((company: Company) => company.id === data.currentCompanyId);
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

  // Filtrar empresas por búsqueda
  const filteredCompanies = companies.filter(company =>
    company.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ordenar: holdings primero, luego filiales
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    // Holdings (sin parent) primero
    if (!a.parentCompanyId && b.parentCompanyId) return -1;
    if (a.parentCompanyId && !b.parentCompanyId) return 1;
    return a.nombre.localeCompare(b.nombre);
  });

  const showSearch = companies.length > 5;
  const isSelected = (companyId: string) => selectedCompany?.id === companyId;

  // Estado de carga inicial
  if (isLoadingSelection) {
    return (
      <div className={cn('px-2 py-3', className)}>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Botón principal del selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
          'border-2',
          selectedCompany
            ? 'bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border-violet-500/60 hover:border-violet-400/80 shadow-lg shadow-violet-900/20'
            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
        )}
      >
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold',
          selectedCompany
            ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
            : 'bg-gray-700 text-gray-400'
        )}>
          {selectedCompany
            ? selectedCompany.nombre.charAt(0).toUpperCase()
            : <Building2 size={16} />
          }
        </div>
        
        <div className="flex-1 text-left min-w-0">
          {selectedCompany ? (
            <>
              <p className="text-sm font-semibold text-white truncate">
                {selectedCompany.nombre}
              </p>
              <p className="text-[10px] text-violet-400 font-medium">
                Empresa activa
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400">
                Seleccionar empresa
              </p>
              <p className="text-[10px] text-gray-500">
                Elige una sociedad
              </p>
            </>
          )}
        </div>

        <ChevronDown 
          size={16} 
          className={cn(
            'text-gray-400 transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute left-0 right-0 mt-2 z-[101] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Título */}
            <div className="px-3 py-2.5 border-b border-gray-800 bg-gray-800/50">
              <p className="text-xs font-semibold text-gray-300">Seleccionar Sociedad</p>
              <p className="text-[10px] text-gray-500">Cambia entre las empresas del grupo</p>
            </div>

            {/* Buscador (solo si hay muchas empresas) */}
            {showSearch && (
              <div className="p-2 border-b border-gray-800">
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
            )}

            {/* Lista de empresas */}
            <div className="max-h-72 overflow-y-auto p-1.5">
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
              ) : sortedCompanies.length === 0 ? (
                <div className="py-4 px-3 text-center text-sm text-gray-400">
                  {searchQuery ? 'No se encontraron empresas' : 'No hay empresas disponibles'}
                </div>
              ) : (
                sortedCompanies.map((company, idx) => {
                  const colorSet = COMPANY_COLORS[idx % COMPANY_COLORS.length];
                  const active = isSelected(company.id);
                  const isHolding = !company.parentCompanyId && company.hasChildren;

                  return (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 text-left mb-1',
                        active
                          ? `${colorSet.bgLight} ring-2 ${colorSet.ring}`
                          : 'hover:bg-gray-800/80'
                      )}
                    >
                      {/* Avatar con inicial */}
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white transition-transform',
                        active ? `${colorSet.bg} scale-110` : 'bg-gray-700',
                      )}>
                        {company.nombre.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={cn(
                            'text-sm truncate',
                            active ? 'text-white font-semibold' : 'text-gray-300'
                          )}>
                            {company.nombre}
                          </p>
                          {isHolding && (
                            <Crown size={12} className="text-amber-400 flex-shrink-0" title="Holding" />
                          )}
                        </div>
                        <p className={cn(
                          'text-[10px]',
                          active ? colorSet.text : 'text-gray-500'
                        )}>
                          {isHolding
                            ? 'Holding'
                            : company.parentCompany
                              ? `Filial de ${company.parentCompany.nombre}`
                              : company.estadoCliente || (company.activo ? 'Activa' : 'Inactiva')
                          }
                        </p>
                      </div>

                      {/* Indicador de seleccionada */}
                      {active && (
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', colorSet.bg)}>
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {!isLoadingCompanies && !error && sortedCompanies.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-800 bg-gray-800/30">
                <p className="text-[10px] text-gray-500 text-center">
                  {sortedCompanies.length} sociedad{sortedCompanies.length !== 1 ? 'es' : ''} disponible{sortedCompanies.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
