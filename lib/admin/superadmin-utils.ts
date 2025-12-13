/**
 * Super Admin Utilities
 * Helper functions for super admin operations
 */

import { toast } from 'sonner';

/**
 * Impersonate a company (login as company)
 */
export async function impersonateCompany(companyId: string, companyName: string) {
  try {
    const response = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar impersonation');
    }

    const data = await response.json();

    toast.success(`Accediendo como ${companyName}`, {
      description: 'Todas las acciones serán registradas',
    });

    // Redirect to company dashboard
    window.location.href = `/dashboard?impersonating=${companyId}`;
  } catch (error: any) {
    toast.error('Error', {
      description: error.message || 'No se pudo iniciar impersonation',
    });
  }
}

/**
 * End impersonation
 */
export async function endImpersonation() {
  try {
    const response = await fetch('/api/admin/impersonate', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Error al finalizar impersonation');
    }

    toast.success('Impersonation finalizada');
    window.location.href = '/admin/clientes';
  } catch (error: any) {
    toast.error('Error', {
      description: error.message || 'No se pudo finalizar impersonation',
    });
  }
}

/**
 * Execute bulk action on multiple companies
 */
export async function executeBulkAction(
  action: string,
  companyIds: string[],
  additionalData?: any
): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/companies/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        companyIds,
        ...additionalData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en operación en lote');
    }

    const data = await response.json();

    toast.success('Éxito', {
      description: `${data.affected} empresas actualizadas`,
    });

    return true;
  } catch (error: any) {
    toast.error('Error', {
      description: error.message || 'No se pudo ejecutar la operación',
    });
    return false;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string, label: string = 'Texto') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  } catch (error) {
    toast.error('Error al copiar al portapapeles');
  }
}

/**
 * Export companies data to CSV
 */
export function exportToCSV(companies: any[], filename: string = 'empresas') {
  try {
    const headers = [
      'ID',
      'Nombre',
      'Estado',
      'Contacto Principal',
      'Email',
      'Usuarios',
      'Edificios',
      'Inquilinos',
      'Plan',
      'Fecha Creación',
    ];

    const rows = companies.map((c) => [
      c.id,
      c.nombre,
      c.estadoCliente,
      c.contactoPrincipal || '',
      c.emailContacto || '',
      c._count.users,
      c._count.buildings,
      c._count.tenants,
      c.subscriptionPlan?.nombre || 'Sin plan',
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Archivo CSV descargado');
  } catch (error) {
    toast.error('Error al exportar datos');
  }
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'activo':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'prueba':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'suspendido':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'cancelado':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);
}
