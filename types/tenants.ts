export interface Tenant {
  id: string;
  companyId: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  dni?: string;
  fechaNacimiento?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    nombre: string;
  };
  units?: any[]; // Simplified for now
  contracts?: any[]; // Simplified for now
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface TenantsResponse {
  data: Tenant[];
  pagination: PaginationMeta;
}

export interface TenantsFilters {
  page?: number;
  limit?: number;
  companyId?: string;
}
