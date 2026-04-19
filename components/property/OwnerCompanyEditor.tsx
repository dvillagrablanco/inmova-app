'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Edit3, Save, X, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CompanyOption {
  id: string;
  nombre: string;
}

interface Props {
  unitId: string;
  initialOwnerCompanyId: string | null;
  initialOwnerCompanyName: string | null;
  buildingCompanyId: string | null;
  buildingCompanyName: string | null;
}

/**
 * Tarjeta para mostrar y editar la SOCIEDAD PROPIETARIA real de la unidad.
 *
 * Es relevante en grupos de empresas donde dentro de un mismo edificio
 * físico hay activos pertenecientes a distintas sociedades del grupo
 * (ej: en C/ Reina 15 hay viviendas de Viroda y locales de Rovida; ambas
 * son sociedades del grupo Vidaro).
 *
 * Si Unit.ownerCompanyId === Building.companyId no aporta información extra
 * (solo se muestra la pertenencia básica al edificio).
 *
 * Si difiere → se destaca visualmente que el activo pertenece a otra
 * sociedad del grupo aunque esté en este edificio.
 */
export function OwnerCompanyEditor({
  unitId,
  initialOwnerCompanyId,
  initialOwnerCompanyName,
  buildingCompanyId,
  buildingCompanyName,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(initialOwnerCompanyId);
  const [ownerName, setOwnerName] = useState<string | null>(initialOwnerCompanyName);

  useEffect(() => {
    if (!editing || companies.length > 0) return;
    fetch('/api/companies/scope', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCompanies(data);
      })
      .catch(() => {});
  }, [editing, companies.length]);

  const effectiveOwnerId = ownerId || buildingCompanyId;
  const effectiveOwnerName = ownerName || buildingCompanyName || 'Sin asignar';
  const isShared = ownerId && buildingCompanyId && ownerId !== buildingCompanyId;

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/units/${unitId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerCompanyId: ownerId }),
      });
      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        throw new Error(errBody.error || 'Error guardando');
      }
      const updated = await r.json();
      setOwnerId(updated.ownerCompanyId);
      setOwnerName(updated.ownerCompany?.nombre || null);
      setEditing(false);
      toast.success('Sociedad propietaria actualizada');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Sociedad propietaria
        </CardTitle>
        {!editing && (
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditing(true)}>
            <Edit3 className="h-3 w-3 mr-1" />
            Editar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <Select
              value={ownerId || 'inherit'}
              onValueChange={(v) => {
                if (v === 'inherit') {
                  setOwnerId(null);
                  setOwnerName(null);
                } else {
                  setOwnerId(v);
                  setOwnerName(companies.find((c) => c.id === v)?.nombre || null);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona sociedad propietaria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">
                  Heredar del edificio ({buildingCompanyName || '-'})
                </SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-3 w-3 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={isShared ? 'outline' : 'secondary'}>{effectiveOwnerName}</Badge>
              {isShared && (
                <span className="text-xs text-muted-foreground">
                  (edificio gestionado por <strong>{buildingCompanyName}</strong>)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Building2 className="h-3 w-3 mt-0.5 shrink-0" />
              {isShared
                ? 'Esta unidad pertenece a una sociedad distinta de la que gestiona el edificio físico (caso típico en grupos de empresas).'
                : 'Esta unidad pertenece a la misma sociedad que gestiona el edificio.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
