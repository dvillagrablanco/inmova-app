'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PenTool, Loader2, CheckCircle2, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface SignContractButtonProps {
  contractId: string;
  contractName?: string;
  disabled?: boolean;
}

export function SignContractButton({
  contractId,
  contractName,
  disabled = false,
}: SignContractButtonProps) {
  const [open, setOpen] = useState(false);
  const [landlordEmail, setLandlordEmail] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!landlordEmail || !tenantEmail) {
      toast.error('Introduzca ambos correos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(landlordEmail) || !emailRegex.test(tenantEmail)) {
      toast.error('Introduzca correos válidos');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/signatures/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          signatories: [
            { email: landlordEmail, role: 'landlord' },
            { email: tenantEmail, role: 'tenant' },
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar solicitud');
      }

      setSent(true);
      toast.success('Solicitud de firma enviada. Los firmantes recibirán un email.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (sent) {
      setLandlordEmail('');
      setTenantEmail('');
      setSent(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={disabled} variant="default">
        <PenTool className="mr-2 h-4 w-4" />
        Enviar para firma
      </Button>

      <Dialog open={open} onOpenChange={(o) => (!o ? handleClose() : setOpen(o))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Firma digital con Signaturit</DialogTitle>
            <DialogDescription>
              {contractName
                ? `Enviar "${contractName}" para firma`
                : 'Introduzca los correos de los firmantes. Recibirán un email para firmar el contrato.'}
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="text-center text-sm text-muted-foreground">
                Solicitud de firma enviada. Los firmantes recibirán un email.
              </p>
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="landlord-email">Correo del propietario</Label>
                  <Input
                    id="landlord-email"
                    type="email"
                    placeholder="propietario@ejemplo.com"
                    value={landlordEmail}
                    onChange={(e) => setLandlordEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenant-email">Correo del inquilino</Label>
                  <Input
                    id="tenant-email"
                    type="email"
                    placeholder="inquilino@ejemplo.com"
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose} disabled={sending}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={sending}>
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar para firma
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
