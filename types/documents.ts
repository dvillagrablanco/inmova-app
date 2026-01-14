export interface Document {
  id: string;
  nombre: string;
  tipo: string;
  cloudStoragePath: string;
  descripcion?: string;
  tags: string[];
  fechaVencimiento?: string;
  fechaSubida: string;
  tenant?: { nombreCompleto: string };
  unit?: { numero: string };
  building?: { nombre: string };
  contract?: { id: string };
  folder?: { nombre: string; color: string };
}

export interface DocumentsResponse {
  data: Document[];
  // API currently doesn't support pagination for documents, but we'll prepare for it
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DocumentsFilters {
  tenantId?: string;
  unitId?: string;
  buildingId?: string;
  contractId?: string;
  folderId?: string;
  tipo?: string;
}
