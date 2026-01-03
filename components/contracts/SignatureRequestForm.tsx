/**
 * Componente: Formulario de Solicitud de Firma Digital
 * Permite enviar contratos para firma
 */

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
import { PenTool, Plus, Trash2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Signatory {
  email: string;
  name: string;
  role: 'LANDLORD' | 'TENANT' | 'GUARANTOR' | 'WITNESS';
}

interface SignatureRequestFormProps {
  contractId: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function SignatureRequestForm({
  contractId,
  onSuccess,
  onError,
}: SignatureRequestFormProps) {
  const [signatories, setSignatories] = useState<Signatory[]>([
    { email: '', name: '', role: 'LANDLORD' },
    { email: '', name: '', role: 'TENANT' },
  ]);
  const [expirationDays, setExpirationDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const addSignatory = () => {
    setSignatories([...signatories, { email: '', name: '', role: 'WITNESS' }]);
  };

  const removeSignatory = (index: number) => {
    if (signatories.length <= 2) return; // Mínimo 2 firmantes
    setSignatories(signatories.filter((_, i) => i !== index));
  };

  const updateSignatory = (index: number, field: keyof Signatory, value: string) => {
    const updated = [...signatories];
    updated[index] = { ...updated[index], [field]: value };
    setSignatories(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar
      const isValid = signatories.every(s => s.email && s.name);
      if (!isValid) {
        throw new Error('Todos los firmantes deben tener email y nombre');
      }

      // Enviar
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatories,
          expirationDays,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error enviando documento');
      }

      const data = await response.json();

      setSuccess(true);
      setSignatureUrl(data.signatureUrl);
      setIsDemo(data.provider === 'demo');
      onSuccess?.(data);

    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              {isDemo ? '⚠️ Modo Demo' : '¡Documento enviado para firma!'}
            </h3>
            <p className="text-sm text-green-700 mt-1">
              {isDemo 
                ? 'Configura credenciales de Signaturit o DocuSign para producción'
                : 'Los firmantes recibirán un email con el enlace para firmar'
              }
            </p>
          </div>
        </div>

        {signatureUrl && (
          <div className="space-y-2">
            <Label>URL de firma:</Label>
            <Input 
              value={signatureUrl} 
              readOnly 
              className="bg-white"
            />
            <Button
              variant="outline"
              onClick={() => window.open(signatureUrl, '_blank')}
              className="w-full"
            >
              Abrir enlace de firma
            </Button>
          </div>
        )}

        {isDemo && (
          <div className="border border-yellow-200 bg-yellow-50 rounded p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium">Modo Demostración</p>
              <p className="mt-1">
                Para usar firma digital real, configura:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Signaturit</strong> (recomendado): <code className="text-xs">SIGNATURIT_API_KEY</code></li>
                <li><strong>DocuSign</strong>: <code className="text-xs">DOCUSIGN_INTEGRATION_KEY</code></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Firmantes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Firmantes</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSignatory}
          >
            <Plus className="h-4 w-4 mr-1" />
            Añadir firmante
          </Button>
        </div>

        {signatories.map((signatory, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Firmante {index + 1}</span>
              {signatories.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSignatory(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor={`name-${index}`}>Nombre</Label>
                <Input
                  id={`name-${index}`}
                  value={signatory.name}
                  onChange={(e) => updateSignatory(index, 'name', e.target.value)}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <Label htmlFor={`email-${index}`}>Email</Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  value={signatory.email}
                  onChange={(e) => updateSignatory(index, 'email', e.target.value)}
                  placeholder="juan@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor={`role-${index}`}>Rol</Label>
                <Select
                  value={signatory.role}
                  onValueChange={(value) => updateSignatory(index, 'role', value as any)}
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
          </div>
        ))}
      </div>

      {/* Expiración */}
      <div>
        <Label htmlFor="expiration">Días hasta expiración</Label>
        <Input
          id="expiration"
          type="number"
          min={1}
          max={90}
          value={expirationDays}
          onChange={(e) => setExpirationDays(parseInt(e.target.value))}
        />
        <p className="text-xs text-gray-500 mt-1">
          Los firmantes tendrán {expirationDays} días para firmar el documento
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Enviando documento...
          </>
        ) : (
          <>
            <PenTool className="mr-2 h-5 w-5" />
            Enviar para firma
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        Los firmantes recibirán un email con el enlace para firmar el documento
      </p>
    </form>
  );
}
