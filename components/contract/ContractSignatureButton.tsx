/**
 * Botón de Firma Digital de Contratos
 * Integración con Signaturit
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSignature, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Signatory {
  email: string;
  name: string;
  role: 'LANDLORD' | 'TENANT' | 'GUARANTOR' | 'WITNESS';
}

interface ContractSignatureButtonProps {
  contractId: string;
  onSignatureCreated?: (data: any) => void;
}

export function ContractSignatureButton({
  contractId,
  onSignatureCreated,
}: ContractSignatureButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signatories, setSignatories] = useState<Signatory[]>([
    { email: '', name: '', role: 'LANDLORD' },
    { email: '', name: '', role: 'TENANT' },
  ]);

  const addSignatory = () => {
    setSignatories([...signatories, { email: '', name: '', role: 'TENANT' }]);
  };

  const removeSignatory = (index: number) => {
    if (signatories.length > 2) {
      setSignatories(signatories.filter((_, i) => i !== index));
    }
  };

  const updateSignatory = (index: number, field: keyof Signatory, value: string) => {
    const updated = [...signatories];
    updated[index][field] = value as any;
    setSignatories(updated);
  };

  const handleSubmit = async () => {
    // Validar
    const incomplete = signatories.some(s => !s.email || !s.name);
    if (incomplete) {
      toast.error('Completa todos los datos de los firmantes');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatories, expirationDays: 30 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error enviando documento para firma');
      }

      toast.success('Documento enviado para firma digital');
      
      // Abrir URL de firma en nueva pestaña
      if (data.signatureUrl) {
        window.open(data.signatureUrl, '_blank');
      }

      onSignatureCreated?.(data);
      setOpen(false);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileSignature className="mr-2 h-4 w-4" />
          Enviar para Firma Digital
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📝 Firma Digital de Contrato</DialogTitle>
          <DialogDescription>
            Añade los firmantes que recibirán el documento para firma digital (eIDAS)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {signatories.map((signatory, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Firmante {index + 1}
                </Label>
                {signatories.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSignatory(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre completo</Label>
                  <Input
                    placeholder="Juan Pérez"
                    value={signatory.name}
                    onChange={(e) => updateSignatory(index, 'name', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="juan@example.com"
                    value={signatory.email}
                    onChange={(e) => updateSignatory(index, 'email', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Rol</Label>
                <Select
                  value={signatory.role}
                  onValueChange={(value) => updateSignatory(index, 'role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LANDLORD">Propietario</SelectItem>
                    <SelectItem value="TENANT">Inquilino</SelectItem>
                    <SelectItem value="GUARANTOR">Avalista</SelectItem>
                    <SelectItem value="WITNESS">Testigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addSignatory}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir Firmante
          </Button>

          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <p className="font-semibold mb-1">ℹ️ Sobre la firma digital:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Cada firmante recibirá un email con enlace para firmar</li>
              <li>La firma tiene validez legal (cumple eIDAS UE)</li>
              <li>El documento expira en 30 días</li>
              <li>Recibirás notificación cuando todos firmen</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Enviar para Firma
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
