'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, Upload, Trash2, Download, Loader2, FolderOpen, Eye, File,
  FileImage, FileSpreadsheet, FileArchive,
} from 'lucide-react';
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

        // Link to the correct entity
        if (entityType === 'unit') formData.append('unitId', entityId);
        if (entityType === 'tenant') formData.append('tenantId', entityId);
        if (entityType === 'building') formData.append('buildingId', entityId);
        if (entityType === 'contract') formData.append('contractId', entityId);
        if (buildingId) formData.append('buildingId', buildingId);

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
      }
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleDownload = (doc: Document) => {
    if (doc.cloudStoragePath?.startsWith('http')) {
      window.open(doc.cloudStoragePath, '_blank');
    } else {
      window.open(`/api/documents/${doc.id}/download`, '_blank');
    }
  };

  const getTypeLabel = (tipo: string) => DOC_TYPES.find(t => t.value === tipo)?.label || tipo;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              {title || defaultTitles[entityType]}
            </CardTitle>
            <CardDescription>{description || defaultDescs[entityType]}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[160px]">
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
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Subir</>
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
              return (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {getTypeLabel(doc.tipo)}
                        </Badge>
                        {doc.fechaSubida && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(doc.fechaSubida), 'dd MMM yyyy', { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
    </Card>
  );
}
