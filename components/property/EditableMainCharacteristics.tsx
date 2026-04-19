'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Maximize2,
  Bed,
  Bath,
  Building2,
  MapPin,
  Edit3,
  Save,
  X,
  Loader2,
  Snowflake,
  Flame,
  TreePine,
  Sparkles,
  Sofa,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export interface UnitEditableData {
  superficie: number;
  superficieUtil?: number | null;
  habitaciones?: number | null;
  banos?: number | null;
  planta?: number | null;
  orientacion?: string | null;
  aireAcondicionado?: boolean;
  calefaccion?: boolean;
  terraza?: boolean;
  balcon?: boolean;
  amueblado?: boolean;
  rentaMensual?: number;
  gastosComunidad?: number | null;
  ibiAnual?: number | null;
}

interface EditableMainCharacteristicsProps {
  unitId: string;
  initialData: UnitEditableData;
}

const ORIENTACIONES = ['Norte', 'Sur', 'Este', 'Oeste', 'Noreste', 'Noroeste', 'Sureste', 'Suroeste'];

/**
 * Tarjeta combinada Características Principales + Equipamiento + Económicos
 * con modo edición inline. Llama a PUT /api/units/{id}.
 */
export function EditableMainCharacteristics({
  unitId,
  initialData,
}: EditableMainCharacteristicsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<UnitEditableData>(initialData);
  const [draft, setDraft] = useState<UnitEditableData>(initialData);

  const startEdit = () => {
    setDraft(data);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(data);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Construir payload con solo campos cambiados (PUT acepta partial)
      const payload: Record<string, any> = {};
      const keys: (keyof UnitEditableData)[] = [
        'superficie',
        'superficieUtil',
        'habitaciones',
        'banos',
        'planta',
        'orientacion',
        'aireAcondicionado',
        'calefaccion',
        'terraza',
        'balcon',
        'amueblado',
        'rentaMensual',
        'gastosComunidad',
        'ibiAnual',
      ];
      for (const k of keys) {
        if (draft[k] !== data[k]) {
          payload[k as string] = draft[k];
        }
      }

      // Validaciones mínimas client-side
      if (payload.superficie !== undefined && (payload.superficie === null || payload.superficie <= 0)) {
        toast.error('La superficie debe ser un número positivo');
        setSaving(false);
        return;
      }

      if (Object.keys(payload).length === 0) {
        toast.info('Sin cambios');
        setEditing(false);
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/units/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = Array.isArray(err.details)
          ? err.details.map((d: any) => `${d.path?.join('.')}: ${d.message}`).join('; ')
          : '';
        throw new Error(err.error + (detail ? ' — ' + detail : '') || 'Error al guardar');
      }

      const updated = await res.json();

      // Actualizar estado local con la respuesta del backend (para que coincida)
      setData({
        superficie: updated.superficie,
        superficieUtil: updated.superficieUtil,
        habitaciones: updated.habitaciones,
        banos: updated.banos,
        planta: updated.planta,
        orientacion: updated.orientacion,
        aireAcondicionado: updated.aireAcondicionado,
        calefaccion: updated.calefaccion,
        terraza: updated.terraza,
        balcon: updated.balcon,
        amueblado: updated.amueblado,
        rentaMensual: updated.rentaMensual,
        gastosComunidad: updated.gastosComunidad,
        ibiAnual: updated.ibiAnual,
      });
      setEditing(false);
      toast.success('Características actualizadas');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = <K extends keyof UnitEditableData>(field: K, value: UnitEditableData[K]) => {
    setDraft((d) => ({ ...d, [field]: value }));
  };

  // === Vista lectura: con tu mismo grid del original ===
  if (!editing) {
    return (
      <>
        <div className="flex items-center justify-end mb-3">
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Edit3 className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2">
          <ReadCell icon={<Maximize2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />} bg="bg-primary/10" label="Superficie" value={`${data.superficie}m²`} />
          {data.superficieUtil != null && data.superficieUtil > 0 && (
            <ReadCell icon={<Maximize2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />} bg="bg-blue-500/10" label="Sup. Útil" value={`${data.superficieUtil}m²`} />
          )}
          {data.habitaciones != null && data.habitaciones > 0 && (
            <ReadCell icon={<Bed className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />} bg="bg-green-500/10" label="Habitaciones" value={String(data.habitaciones)} />
          )}
          {data.banos != null && data.banos > 0 && (
            <ReadCell icon={<Bath className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />} bg="bg-purple-500/10" label="Baños" value={String(data.banos)} />
          )}
          {data.planta !== null && data.planta !== undefined && (
            <ReadCell icon={<Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />} bg="bg-orange-500/10" label="Planta" value={data.planta === 99 ? 'Ático' : data.planta === -1 ? 'Sótano' : data.planta === 0 ? 'Bajo' : String(data.planta)} />
          )}
          {data.orientacion && (
            <ReadCell icon={<MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />} bg="bg-yellow-500/10" label="Orientación" value={data.orientacion} />
          )}
        </div>

        {/* Equipamiento */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Equipamiento</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <EquipBadge icon={<Snowflake className="h-3.5 w-3.5" />} label="Aire Acond." value={data.aireAcondicionado} />
            <EquipBadge icon={<Flame className="h-3.5 w-3.5" />} label="Calefacción" value={data.calefaccion} />
            <EquipBadge icon={<TreePine className="h-3.5 w-3.5" />} label="Terraza" value={data.terraza} />
            <EquipBadge icon={<Sparkles className="h-3.5 w-3.5" />} label="Balcón" value={data.balcon} />
            <EquipBadge icon={<Sofa className="h-3.5 w-3.5" />} label="Amueblado" value={data.amueblado} />
          </div>
        </div>
      </>
    );
  }

  // === Vista edición ===
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>
          <X className="h-3.5 w-3.5 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1" />
              Guardar
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="ed-sup">Superficie (m²) *</Label>
          <Input
            id="ed-sup"
            type="number"
            step="any"
            value={draft.superficie ?? ''}
            onChange={(e) => updateDraft('superficie', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ed-supU">Superficie útil (m²)</Label>
          <Input
            id="ed-supU"
            type="number"
            step="any"
            value={draft.superficieUtil ?? ''}
            onChange={(e) =>
              updateDraft('superficieUtil', e.target.value === '' ? null : parseFloat(e.target.value))
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ed-hab">Habitaciones</Label>
          <Input
            id="ed-hab"
            type="number"
            min="0"
            value={draft.habitaciones ?? ''}
            onChange={(e) =>
              updateDraft('habitaciones', e.target.value === '' ? null : parseInt(e.target.value, 10))
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ed-banos">Baños</Label>
          <Input
            id="ed-banos"
            type="number"
            min="0"
            value={draft.banos ?? ''}
            onChange={(e) =>
              updateDraft('banos', e.target.value === '' ? null : parseInt(e.target.value, 10))
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ed-planta">Planta</Label>
          <Input
            id="ed-planta"
            type="number"
            value={draft.planta ?? ''}
            onChange={(e) =>
              updateDraft('planta', e.target.value === '' ? null : parseInt(e.target.value, 10))
            }
            placeholder="0=bajo, -1=sótano, 99=ático"
          />
        </div>
        <div className="space-y-1">
          <Label>Orientación</Label>
          <Select
            value={draft.orientacion || 'none'}
            onValueChange={(v) => updateDraft('orientacion', v === 'none' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Sin definir —</SelectItem>
              {ORIENTACIONES.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Económicos */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Económicos (opcional)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="ed-renta">Renta mensual (€)</Label>
            <Input
              id="ed-renta"
              type="number"
              step="any"
              value={draft.rentaMensual ?? ''}
              onChange={(e) =>
                updateDraft('rentaMensual', e.target.value === '' ? 0 : parseFloat(e.target.value))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ed-com">Comunidad (€/mes)</Label>
            <Input
              id="ed-com"
              type="number"
              step="any"
              value={draft.gastosComunidad ?? ''}
              onChange={(e) =>
                updateDraft(
                  'gastosComunidad',
                  e.target.value === '' ? null : parseFloat(e.target.value)
                )
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ed-ibi">IBI anual (€)</Label>
            <Input
              id="ed-ibi"
              type="number"
              step="any"
              value={draft.ibiAnual ?? ''}
              onChange={(e) =>
                updateDraft('ibiAnual', e.target.value === '' ? null : parseFloat(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      {/* Equipamiento booleanos */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Equipamiento
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <CheckBoxRow
            label="Aire Acondicionado"
            value={draft.aireAcondicionado || false}
            onChange={(v) => updateDraft('aireAcondicionado', v)}
          />
          <CheckBoxRow
            label="Calefacción"
            value={draft.calefaccion || false}
            onChange={(v) => updateDraft('calefaccion', v)}
          />
          <CheckBoxRow
            label="Terraza"
            value={draft.terraza || false}
            onChange={(v) => updateDraft('terraza', v)}
          />
          <CheckBoxRow
            label="Balcón"
            value={draft.balcon || false}
            onChange={(v) => updateDraft('balcon', v)}
          />
          <CheckBoxRow
            label="Amueblado"
            value={draft.amueblado || false}
            onChange={(v) => updateDraft('amueblado', v)}
          />
        </div>
      </div>
    </div>
  );
}

function ReadCell({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div
        className={cn(
          'h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0',
          bg
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
        <p className="text-lg sm:text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function EquipBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean | undefined;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-xs',
        value
          ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300 font-medium'
          : 'bg-muted text-muted-foreground line-through'
      )}
    >
      {icon}
      {label}
    </div>
  );
}

function CheckBoxRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30 cursor-pointer hover:bg-muted/60">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
