import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { DocumentsResponse, DocumentsFilters } from '@/types/documents';

async function fetchDocuments(filters: DocumentsFilters): Promise<DocumentsResponse> {
  const params = new URLSearchParams();
  if (filters.tenantId) params.append('tenantId', filters.tenantId);
  if (filters.unitId) params.append('unitId', filters.unitId);
  if (filters.buildingId) params.append('buildingId', filters.buildingId);
  if (filters.contractId) params.append('contractId', filters.contractId);
  if (filters.folderId) params.append('folderId', filters.folderId);
  if (filters.tipo) params.append('tipo', filters.tipo);

  const response = await fetch(`/api/documents?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Error fetching documents');
  }

  const data = await response.json();
  
  if (Array.isArray(data)) {
      return {
          data: data,
          pagination: {
              total: data.length,
              page: 1,
              limit: data.length,
              totalPages: 1
          }
      };
  }
  return data;
}

export function useDocuments(filters: DocumentsFilters = {}) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => fetchDocuments(filters),
    placeholderData: keepPreviousData,
  });
}
