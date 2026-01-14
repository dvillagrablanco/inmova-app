export interface Payment {
  id: string;
  contractId: string;
  periodo: string; // Used as concept
  monto: number;
  fechaVencimiento: string;
  fechaPago?: string | null;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'parcial';
  metodoPago?: string | null;
  comprobanteUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  contract?: {
    id: string;
    unit?: {
      id: string;
      numero: string;
      building?: {
        nombre: string;
      };
    };
    tenant?: {
      nombreCompleto: string;
    };
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaymentsResponse {
  data: Payment[];
  pagination: PaginationMeta;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  estado?: string;
  contractId?: string;
}
