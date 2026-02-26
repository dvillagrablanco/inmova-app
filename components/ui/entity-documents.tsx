'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText, Upload, Trash2, Download, Loader2, FolderOpen, Eye, File,
  FileImage, FileSpreadsheet, FileArchive, Edit, ExternalLink, MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EntityDocumentsProps {
  entityType: 'unit' | 'tenant' | 'building' | 'contract';
  entityId: string;
  buildingId?: string;
  title?: string;
  description?: string;
  className?: string;
}

interface Document {
  id: string;
  nombre: string;
  tipo: string;
  cloudStoragePath: string;
  fechaSubida: string;
  tags: string[];
  descripcion?: string;
}

const DOC_TYPES = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'dni', label: 'DNI / Identificación' },
  { value: 'nomina', label: 'Nómina' },
  { value: 'certificado_energetico', label: 'Certificado Energético' },
  { value: 'ite', label: 'ITE / Inspección' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'factura', label: 'Factura' },
  { value: 'contabilidad', label: 'Contabilidad' },
  { value: 'otro', label: 'Otro documento' },
];

const FILE_ICONS: Record<string, any> = {
  'application/pdf': FileText,
  'image/': FileImage,
  'application/vnd.openxmlformats': FileSpreadsheet,
  'application/vnd.ms-excel': FileSpreadsheet,
  'text/csv': FileSpreadsheet,
  'application/zip': FileArchive,
};

function getFileIcon(nombre: string) {
  const ext = nombre.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return FileText;
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return FileImage;
  if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['zip', 'rar', '7z'].includes(ext)) return FileArchive;
  return File;
}

export function EntityDocuments({
  entityType,
  entityId,
  buildingId,
  title,
  description,
  className,
}: EntityDocumentsProps) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('otro');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit dialog state
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('otro');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);

  const defaultTitles: Record<string, string> = {
    unit: 'Documentos de la Unidad',
    tenant: 'Documentos del Inquilino',
    building: 'Documentos del Edificio',
    contract: 'Documentos del Contrato',
  };

  const defaultDescs: Record<string, string> = {
    unit: 'Escrituras, contratos, informes técnicos, certificados y otros documentos',
    tenant: 'DNI, nóminas, contratos, avales, mandatos SEPA y otros documentos',
    building: 'Escrituras, ITE, certificados energéticos, seguros y documentación general',
    contract: 'Contrato firmado, adendas, anexos y documentación legal',
  };

  useEffect(() => {
    loadDocuments();
  }, [entityId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const paramMap: Record<string, string> = {
        unit: 'unitId',
        tenant: 'tenantId',
        building: 'buildingId',
        contract: 'contractId',
      };
      const param = paramMap[entityType];
      const res = await fetch(`/api/documents?${param}=${entityId}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploaded = 0;

    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} supera el límite de 25MB`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('nombre', file.name);
        formData.append('tipo', selectedType);

        // Link to the correct entity ONLY — don't cross-link
        if (entityType === 'unit') {
          formData.append('unitId', entityId);
          // Don't add buildingId — unit docs stay on unit page only
        } else if (entityType === 'building') {
          formData.append('buildingId', entityId);
        } else if (entityType === 'tenant') {
          formData.append('tenantId', entityId);
        } else if (entityType === 'contract') {
          formData.append('contractId', entityId);
        }

        formData.append('tags', [entityType, selectedType].join(','));

        const res = await fetch('/api/documents', { method: 'POST', body: formData });
        if (res.ok) {
          uploaded++;
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || `Error subiendo ${file.name}`);
        }
      } catch {
        toast.error(`Error subiendo ${file.name}`);
      }
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} documento${uploaded > 1 ? 's' : ''} subido${uploaded > 1 ? 's' : ''}`);
      loadDocuments();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== docId));
        toast.success('Documento eliminado');
        setDeleteDoc(null);
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleOpen = (doc: Document) => {
    if (doc.cloudStoragePath?.startsWith('http')) {
      window.open(doc.cloudStoragePath, '_blank');
    } else {
      window.open(`/api/documents/${doc.id}/download`, '_blank');
    }
  };

  const openEditDialog = (doc: Document) => {
    setEditDoc(doc);
    setEditName(doc.nombre);
    setEditType(doc.tipo);
  };

  const handleSaveEdit = async () => {
    if (!editDoc) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/documents/${editDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editName, tipo: editType }),
      });
      if (res.ok) {
        setDocs(prev => prev.map(d => d.id === editDoc.id ? { ...d, nombre: editName, tipo: editType } : d));
        toast.success('Documento actualizado');
        setEditDoc(null);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Error al actualizar');
      }
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeLabel = (tipo: string) => DOC_TYPES.find(t => t.value === tipo)?.label || tipo;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FolderOpen className="h-5 w-5 flex-shrink-0" />
              {title || defaultTitles[entityType]}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">{description || defaultDescs[entityType]}</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[130px] sm:w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp,.zip"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> <span className="hidden sm:inline">Subiendo...</span></>
              ) : (
                <><Upload className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Subir</span></>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : docs.length > 0 ? (
          <div className="space-y-2">
            {docs.map((doc) => {
              const Icon = getFileIcon(doc.nombre);
              const isExternal = doc.cloudStoragePath?.startsWith('http');
              return (
                <div key={doc.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 group gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => handleOpen(doc)}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{doc.nombre}</p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {getTypeLabel(doc.tipo)}
                        </Badge>
                        {isExternal && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-200 bg-blue-50">
                            <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
                            Enlace
                          </Badge>
                        )}
                        {doc.fechaSubida && (
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {format(new Date(doc.fechaSubida), 'dd MMM yyyy', { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpen(doc)}>
                          {isExternal ? <ExternalLink className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                          {isExternal ? 'Abrir enlace' : 'Ver / Descargar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(doc)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteDoc(doc)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No hay documentos</p>
            <p className="text-xs mt-1">Sube escrituras, contratos, certificados u otros documentos</p>
          </div>
        )}
      </CardContent>

      {/* Edit Document Dialog */}
      <Dialog open={!!editDoc} onOpenChange={(open) => !open && setEditDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Documento</DialogTitle>
            <DialogDescription>Modifica el nombre o tipo del documento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving || !editName.trim()}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar documento?</DialogTitle>
            <DialogDescription>
              Se eliminará &quot;{deleteDoc?.nombre}&quot; permanentemente. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteDoc && handleDelete(deleteDoc.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
