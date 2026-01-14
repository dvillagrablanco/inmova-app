export interface Contract {
  id: string;
  unitId: string;
  tenantId: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  deposito: number;
  estado: string;
  tipo?: string;
  diaPago: number;
  clausulasAdicionales?: string;
  renovacionAutomatica: boolean;
  unit?: any; // Simplified
  tenant?: any; // Simplified
  createdAt: string;
  updatedAt: string;
  diasHastaVencimiento: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ContractsResponse {
  data: Contract[];
  pagination: PaginationMeta;
}

export interface ContractsFilters {
  page?: number;
  limit?: number;
  companyId?: string;
}
