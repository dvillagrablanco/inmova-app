'use client';

/**
 * Vivienda Social - Elegibilidad
 * 
 * Verificación de requisitos para vivienda protegida
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Euro,
  Home,
  FileText,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';

interface ResultadoElegibilidad {
  elegible: boolean;
  tiposVivienda: string[];
  puntuacion: number;
  requisitos: {
    nombre: string;
    cumple: boolean;
    detalle: string;
  }[];
}

const LIMITES_INGRESOS = {
  vpo_general: { max: 35000, iprem: 3.5 },
  vpo_jovenes: { max: 28000, iprem: 2.5 },
  alquiler_social: { max: 18000, iprem: 1.5 },
};

export default function ViviendaSocialEligibilityPage() {
  const [formData, setFormData] = useState({
    tipoVivienda: '',
    miembrosFamilia: '',
    ingresosBrutos: '',
    edad: '',
    empadronado: false,
    sinPropiedad: false,
    residenciaMinima: false,
    discapacidad: false,
    familiaMonoparental: false,
    victimavg: false,
  });
  const [resultado, setResultado] = useState<ResultadoElegibilidad | null>(null);
  const [calculando, setCalculando] = useState(false);

  const handleCalcular = () => {
    if (!formData.tipoVivienda || !formData.ingresosBrutos || !formData.miembrosFamilia) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    setCalculando(true);

    setTimeout(() => {
      const ingresos = parseFloat(formData.ingresosBrutos);
      const miembros = parseInt(formData.miembrosFamilia);
      const edad = parseInt(formData.edad) || 30;
      const limite = LIMITES_INGRESOS[formData.tipoVivienda as keyof typeof LIMITES_INGRESOS];

      // Cálculo de ingresos por miembro
      const ingresosPorMiembro = ingresos / Math.sqrt(miembros);
      const cumpleIngresos = ingresosPorMiembro <= limite.max;

      // Verificar requisitos
      const requisitos = [
        {
          nombre: 'Ingresos dentro del límite',
          cumple: cumpleIngresos,
          detalle: cumpleIngresos
            ? `€${ingresosPorMiembro.toFixed(0)} < €${limite.max} (límite)`
            : `€${ingresosPorMiembro.toFixed(0)} > €${limite.max} (límite)`,
        },
        {
          nombre: 'Empadronamiento en el municipio',
          cumple: formData.empadronado,
          detalle: formData.empadronado ? 'Empadronado correctamente' : 'Debe estar empadronado',
        },
        {
          nombre: 'Sin propiedad de vivienda',
          cumple: formData.sinPropiedad,
          detalle: formData.sinPropiedad
            ? 'No es propietario de otra vivienda'
            : 'No puede ser propietario de otra vivienda',
        },
        {
          nombre: 'Residencia mínima',
          cumple: formData.residenciaMinima,
          detalle: formData.residenciaMinima
            ? 'Cumple residencia mínima de 2 años'
            : 'Debe residir mínimo 2 años en el municipio',
        },
      ];

      // Requisitos específicos por tipo
      if (formData.tipoVivienda === 'vpo_jovenes') {
        requisitos.push({
          nombre: 'Edad máxima 35 años',
          cumple: edad <= 35,
          detalle: edad <= 35 ? `${edad} años (válido)` : `${edad} años (supera límite)`,
        });
      }

      // Calcular puntuación
      let puntuacion = 50; // Base
      if (cumpleIngresos) puntuacion += 20;
      if (formData.empadronado) puntuacion += 10;
      if (formData.familiaMonoparental) puntuacion += 15;
      if (formData.discapacidad) puntuacion += 15;
      if (formData.victimavg) puntuacion += 20;
      if (miembros >= 4) puntuacion += 10;

      // Determinar elegibilidad
      const requisitosCumplen = requisitos.filter((r) => r.cumple).length;
      const elegible = requisitosCumplen >= requisitos.length - 1 && cumpleIngresos;

      // Tipos de vivienda disponibles
      const tiposDisponibles: string[] = [];
      if (ingresosPorMiembro <= LIMITES_INGRESOS.alquiler_social.max) {
        tiposDisponibles.push('Alquiler Social');
      }
      if (ingresosPorMiembro <= LIMITES_INGRESOS.vpo_jovenes.max && edad <= 35) {
        tiposDisponibles.push('VPO Jóvenes');
      }
      if (ingresosPorMiembro <= LIMITES_INGRESOS.vpo_general.max) {
        tiposDisponibles.push('VPO General');
      }

      setResultado({
        elegible,
        tiposVivienda: tiposDisponibles,
        puntuacion: Math.min(100, puntuacion),
        requisitos,
      });

      setCalculando(false);

      if (elegible) {
        toast.success('¡El solicitante es elegible para vivienda protegida!');
      } else {
        toast.error('El solicitante no cumple todos los requisitos');
      }
    }, 1000);
  };

  const handleReset = () => {
    setFormData({
      tipoVivienda: '',
      miembrosFamilia: '',
      ingresosBrutos: '',
      edad: '',
      empadronado: false,
      sinPropiedad: false,
      residenciaMinima: false,
      discapacidad: false,
      familiaMonoparental: false,
      victimavg: false,
    });
    setResultado(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Verificación de Elegibilidad
          </h1>
          <p className="text-muted-foreground">
            Comprueba si un solicitante cumple los requisitos para vivienda protegida
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Datos del Solicitante
            </CardTitle>
            <CardDescription>
              Introduce los datos para calcular la elegibilidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Tipo de Vivienda Solicitada *</Label>
                <Select
                  value={formData.tipoVivienda}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipoVivienda: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vpo_general">VPO General</SelectItem>
                    <SelectItem value="vpo_jovenes">VPO Jóvenes (&lt;35 años)</SelectItem>
                    <SelectItem value="alquiler_social">Alquiler Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Miembros de la Familia *</Label>
                  <Input
                    type="number"
                    min="1"
                    className="mt-2"
                    value={formData.miembrosFamilia}
                    onChange={(e) =>
                      setFormData({ ...formData, miembrosFamilia: e.target.value })
                    }
                    placeholder="Ej: 3"
                  />
                </div>
                <div>
                  <Label>Edad del Titular *</Label>
                  <Input
                    type="number"
                    min="18"
                    className="mt-2"
                    value={formData.edad}
                    onChange={(e) =>
                      setFormData({ ...formData, edad: e.target.value })
                    }
                    placeholder="Ej: 32"
                  />
                </div>
              </div>

              <div>
                <Label>Ingresos Brutos Anuales Familia (€) *</Label>
                <Input
                  type="number"
                  className="mt-2"
                  value={formData.ingresosBrutos}
                  onChange={(e) =>
                    setFormData({ ...formData, ingresosBrutos: e.target.value })
                  }
                  placeholder="Ej: 28000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Suma de ingresos de todos los miembros de la unidad familiar
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Requisitos Documentales</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="empadronado"
                    checked={formData.empadronado}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, empadronado: checked as boolean })
                    }
                  />
                  <label htmlFor="empadronado" className="text-sm">
                    Empadronado en el municipio
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sinPropiedad"
                    checked={formData.sinPropiedad}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, sinPropiedad: checked as boolean })
                    }
                  />
                  <label htmlFor="sinPropiedad" className="text-sm">
                    No es propietario de otra vivienda
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="residenciaMinima"
                    checked={formData.residenciaMinima}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, residenciaMinima: checked as boolean })
                    }
                  />
                  <label htmlFor="residenciaMinima" className="text-sm">
                    Residencia mínima de 2 años en el municipio
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Circunstancias Especiales (Puntuación Extra)</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="familiaMonoparental"
                    checked={formData.familiaMonoparental}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, familiaMonoparental: checked as boolean })
                    }
                  />
                  <label htmlFor="familiaMonoparental" className="text-sm">
                    Familia monoparental (+15 puntos)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="discapacidad"
                    checked={formData.discapacidad}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, discapacidad: checked as boolean })
                    }
                  />
                  <label htmlFor="discapacidad" className="text-sm">
                    Miembro con discapacidad (+15 puntos)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="victimavg"
                    checked={formData.victimavg}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, victimavg: checked as boolean })
                    }
                  />
                  <label htmlFor="victimavg" className="text-sm">
                    Víctima de violencia de género (+20 puntos)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCalcular} disabled={calculando}>
                {calculando ? 'Calculando...' : 'Verificar Elegibilidad'}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        <div className="space-y-6">
          {resultado ? (
            <>
              <Card className={resultado.elegible ? 'border-green-500' : 'border-red-500'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {resultado.elegible ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Resultado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      {resultado.elegible ? (
                        <>
                          <p className="text-2xl font-bold text-green-600">ELEGIBLE</p>
                          <p className="text-muted-foreground">
                            El solicitante cumple los requisitos
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-red-600">NO ELEGIBLE</p>
                          <p className="text-muted-foreground">
                            No cumple todos los requisitos
                          </p>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Puntuación estimada</span>
                        <span className="font-medium">{resultado.puntuacion} puntos</span>
                      </div>
                      <Progress value={resultado.puntuacion} />
                    </div>

                    {resultado.tiposVivienda.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Tipos de vivienda disponibles:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {resultado.tiposVivienda.map((tipo) => (
                            <Badge key={tipo} className="bg-green-100 text-green-700">
                              {tipo}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Requisitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resultado.requisitos.map((req, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          req.cumple
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {req.cumple ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium text-sm">{req.nombre}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {req.detalle}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Introduce los datos del solicitante y haz clic en "Verificar Elegibilidad"</p>
              </CardContent>
            </Card>
          )}

          {/* Límites de Ingresos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Límites de Ingresos 2026
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(LIMITES_INGRESOS).map(([tipo, limite]) => (
                  <div
                    key={tipo}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <span className="text-sm font-medium">
                      {tipo === 'vpo_general'
                        ? 'VPO General'
                        : tipo === 'vpo_jovenes'
                        ? 'VPO Jóvenes'
                        : 'Alquiler Social'}
                    </span>
                    <span className="text-sm">
                      Máx. €{limite.max.toLocaleString()}/año ({limite.iprem} IPREM)
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                * IPREM 2026: €600/mes (€7.200/año). Los límites se calculan por
                miembro ponderado de la unidad familiar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
