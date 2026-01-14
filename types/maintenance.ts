export interface MaintenanceRequest {
  id: string;
  unitId: string;
  titulo: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
  fechaSolicitud: string;
  fechaProgramada?: string | null;
  fechaCompletada?: string | null;
  costoEstimado?: number | null;
  costoReal?: number | null;
  providerId?: string | null;
  unit?: {
    id: string;
    numero: string;
    building?: {
      nombre: string;
    };
    tenant?: {
      nombreCompleto: string;
    };
  };
}

export interface MaintenanceFilters {
  page?: number;
  limit?: number;
  estado?: string;
  prioridad?: string;
}

export interface MaintenanceResponse {
  data: MaintenanceRequest[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
