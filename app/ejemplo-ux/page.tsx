'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState, LoadingSpinner } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorMessage } from '@/components/ui/error-message';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AccessibleFormField } from '@/components/ui/accessible-form-field';
import { AccessibleSelectField } from '@/components/ui/accessible-select-field';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { toast } from 'sonner';
import { Building2, Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

interface Item {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'activo' | 'inactivo';
  createdAt: string;
}

/**
 * Página de ejemplo que demuestra TODOS los requisitos UX/UI:
 *
 * ✓ Responsive: Mobile (320px+), Tablet (768px+), Desktop (1024px+)
 * ✓ Loading States: Skeletons y spinners
 * ✓ Empty States: Mensajes claros + CTAs
 * ✓ Error Messages: User-friendly, sin stack traces
 * ✓ Confirmation Dialogs: Para acciones destructivas
 * ✓ Accessibility: Navegación teclado, labels, ARIA
 * ✓ Contrast: WCAG 2.1 AA (4.5:1)
 * ✓ Focus Indicators: Visibles en todos los elementos
 */
export default function EjemploUXPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'activo' as 'activo' | 'inactivo',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Simulate data loading
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ejemplo-ux/items');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar datos');
      }
      const data = (await response.json()) as { data: Item[] };
      setItems(data.data || []);
    } catch (err) {
      setError('No se pudieron cargar los datos. Por favor, inténtalo de nuevo más tarde.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', estado: 'activo' });
    setFormErrors({});
    setEditingItem(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.descripcion.trim()) {
      errors.descripcion = 'La descripción es obligatoria';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    setSubmitting(true);

    try {
      const isEditing = Boolean(editingItem);
      const response = await fetch('/api/ejemplo-ux/items', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { id: editingItem?.id, updates: formData } : formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar elemento');
      }

      const data = (await response.json()) as { data: Item };

      if (isEditing) {
        setItems(items.map((item) => (item.id === data.data.id ? data.data : item)));
        toast.success('Elemento actualizado correctamente', {
          description: `"${data.data.nombre}" se ha actualizado`,
        });
      } else {
        setItems([data.data, ...items]);
        toast.success('Elemento creado correctamente', {
          description: `"${data.data.nombre}" se ha añadido a la lista`,
        });
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Por favor, inténtalo de nuevo';
      toast.error('Error al guardar el elemento', {
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/ejemplo-ux/items?id=${itemToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar');
      }

      setItems(items.filter((item) => item.id !== itemToDelete.id));
      setShowDeleteDialog(false);
      setItemToDelete(null);

      toast.success('Elemento eliminado', {
        description: `"${itemToDelete.nombre}" se ha eliminado correctamente`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el elemento';
      toast.error(message);
    }
  };

  const openDeleteDialog = (item: Item) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const openEditForm = (item: Item) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion,
      estado: item.estado,
    });
    setFormErrors({});
    setShowForm(true);
  };

  if (status === 'loading') {
    return <LoadingState message="Cargando aplicación..." fullScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />

        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <ResponsiveContainer maxWidth="2xl" padding="lg">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Building2 className="h-8 w-8 text-primary" aria-hidden="true" />
                    Ejemplo UX/UI Completo
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Demostración de todos los principios de accesibilidad y experiencia de usuario
                  </p>
                </div>

                <Button
                  onClick={() => {
                    if (showForm) {
                      setShowForm(false);
                      resetForm();
                    } else {
                      openCreateForm();
                    }
                  }}
                  className="gradient-primary shadow-primary"
                  aria-label="Crear nuevo elemento"
                >
                  {showForm ? (
                    <>
                      <X className="h-4 w-4 mr-2" aria-hidden="true" />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                      Nuevo Elemento
                    </>
                  )}
                </Button>
              </div>

              {/* Info badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" aria-hidden="true" />
                  Responsive Design
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" aria-hidden="true" />
                  WCAG 2.1 AA
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" aria-hidden="true" />
                  Navegación Teclado
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" aria-hidden="true" />
                  Loading States
                </Badge>
              </div>
            </div>

            {/* Form Section */}
            {showForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{editingItem ? 'Editar Elemento' : 'Crear Nuevo Elemento'}</CardTitle>
                  <CardDescription>
                    Complete el formulario con datos válidos. Todos los campos son obligatorios.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <AccessibleFormField
                      label="Nombre"
                      value={formData.nombre}
                      onChange={(e) => {
                        setFormData({ ...formData, nombre: e.target.value });
                        if (formErrors.nombre) {
                          setFormErrors({ ...formErrors, nombre: '' });
                        }
                      }}
                      error={formErrors.nombre}
                      hint="Mínimo 3 caracteres"
                      required
                      placeholder="Ej: Mi elemento"
                    />

                    <AccessibleFormField
                      label="Descripción"
                      value={formData.descripcion}
                      onChange={(e) => {
                        setFormData({ ...formData, descripcion: e.target.value });
                        if (formErrors.descripcion) {
                          setFormErrors({ ...formErrors, descripcion: '' });
                        }
                      }}
                      error={formErrors.descripcion}
                      required
                      placeholder="Descripción detallada"
                    />

                    <AccessibleSelectField
                      label="Estado"
                      value={formData.estado}
                      onValueChange={(value) =>
                        setFormData({ ...formData, estado: value as 'activo' | 'inactivo' })
                      }
                      options={[
                        { value: 'activo', label: 'Activo' },
                        { value: 'inactivo', label: 'Inactivo' },
                      ]}
                      required
                    />

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={submitting} className="gradient-primary">
                        {submitting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                            {editingItem ? 'Actualizar' : 'Guardar'}
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowForm(false);
                          resetForm();
                        }}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <ErrorMessage
                title="Error al cargar los datos"
                message={error}
                severity="error"
                onRetry={loadData}
                className="mb-6"
              />
            )}

            {/* Loading State */}
            {loading && <LoadingState message="Cargando elementos..." size="lg" />}

            {/* Empty State */}
            {!loading && !error && items.length === 0 && (
              <EmptyState
                icon={<Building2 className="h-12 w-12" />}
                title="No hay elementos"
                description="Comienza creando tu primer elemento haciendo clic en el botón de arriba"
                actions={[
                  {
                    label: 'Crear Primer Elemento',
                    onClick: () => setShowForm(true),
                    icon: <Plus className="h-4 w-4" aria-hidden="true" />,
                  },
                ]}
              />
            )}

            {/* Items Grid - Responsive */}
            {!loading && !error && items.length > 0 && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                role="list"
                aria-label="Lista de elementos"
              >
                {items.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow" role="listitem">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.nombre}</CardTitle>
                          <CardDescription className="mt-1">{item.descripcion}</CardDescription>
                        </div>
                        <Badge
                          variant={item.estado === 'activo' ? 'default' : 'secondary'}
                          aria-label={`Estado: ${item.estado}`}
                        >
                          {item.estado}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(item)}
                          aria-label={`Editar ${item.nombre}`}
                        >
                          <Edit className="h-4 w-4 mr-1" aria-hidden="true" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(item)}
                          aria-label={`Eliminar ${item.nombre}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ResponsiveContainer>
        </main>
      </div>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="¿Eliminar elemento?"
        description={
          itemToDelete ? (
            <>
              <p className="mb-2">
                Estás a punto de eliminar <strong>{itemToDelete.nombre}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
            </>
          ) : null
        }
        variant="destructive"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
