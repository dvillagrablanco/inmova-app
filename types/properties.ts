export interface Property {
  id: string;
  address: string;
  city: string;
  postalCode?: string | null;
  type: 'HOUSE' | 'APARTMENT' | 'STUDIO' | 'ROOM' | 'OFFICE' | 'LOCAL' | 'PARKING' | 'STORAGE';
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'INACTIVE';
  price: number;
  rooms?: number | null;
  bathrooms?: number | null;
  squareMeters?: number | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PropertiesResponse {
  success: boolean;
  data: Property[];
  pagination: PaginationMeta;
}

export interface PropertiesFilters {
  page?: number;
  limit?: number;
  status?: Property['status'];
  type?: Property['type'];
  city?: string;
  search?: string;
}
