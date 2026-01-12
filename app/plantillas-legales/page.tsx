'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Sparkles,
  Copy,
  Download,
  Wand2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  User,
  Building2,
  Home,
  FileSignature,
  Euro,
  Calendar,
  Check,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LegalTemplate {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  contenido: string;
  variables: string[];
  jurisdiccion: string | null;
  aplicableA: string[];
  activo: boolean;
  ultimaRevision: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  nombre: string;
  categoria: string;
  descripcion: string;
  contenido: string;
  variables: string;
  jurisdiccion: string;
  aplicableA: string;
  activo: boolean;
}

interface AIGeneratedTemplate {
  titulo: string;
  contenido: string;
  variables: string[];
  descripcionVariables?: Record<string, string>;
  notas?: string;
  clausulasOpcionales?: string[];
}

// Datos estructurados para el asistente guiado
interface DatosArrendador {
  nombre: string;
  nif: string;
  direccion: string;
  telefono: string;
  email: string;
}

interface DatosArrendatario {
  nombre: string;
  nif: string;
  direccion: string;
  telefono: string;
  email: string;
  profesion: string;
}

interface DatosInmueble {
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  referenciaCatastral: string;
  superficie: string;
  numHabitaciones: string;
  numBanos: string;
  tipoInmueble: string;
  amueblado: boolean;
}

interface DatosContrato {
  rentaMensual: string;
  fianza: string;
  duracion: string;
  fechaInicio: string;
  formaPago: string;
  incluyeGastos: string[];
  mascotasPermitidas: boolean;
  clausulasAdicionales: string;
}

interface AIWizardData {
  arrendador: DatosArrendador;
  arrendatario: DatosArrendatario;
  inmueble: DatosInmueble;
  contrato: DatosContrato;
}

const initialWizardData: AIWizardData = {
  arrendador: {
    nombre: '',
    nif: '',
    direccion: '',
    telefono: '',
    email: '',
  },
  arrendatario: {
    nombre: '',
    nif: '',
    direccion: '',
    telefono: '',
    email: '',
    profesion: '',
  },
  inmueble: {
    direccion: '',
    localidad: '',
    provincia: '',
    codigoPostal: '',
    referenciaCatastral: '',
    superficie: '',
    numHabitaciones: '',
    numBanos: '',
    tipoInmueble: 'vivienda',
    amueblado: false,
  },
  contrato: {
    rentaMensual: '',
    fianza: '',
    duracion: '12',
    fechaInicio: '',
    formaPago: 'transferencia',
    incluyeGastos: [],
    mascotasPermitidas: false,
    clausulasAdicionales: '',
  },
};

// Pasos del wizard seg?n el tipo de documento
const WIZARD_STEPS: Record<string, { id: string; label: string; icon: any }[]> = {
  contrato_vivienda: [
    { id: 'tipo', label: 'Tipo de documento', icon: FileText },
    { id: 'arrendador', label: 'Datos del arrendador', icon: User },
    { id: 'arrendatario', label: 'Datos del arrendatario', icon: User },
    { id: 'inmueble', label: 'Datos del inmueble', icon: Home },
    { id: 'contrato', label: 'Condiciones', icon: FileSignature },
    { id: 'revisar', label: 'Revisar y generar', icon: Check },
  ],
  contrato_local: [
    { id: 'tipo', label: 'Tipo de documento', icon: FileText },
    { id: 'arrendador', label: 'Datos del arrendador', icon: User },
    { id: 'arrendatario', label: 'Datos del arrendatario', icon: Building2 },
    { id: 'inmueble', label: 'Datos del local', icon: Building2 },
    { id: 'contrato', label: 'Condiciones', icon: FileSignature },
    { id: 'revisar', label: 'Revisar y generar', icon: Check },
  ],
  contrato_habitacion: [
    { id: 'tipo', label: 'Tipo de documento', icon: FileText },
    { id: 'arrendador', label: 'Datos del arrendador', icon: User },
    { id: 'arrendatario', label: 'Datos del inquilino', icon: User },
    { id: 'inmueble', label: 'Datos de la habitaci?n', icon: Home },
    { id: 'contrato', label: 'Condiciones', icon: FileSignature },
    { id: 'revisar', label: 'Revisar y generar', icon: Check },
  ],
  // Documentos simples con menos pasos
  carta_impago: [
    { id: 'tipo', label: 'Tipo de documento', icon: FileText },
    { id: 'arrendador', label: 'Datos del arrendador', icon: User },
    { id: 'arrendatario', label: 'Datos del deudor', icon: User },
    { id: 'deuda', label: 'Datos de la deuda', icon: Euro },
    { id: 'revisar', label: 'Revisar y generar', icon: Check },
  ],
  inventario: [
    { id: 'tipo', label: 'Tipo de documento', icon: FileText },
    { id: 'inmueble', label: 'Datos del inmueble', icon: Home },
    { id: 'revisar', label: 'Revisar y generar', icon: Check },
  ],
  acta_entrega: [
    { id: 'tipo', label: 'Tipo de documento', icon: FileText },
    { id: 'arrendador', label: 'Propietario', icon: User },
    { id: 'arrendatario', label: 'Inquilino', icon: User },
    { id: 'inmueble', label: 'Inmueble', icon: Home },
    { id: 'revisar', label: 'Revisar y generar', icon: Check },
  ],
  default: [
    { id: 'tipo', label: 'Tipo de documento', icon: FileText },
    { id: 'contexto', label: 'Detalles', icon: FileSignature },
    { id: 'revisar', label: 'Revisar y generar', icon: Check },
  ],
};

const categorias = [
  { value: 'contrato_arrendamiento', label: 'Contrato de Arrendamiento' },
  { value: 'anexo_contrato', label: 'Anexo de Contrato' },
  { value: 'notificacion_inquilino', label: 'Notificaci?n a Inquilino' },
  { value: 'reclamacion', label: 'Reclamaci?n' },
  { value: 'finalizacion_contrato', label: 'Finalizaci?n de Contrato' },
  { value: 'inspeccion', label: 'Inspecci?n' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'autorizacion', label: 'Autorizaci?n' },
  { value: 'otro', label: 'Otro' },
];

const tiposGeneracionIA = [
  { value: 'contrato_vivienda', label: 'Contrato de alquiler de vivienda' },
  { value: 'contrato_local', label: 'Contrato de alquiler de local comercial' },
  { value: 'contrato_habitacion', label: 'Contrato de alquiler de habitaci?n' },
  { value: 'prorroga_contrato', label: 'Pr?rroga de contrato' },
  { value: 'rescision_contrato', label: 'Rescisi?n de contrato' },
  { value: 'carta_impago', label: 'Carta de reclamaci?n de impago' },
  { value: 'inventario', label: 'Inventario de inmueble' },
  { value: 'acta_entrega', label: 'Acta de entrega de llaves' },
  { value: 'autorizacion_obras', label: 'Autorizaci?n de obras menores' },
  { value: 'incremento_renta', label: 'Notificaci?n de incremento de renta' },
];

export default function PlantillasLegalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<LegalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LegalTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<LegalTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<LegalTemplate | null>(null);

  // AI Generation states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTipo, setAiTipo] = useState('contrato_vivienda');
  const [aiContexto, setAiContexto] = useState('');
  const [aiJurisdiccion, setAiJurisdiccion] = useState('Espa?a');
  const [aiResult, setAiResult] = useState<AIGeneratedTemplate | null>(null);
  
  // AI Wizard states
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState<AIWizardData>(initialWizardData);
  const [datosDeuda, setDatosDeuda] = useState({
    mesesImpagados: '',
    importeTotal: '',
    fechaUltimoPago: '',
  });

  // Obtener pasos seg?n el tipo de documento
  const getWizardSteps = () => {
    return WIZARD_STEPS[aiTipo] || WIZARD_STEPS.default;
  };

  const wizardSteps = getWizardSteps();

  // Permission check
  const canEdit = ['super_admin', 'administrador', 'gestor'].includes(session?.user?.role || '');
  const canDelete = ['super_admin', 'administrador'].includes(session?.user?.role || '');

  const [formData, setFormData] = useState<TemplateFormData>({
    nombre: '',
    categoria: 'contrato_arrendamiento',
    descripcion: '',
    contenido: '',
    variables: '',
    jurisdiccion: 'Espa?a',
    aplicableA: '',
    activo: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchTemplates();
    }
  }, [status, router]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/legal-templates');
      if (!response.ok) {
        throw new Error('Error al cargar plantillas');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      toast.error('Error al cargar las plantillas');
      logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(
        (template) =>
          template.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (template.descripcion &&
            template.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((template) => template.categoria === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const handleOpenDialog = (template?: LegalTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        nombre: template.nombre,
        categoria: template.categoria,
        descripcion: template.descripcion || '',
        contenido: template.contenido,
        variables: template.variables.join(', '),
        jurisdiccion: template.jurisdiccion || 'Espa?a',
        aplicableA: template.aplicableA.join(', '),
        activo: template.activo,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        nombre: '',
        categoria: 'contrato_arrendamiento',
        descripcion: '',
        contenido: '',
        variables: '',
        jurisdiccion: 'Espa?a',
        aplicableA: '',
        activo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        nombre: formData.nombre,
        categoria: formData.categoria,
        descripcion: formData.descripcion || null,
        contenido: formData.contenido,
        variables: formData.variables
          ? formData.variables.split(',').map((v) => v.trim()).filter((v) => v)
          : [],
        jurisdiccion: formData.jurisdiccion || null,
        aplicableA: formData.aplicableA
          ? formData.aplicableA.split(',').map((v) => v.trim()).filter((v) => v)
          : [],
        activo: formData.activo,
      };

      const url = editingTemplate
        ? `/api/legal-templates/${editingTemplate.id}`
        : '/api/legal-templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar');
      }

      toast.success(editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
      setIsDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la plantilla');
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(`/api/legal-templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      toast.success('Plantilla eliminada');
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Error al eliminar la plantilla');
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Contenido copiado al portapapeles');
  };

  const handleDownload = (template: LegalTemplate) => {
    const blob = new Blob([template.contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.nombre.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Plantilla descargada');
  };

  // Construir contexto desde los datos del wizard
  const buildContextFromWizard = (): string => {
    const parts: string[] = [];

    // Datos del arrendador
    if (wizardData.arrendador.nombre) {
      parts.push(`ARRENDADOR:`);
      parts.push(`- Nombre: ${wizardData.arrendador.nombre}`);
      if (wizardData.arrendador.nif) parts.push(`- NIF: ${wizardData.arrendador.nif}`);
      if (wizardData.arrendador.direccion) parts.push(`- Dirección: ${wizardData.arrendador.direccion}`);
      if (wizardData.arrendador.telefono) parts.push(`- Teléfono: ${wizardData.arrendador.telefono}`);
      if (wizardData.arrendador.email) parts.push(`- Email: ${wizardData.arrendador.email}`);
    }

    // Datos del arrendatario
    if (wizardData.arrendatario.nombre) {
      parts.push(`\nARRENDATARIO:`);
      parts.push(`- Nombre: ${wizardData.arrendatario.nombre}`);
      if (wizardData.arrendatario.nif) parts.push(`- NIF: ${wizardData.arrendatario.nif}`);
      if (wizardData.arrendatario.direccion) parts.push(`- Dirección: ${wizardData.arrendatario.direccion}`);
      if (wizardData.arrendatario.telefono) parts.push(`- Teléfono: ${wizardData.arrendatario.telefono}`);
      if (wizardData.arrendatario.email) parts.push(`- Email: ${wizardData.arrendatario.email}`);
      if (wizardData.arrendatario.profesion) parts.push(`- Profesión: ${wizardData.arrendatario.profesion}`);
    }

    // Datos del inmueble
    if (wizardData.inmueble.direccion) {
      parts.push(`\nINMUEBLE:`);
      parts.push(`- Dirección: ${wizardData.inmueble.direccion}`);
      if (wizardData.inmueble.localidad) parts.push(`- Localidad: ${wizardData.inmueble.localidad}`);
      if (wizardData.inmueble.provincia) parts.push(`- Provincia: ${wizardData.inmueble.provincia}`);
      if (wizardData.inmueble.codigoPostal) parts.push(`- Código Postal: ${wizardData.inmueble.codigoPostal}`);
      if (wizardData.inmueble.referenciaCatastral) parts.push(`- Ref. Catastral: ${wizardData.inmueble.referenciaCatastral}`);
      if (wizardData.inmueble.superficie) parts.push(`- Superficie: ${wizardData.inmueble.superficie} m²`);
      if (wizardData.inmueble.numHabitaciones) parts.push(`- Habitaciones: ${wizardData.inmueble.numHabitaciones}`);
      if (wizardData.inmueble.numBanos) parts.push(`- Baños: ${wizardData.inmueble.numBanos}`);
      parts.push(`- Tipo: ${wizardData.inmueble.tipoInmueble}`);
      parts.push(`- Amueblado: ${wizardData.inmueble.amueblado ? 'Sí' : 'No'}`);
    }

    // Condiciones del contrato
    if (wizardData.contrato.rentaMensual) {
      parts.push(`\nCONDICIONES DEL CONTRATO:`);
      parts.push(`- Renta mensual: ${wizardData.contrato.rentaMensual}€`);
      if (wizardData.contrato.fianza) parts.push(`- Fianza: ${wizardData.contrato.fianza} mes(es)`);
      if (wizardData.contrato.duracion) parts.push(`- Duración: ${wizardData.contrato.duracion} meses`);
      if (wizardData.contrato.fechaInicio) parts.push(`- Fecha inicio: ${wizardData.contrato.fechaInicio}`);
      parts.push(`- Forma de pago: ${wizardData.contrato.formaPago}`);
      parts.push(`- Mascotas permitidas: ${wizardData.contrato.mascotasPermitidas ? 'Sí' : 'No'}`);
      if (wizardData.contrato.incluyeGastos.length > 0) {
        parts.push(`- Gastos incluidos: ${wizardData.contrato.incluyeGastos.join(', ')}`);
      }
    }

    // Datos de deuda (para carta impago)
    if (datosDeuda.mesesImpagados || datosDeuda.importeTotal) {
      parts.push(`\nDATOS DE LA DEUDA:`);
      if (datosDeuda.mesesImpagados) parts.push(`- Meses impagados: ${datosDeuda.mesesImpagados}`);
      if (datosDeuda.importeTotal) parts.push(`- Importe total: ${datosDeuda.importeTotal}€`);
      if (datosDeuda.fechaUltimoPago) parts.push(`- Último pago: ${datosDeuda.fechaUltimoPago}`);
    }

    // Cláusulas adicionales
    if (wizardData.contrato.clausulasAdicionales) {
      parts.push(`\nCLÁUSULAS ADICIONALES:`);
      parts.push(wizardData.contrato.clausulasAdicionales);
    }

    // Contexto libre (si no hay datos estructurados)
    if (parts.length === 0 && aiContexto) {
      return aiContexto;
    }

    return parts.join('\n');
  };

  // AI Generation
  const handleGenerateWithAI = async () => {
    const contexto = buildContextFromWizard();
    
    // Validación mínima según tipo de documento
    const needsArrendador = ['contrato_vivienda', 'contrato_local', 'contrato_habitacion', 'carta_impago', 'acta_entrega'].includes(aiTipo);
    const needsInmueble = ['contrato_vivienda', 'contrato_local', 'contrato_habitacion', 'inventario', 'acta_entrega'].includes(aiTipo);
    
    if (needsArrendador && !wizardData.arrendador.nombre) {
      toast.error('Por favor completa al menos el nombre del arrendador');
      return;
    }
    
    if (needsInmueble && !wizardData.inmueble.direccion) {
      toast.error('Por favor completa al menos la dirección del inmueble');
      return;
    }

    if (!contexto.trim() && !aiContexto.trim()) {
      toast.error('Por favor completa los datos del documento');
      return;
    }

    setAiGenerating(true);
    setAiResult(null);

    try {
      const response = await fetch('/api/legal-templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: aiTipo,
          contexto: contexto || aiContexto,
          jurisdiccion: aiJurisdiccion,
          datosEstructurados: {
            arrendador: wizardData.arrendador,
            arrendatario: wizardData.arrendatario,
            inmueble: wizardData.inmueble,
            contrato: wizardData.contrato,
            deuda: datosDeuda,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al generar');
      }

      const result = await response.json();
      setAiResult(result);
      toast.success('Documento generado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el documento');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleUseAIResult = () => {
    if (!aiResult) return;

    setFormData({
      nombre: aiResult.titulo,
      categoria: 'contrato_arrendamiento',
      descripcion: aiResult.notas || '',
      contenido: aiResult.contenido,
      variables: aiResult.variables?.join(', ') || '',
      jurisdiccion: aiJurisdiccion,
      aplicableA: '',
      activo: true,
    });

    setIsAIDialogOpen(false);
    setIsDialogOpen(true);
    setAiResult(null);
    setAiContexto('');
  };

  const getCategoriaLabel = (categoria: string) => {
    const cat = categorias.find((c) => c.value === categoria);
    return cat ? cat.label : categoria;
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Plantillas Legales
            </h1>
            <p className="text-muted-foreground mt-1">
              Genera y gestiona documentos legales profesionales con ayuda de IA
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAIDialogOpen(true)}
              variant="outline"
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200"
            >
              <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
              Generar con IA
            </Button>
            {canEdit && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Plantilla
              </Button>
            )}
          </div>
        </div>

        {/* AI Feature Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Wand2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900">Asistente Legal con IA</h3>
                <p className="text-sm text-purple-700 mt-1">
                  Genera contratos, notificaciones y documentos legales personalizados en segundos.
                  Nuestra IA conoce la legislaci?n espa?ola vigente y crea documentos profesionales
                  adaptados a tus necesidades.
                </p>
              </div>
              <Button
                onClick={() => setIsAIDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Empezar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar plantillas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Categor?a" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categor?as</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No se encontraron plantillas</p>
              <Button onClick={() => setIsAIDialogOpen(true)} variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Crear una con IA
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.nombre}</CardTitle>
                      <CardDescription className="mt-1">
                        {getCategoriaLabel(template.categoria)}
                      </CardDescription>
                    </div>
                    <Badge variant={template.activo ? 'default' : 'secondary'}>
                      {template.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.descripcion && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.descripcion}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {template.jurisdiccion && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Jurisdicci?n:</span>
                        <span>{template.jurisdiccion}</span>
                      </div>
                    )}
                    {template.variables.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Variables:</span>
                        <span>{template.variables.length}</span>
                      </div>
                    )}
                    {template.ultimaRevision && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">?ltima revisi?n:</span>
                        <span>
                          {format(new Date(template.ultimaRevision), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setViewingTemplate(template);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyContent(template.contenido)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(template)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setTemplateToDelete(template);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* AI Generation Dialog - Wizard Guiado */}
        <Dialog open={isAIDialogOpen} onOpenChange={(open) => {
          setIsAIDialogOpen(open);
          if (!open) {
            setWizardStep(0);
            setWizardData(initialWizardData);
            setAiResult(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Asistente Legal con IA
              </DialogTitle>
              <DialogDescription>
                Te guiaremos paso a paso para crear tu documento legal personalizado
              </DialogDescription>
            </DialogHeader>

            {!aiResult ? (
              <div className="space-y-6 py-4">
                {/* Progress indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Paso {wizardStep + 1} de {wizardSteps.length}</span>
                    <span>{Math.round(((wizardStep + 1) / wizardSteps.length) * 100)}% completado</span>
                  </div>
                  <Progress value={((wizardStep + 1) / wizardSteps.length) * 100} className="h-2" />
                </div>

                {/* Step indicators */}
                <div className="flex justify-between items-center overflow-x-auto pb-2">
                  {wizardSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === wizardStep;
                    const isCompleted = index < wizardStep;
                    return (
                      <div
                        key={step.id}
                        className={`flex flex-col items-center min-w-[80px] cursor-pointer transition-all ${
                          isActive ? 'scale-105' : ''
                        }`}
                        onClick={() => index < wizardStep && setWizardStep(index)}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                            isCompleted
                              ? 'bg-green-100 text-green-600'
                              : isActive
                                ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-300'
                                : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                        </div>
                        <span className={`text-xs text-center ${isActive ? 'font-semibold text-purple-600' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Step Content */}
                <Card className="border-purple-100">
                  <CardContent className="pt-6">
                    {/* Paso 0: Tipo de documento */}
                    {wizardSteps[wizardStep]?.id === 'tipo' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-lg">¿Qué documento necesitas?</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {tiposGeneracionIA.map((tipo) => (
                            <button
                              key={tipo.value}
                              type="button"
                              onClick={() => {
                                setAiTipo(tipo.value);
                                setWizardStep(0);
                              }}
                              className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-[1.02] ${
                                aiTipo === tipo.value
                                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                  : 'border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {aiTipo === tipo.value && (
                                  <Check className="h-4 w-4 text-purple-600" />
                                )}
                                <span className="font-medium">{tipo.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="mt-4">
                          <Label>Jurisdicción</Label>
                          <Select value={aiJurisdiccion} onValueChange={setAiJurisdiccion}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="España">España (general)</SelectItem>
                              <SelectItem value="Cataluña">Cataluña</SelectItem>
                              <SelectItem value="Madrid">Comunidad de Madrid</SelectItem>
                              <SelectItem value="Andalucía">Andalucía</SelectItem>
                              <SelectItem value="Valencia">Comunidad Valenciana</SelectItem>
                              <SelectItem value="País Vasco">País Vasco</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Paso: Datos del arrendador */}
                    {wizardSteps[wizardStep]?.id === 'arrendador' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <User className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-lg">Datos del Arrendador (Propietario)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nombre completo *</Label>
                            <Input
                              value={wizardData.arrendador.nombre}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendador: { ...wizardData.arrendador, nombre: e.target.value }
                              })}
                              placeholder="Juan García López"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>NIF/NIE *</Label>
                            <Input
                              value={wizardData.arrendador.nif}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendador: { ...wizardData.arrendador, nif: e.target.value }
                              })}
                              placeholder="12345678A"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Dirección fiscal</Label>
                            <Input
                              value={wizardData.arrendador.direccion}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendador: { ...wizardData.arrendador, direccion: e.target.value }
                              })}
                              placeholder="Calle Mayor 1, 28001 Madrid"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Teléfono</Label>
                            <Input
                              value={wizardData.arrendador.telefono}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendador: { ...wizardData.arrendador, telefono: e.target.value }
                              })}
                              placeholder="612345678"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              value={wizardData.arrendador.email}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendador: { ...wizardData.arrendador, email: e.target.value }
                              })}
                              placeholder="propietario@email.com"
                              type="email"
                            />
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex gap-2">
                            <HelpCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-700">
                              Los campos marcados con * son obligatorios. Los demás datos son opcionales pero recomendados para un documento más completo.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Paso: Datos del arrendatario */}
                    {wizardSteps[wizardStep]?.id === 'arrendatario' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <User className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-lg">Datos del Arrendatario (Inquilino)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nombre completo *</Label>
                            <Input
                              value={wizardData.arrendatario.nombre}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendatario: { ...wizardData.arrendatario, nombre: e.target.value }
                              })}
                              placeholder="María Pérez Sánchez"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>NIF/NIE *</Label>
                            <Input
                              value={wizardData.arrendatario.nif}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendatario: { ...wizardData.arrendatario, nif: e.target.value }
                              })}
                              placeholder="87654321B"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Dirección actual</Label>
                            <Input
                              value={wizardData.arrendatario.direccion}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendatario: { ...wizardData.arrendatario, direccion: e.target.value }
                              })}
                              placeholder="Calle Secundaria 5, 28002 Madrid"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Teléfono</Label>
                            <Input
                              value={wizardData.arrendatario.telefono}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendatario: { ...wizardData.arrendatario, telefono: e.target.value }
                              })}
                              placeholder="698765432"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              value={wizardData.arrendatario.email}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendatario: { ...wizardData.arrendatario, email: e.target.value }
                              })}
                              placeholder="inquilino@email.com"
                              type="email"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Profesión/Ocupación</Label>
                            <Input
                              value={wizardData.arrendatario.profesion}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                arrendatario: { ...wizardData.arrendatario, profesion: e.target.value }
                              })}
                              placeholder="Ingeniero de software"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Paso: Datos del inmueble */}
                    {wizardSteps[wizardStep]?.id === 'inmueble' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Home className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-lg">Datos del Inmueble</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Dirección completa del inmueble *</Label>
                            <Input
                              value={wizardData.inmueble.direccion}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                inmueble: { ...wizardData.inmueble, direccion: e.target.value }
                              })}
                              placeholder="Calle Principal 25, 3º Izquierda"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Localidad *</Label>
                            <Input
                              value={wizardData.inmueble.localidad}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                inmueble: { ...wizardData.inmueble, localidad: e.target.value }
                              })}
                              placeholder="Madrid"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Provincia</Label>
                            <Input
                              value={wizardData.inmueble.provincia}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                inmueble: { ...wizardData.inmueble, provincia: e.target.value }
                              })}
                              placeholder="Madrid"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Código Postal</Label>
                            <Input
                              value={wizardData.inmueble.codigoPostal}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                inmueble: { ...wizardData.inmueble, codigoPostal: e.target.value }
                              })}
                              placeholder="28001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Referencia Catastral</Label>
                            <Input
                              value={wizardData.inmueble.referenciaCatastral}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                inmueble: { ...wizardData.inmueble, referenciaCatastral: e.target.value }
                              })}
                              placeholder="1234567AB1234C0001XX"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Superficie (m²)</Label>
                            <Input
                              value={wizardData.inmueble.superficie}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                inmueble: { ...wizardData.inmueble, superficie: e.target.value }
                              })}
                              placeholder="85"
                              type="number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nº Habitaciones</Label>
                            <Input
                              value={wizardData.inmueble.numHabitaciones}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                inmueble: { ...wizardData.inmueble, numHabitaciones: e.target.value }
                              })}
                              placeholder="3"
                              type="number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nº Baños</Label>
                            <Input
                              value={wizardData.inmueble.numBanos}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                inmueble: { ...wizardData.inmueble, numBanos: e.target.value }
                              })}
                              placeholder="2"
                              type="number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tipo de inmueble</Label>
                            <Select
                              value={wizardData.inmueble.tipoInmueble}
                              onValueChange={(value) => setWizardData({
                                ...wizardData,
                                inmueble: { ...wizardData.inmueble, tipoInmueble: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vivienda">Vivienda</SelectItem>
                                <SelectItem value="piso">Piso</SelectItem>
                                <SelectItem value="apartamento">Apartamento</SelectItem>
                                <SelectItem value="chalet">Chalet</SelectItem>
                                <SelectItem value="estudio">Estudio</SelectItem>
                                <SelectItem value="atico">Ático</SelectItem>
                                <SelectItem value="local">Local comercial</SelectItem>
                                <SelectItem value="oficina">Oficina</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <Label>¿Amueblado?</Label>
                              <p className="text-xs text-muted-foreground">El inmueble incluye mobiliario</p>
                            </div>
                            <Switch
                              checked={wizardData.inmueble.amueblado}
                              onCheckedChange={(checked) => setWizardData({
                                ...wizardData,
                                inmueble: { ...wizardData.inmueble, amueblado: checked }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Paso: Condiciones del contrato */}
                    {wizardSteps[wizardStep]?.id === 'contrato' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <FileSignature className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-lg">Condiciones del Contrato</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Renta mensual (€) *</Label>
                            <div className="relative">
                              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                value={wizardData.contrato.rentaMensual}
                                onChange={(e) => setWizardData({
                                  ...wizardData,
                                  contrato: { ...wizardData.contrato, rentaMensual: e.target.value }
                                })}
                                placeholder="1200"
                                type="number"
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Fianza (meses) *</Label>
                            <Select
                              value={wizardData.contrato.fianza}
                              onValueChange={(value) => setWizardData({
                                ...wizardData,
                                contrato: { ...wizardData.contrato, fianza: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 mes (mínimo legal vivienda)</SelectItem>
                                <SelectItem value="2">2 meses (mínimo legal local)</SelectItem>
                                <SelectItem value="3">3 meses</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Duración del contrato</Label>
                            <Select
                              value={wizardData.contrato.duracion}
                              onValueChange={(value) => setWizardData({
                                ...wizardData,
                                contrato: { ...wizardData.contrato, duracion: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="6">6 meses</SelectItem>
                                <SelectItem value="12">1 año</SelectItem>
                                <SelectItem value="24">2 años</SelectItem>
                                <SelectItem value="36">3 años</SelectItem>
                                <SelectItem value="60">5 años</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Fecha de inicio</Label>
                            <Input
                              value={wizardData.contrato.fechaInicio}
                              onChange={(e) => setWizardData({
                                ...wizardData,
                                contrato: { ...wizardData.contrato, fechaInicio: e.target.value }
                              })}
                              type="date"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Forma de pago</Label>
                            <Select
                              value={wizardData.contrato.formaPago}
                              onValueChange={(value) => setWizardData({
                                ...wizardData,
                                contrato: { ...wizardData.contrato, formaPago: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="transferencia">Transferencia bancaria</SelectItem>
                                <SelectItem value="domiciliacion">Domiciliación bancaria</SelectItem>
                                <SelectItem value="efectivo">Efectivo</SelectItem>
                                <SelectItem value="bizum">Bizum</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <Label>¿Mascotas permitidas?</Label>
                              <p className="text-xs text-muted-foreground">Se permiten animales domésticos</p>
                            </div>
                            <Switch
                              checked={wizardData.contrato.mascotasPermitidas}
                              onCheckedChange={(checked) => setWizardData({
                                ...wizardData,
                                contrato: { ...wizardData.contrato, mascotasPermitidas: checked }
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Gastos incluidos en la renta</Label>
                          <div className="flex flex-wrap gap-2">
                            {['Agua', 'Luz', 'Gas', 'Internet', 'Comunidad', 'IBI'].map((gasto) => (
                              <button
                                key={gasto}
                                type="button"
                                onClick={() => {
                                  const gastos = wizardData.contrato.incluyeGastos;
                                  const newGastos = gastos.includes(gasto)
                                    ? gastos.filter(g => g !== gasto)
                                    : [...gastos, gasto];
                                  setWizardData({
                                    ...wizardData,
                                    contrato: { ...wizardData.contrato, incluyeGastos: newGastos }
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                                  wizardData.contrato.incluyeGastos.includes(gasto)
                                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {wizardData.contrato.incluyeGastos.includes(gasto) && (
                                  <Check className="h-3 w-3 inline mr-1" />
                                )}
                                {gasto}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Cláusulas adicionales o contexto extra</Label>
                          <Textarea
                            value={wizardData.contrato.clausulasAdicionales}
                            onChange={(e) => setWizardData({
                              ...wizardData,
                              contrato: { ...wizardData.contrato, clausulasAdicionales: e.target.value }
                            })}
                            placeholder="Ej: El inquilino se compromete a no realizar obras sin autorización escrita del propietario..."
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    {/* Paso: Datos de deuda (para carta de impago) */}
                    {wizardSteps[wizardStep]?.id === 'deuda' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Euro className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-lg">Datos de la Deuda</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Meses impagados *</Label>
                            <Input
                              value={datosDeuda.mesesImpagados}
                              onChange={(e) => setDatosDeuda({ ...datosDeuda, mesesImpagados: e.target.value })}
                              placeholder="3"
                              type="number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Importe total adeudado (€) *</Label>
                            <div className="relative">
                              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                value={datosDeuda.importeTotal}
                                onChange={(e) => setDatosDeuda({ ...datosDeuda, importeTotal: e.target.value })}
                                placeholder="3600"
                                type="number"
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Fecha del último pago</Label>
                            <Input
                              value={datosDeuda.fechaUltimoPago}
                              onChange={(e) => setDatosDeuda({ ...datosDeuda, fechaUltimoPago: e.target.value })}
                              type="date"
                            />
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <div className="flex gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-700">
                              Esta carta es una reclamación amistosa. Si no obtiene respuesta, considere asesoramiento legal para iniciar acciones de desahucio.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Paso: Contexto simple (para documentos sin wizard completo) */}
                    {wizardSteps[wizardStep]?.id === 'contexto' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <FileSignature className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-lg">Detalles del Documento</h3>
                        </div>
                        <div className="space-y-2">
                          <Label>Describe el contexto y detalles específicos *</Label>
                          <Textarea
                            value={aiContexto}
                            onChange={(e) => setAiContexto(e.target.value)}
                            placeholder="Proporciona todos los detalles relevantes para generar el documento..."
                            rows={6}
                          />
                        </div>
                      </div>
                    )}

                    {/* Paso: Revisar y generar */}
                    {wizardSteps[wizardStep]?.id === 'revisar' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Check className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-lg">Resumen y Generación</h3>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tipo de documento:</span>
                              <span className="font-medium">{tiposGeneracionIA.find(t => t.value === aiTipo)?.label}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Jurisdicción:</span>
                              <span className="font-medium">{aiJurisdiccion}</span>
                            </div>
                            {wizardData.arrendador.nombre && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Arrendador:</span>
                                <span className="font-medium">{wizardData.arrendador.nombre}</span>
                              </div>
                            )}
                            {wizardData.arrendatario.nombre && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Arrendatario:</span>
                                <span className="font-medium">{wizardData.arrendatario.nombre}</span>
                              </div>
                            )}
                            {wizardData.inmueble.direccion && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Inmueble:</span>
                                <span className="font-medium">{wizardData.inmueble.direccion}</span>
                              </div>
                            )}
                            {wizardData.contrato.rentaMensual && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Renta mensual:</span>
                                <span className="font-medium">{wizardData.contrato.rentaMensual}€</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-purple-900">¡Todo listo!</p>
                              <p className="text-sm text-purple-700 mt-1">
                                Haz clic en "Generar Documento" para que nuestra IA cree tu documento legal personalizado basado en los datos proporcionados.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation buttons */}
                <DialogFooter className="gap-2 sm:gap-0">
                  {wizardStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setWizardStep(wizardStep - 1)}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                  )}
                  <div className="flex-1" />
                  {wizardStep < wizardSteps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => setWizardStep(wizardStep + 1)}
                    >
                      Siguiente
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleGenerateWithAI}
                      disabled={aiGenerating}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generar Documento
                        </>
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </div>
            ) : (
              /* Resultado de la IA */
              <div className="space-y-4 py-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">{aiResult.titulo}</h3>
                  </div>
                  {aiResult.notas && (
                    <p className="text-sm text-green-700 mt-2">{aiResult.notas}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Contenido generado</Label>
                  <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {aiResult.contenido}
                    </pre>
                  </div>
                </div>

                {aiResult.variables && aiResult.variables.length > 0 && (
                  <div className="space-y-2">
                    <Label>Variables a personalizar</Label>
                    <div className="flex flex-wrap gap-2">
                      {aiResult.variables.map((variable) => (
                        <Badge key={variable} variant="secondary">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {aiResult.clausulasOpcionales && aiResult.clausulasOpcionales.length > 0 && (
                  <div className="space-y-2">
                    <Label>Cláusulas opcionales disponibles</Label>
                    <ul className="text-sm list-disc list-inside text-muted-foreground">
                      {aiResult.clausulasOpcionales.map((clausula, i) => (
                        <li key={i}>{clausula}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAiResult(null);
                      setWizardStep(0);
                      setWizardData(initialWizardData);
                    }}
                  >
                    Generar otro
                  </Button>
                  <Button variant="outline" onClick={() => handleCopyContent(aiResult.contenido)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                  {canEdit && (
                    <Button onClick={handleUseAIResult}>
                      <Plus className="mr-2 h-4 w-4" />
                      Guardar como Plantilla
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Plantilla Legal' : 'Nueva Plantilla Legal'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? 'Modifica los detalles de la plantilla'
                  : 'Completa la informaci?n de la nueva plantilla legal'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="ej: Contrato Est?ndar de Arrendamiento"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categor?a *</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jurisdiccion">Jurisdicci?n</Label>
                    <Input
                      id="jurisdiccion"
                      value={formData.jurisdiccion}
                      onChange={(e) => setFormData({ ...formData, jurisdiccion: e.target.value })}
                      placeholder="ej: Espa?a, Madrid"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripci?n</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={2}
                    placeholder="Breve descripci?n de la plantilla"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contenido">Contenido de la Plantilla *</Label>
                  <Textarea
                    id="contenido"
                    value={formData.contenido}
                    onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                    rows={10}
                    placeholder="Escribe el contenido de la plantilla aqu?..."
                    required
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Usa {`{{variable}}`} para definir variables que se pueden reemplazar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variables">Variables (separadas por comas)</Label>
                  <Input
                    id="variables"
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    placeholder="ej: nombre_inquilino, direccion_propiedad, fecha_inicio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aplicableA">Aplicable a (separados por comas)</Label>
                  <Input
                    id="aplicableA"
                    value={formData.aplicableA}
                    onChange={(e) => setFormData({ ...formData, aplicableA: e.target.value })}
                    placeholder="ej: residencial, comercial, turistico"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="activo">Plantilla Activa</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Las plantillas activas est?n disponibles para su uso
                    </p>
                  </div>
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingTemplate ? 'Actualizar' : 'Crear'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingTemplate?.nombre}</DialogTitle>
              <DialogDescription>
                {viewingTemplate && getCategoriaLabel(viewingTemplate.categoria)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {viewingTemplate?.descripcion && (
                <div>
                  <h4 className="font-semibold mb-2">Descripci?n</h4>
                  <p className="text-sm text-muted-foreground">{viewingTemplate.descripcion}</p>
                </div>
              )}

              {viewingTemplate?.variables && viewingTemplate.variables.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Variables</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Contenido</h4>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {viewingTemplate?.contenido}
                  </pre>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => viewingTemplate && handleCopyContent(viewingTemplate.contenido)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                onClick={() => viewingTemplate && handleDownload(viewingTemplate)}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
              <Button onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminaci?n</DialogTitle>
              <DialogDescription>
                ?Est?s seguro de que deseas eliminar la plantilla "{templateToDelete?.nombre}"?
                Esta acci?n no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
