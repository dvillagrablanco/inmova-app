'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ArrowLeft, FileText, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function SubirDocumentoPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/documentos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />Subir Documento
          </h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Documento</CardTitle>
            <CardDescription>Sube un documento al gestor documental</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Archivo</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Arrastra un archivo o haz clic para seleccionar</p>
                <p className="text-sm text-muted-foreground mt-1">PDF, DOC, XLS, JPG, PNG (max 25MB)</p>
                <Input type="file" className="mt-3" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select defaultValue="contrato">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="factura">Factura</SelectItem>
                  <SelectItem value="seguro">Seguro / Poliza</SelectItem>
                  <SelectItem value="certificado">Certificado</SelectItem>
                  <SelectItem value="plano">Plano</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre del documento</Label>
              <Input placeholder="Ej: Contrato alquiler Piso 3A" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => router.push('/documentos')}>Cancelar</Button>
              <Button disabled={uploading} onClick={() => { toast.info('Funcionalidad de subida en desarrollo'); }}>
                <Upload className="h-4 w-4 mr-2" />{uploading ? 'Subiendo...' : 'Subir Documento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
