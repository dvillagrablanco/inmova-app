'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Link2 } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import logger from '@/lib/logger';

interface Document {
  id: string;
  nombre: string;
  tipo: string;
  fechaSubida: string;
  cloudStoragePath: string;
}

interface Building { id: string; nombre: string; }
interface Unit { id: string; numero: string; }
interface Tenant { id: string; nombreCompleto: string; }
interface Contract { id: string; }

export default function DocumentosSinVincularPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  const [linkForm, setLinkForm] = useState({
    buildingId: '',
    unitId: '',
    tenantId: '',
    contractId: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents?unlinked=true');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      logger.error('Error fetching documents:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [buildingsRes, tenantsRes, contractsRes] = await Promise.all([
        fetch('/api/buildings'),
        fetch('/api/tenants'),
        fetch('/api/contracts'),
      ]);

      if (buildingsRes.ok) {
        const data = await buildingsRes.json();
        setBuildings(Array.isArray(data) ? data : data.data || []);
      }
      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setTenants(Array.isArray(data) ? data : data.data || []);
      }
      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      logger.error('Error fetching reference data:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchDocuments();
      fetchReferenceData();
    }
  }, [session]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedBuildingId) {
        setUnits([]);
        return;
      }
      try {
        const res = await fetch(`/api/units?buildingId=${selectedBuildingId}`);
        if (res.ok) {
          const data = await res.json();
          setUnits(Array.isArray(data) ? data : data.data || []);
        } else {
          setUnits([]);
        }
      } catch {
        setUnits([]);
      }
    };

    fetchUnits();
  }, [selectedBuildingId]);

  const openLinkDialog = (doc: Document) => {
    setSelectedDoc(doc);
    setLinkForm({
      buildingId: '',
      unitId: '',
      tenantId: '',
      contractId: '',
    });
    setSelectedBuildingId('');
    setLinkDialogOpen(true);
  };

  const handleLink = async () => {
    if (!selectedDoc) return;
    const payload = {
      buildingId: linkForm.buildingId || null,
      unitId: linkForm.unitId || null,
      tenantId: linkForm.tenantId || null,
      contractId: linkForm.contractId || null,
    };

    if (!payload.buildingId && !payload.unitId && !payload.tenantId && !payload.contractId) {
      toast.error('Selecciona al menos una vinculación');
      return;
    }

    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Documento vinculado');
        setLinkDialogOpen(false);
        fetchDocuments();
      } else {
        toast.error('Error al vincular documento');
      }
    } catch {
      toast.error('Error al vincular documento');
    }
  };


  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando documentos..." />
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/documentos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Documentos
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos sin vincular</h1>
          <p className="text-muted-foreground">
            Asigna documentos a inquilinos, unidades, edificios o contratos.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay documentos sin vincular.</div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{doc.nombre}</div>
                    <div className="text-xs text-muted-foreground">{new Date(doc.fechaSubida).toLocaleString()}</div>
                    <Badge variant="secondary">{doc.tipo}</Badge>
                  </div>
                  <Button size="sm" onClick={() => openLinkDialog(doc)}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Vincular
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Edificio</Label>
                <Select
                  value={linkForm.buildingId}
                  onValueChange={(value) => {
                    setSelectedBuildingId(value);
                    setLinkForm({ ...linkForm, buildingId: value, unitId: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona edificio" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select
                  value={linkForm.unitId}
                  onValueChange={(value) => setLinkForm({ ...linkForm, unitId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Inquilino</Label>
                <Select
                  value={linkForm.tenantId}
                  onValueChange={(value) => setLinkForm({ ...linkForm, tenantId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona inquilino" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombreCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contrato</Label>
                <Select
                  value={linkForm.contractId}
                  onValueChange={(value) => setLinkForm({ ...linkForm, contractId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleLink}>Guardar vinculación</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
