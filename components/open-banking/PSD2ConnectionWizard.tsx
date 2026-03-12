'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ArrowRight, CheckCircle2, Loader2, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BANK_CODES: Record<string, string> = {
  bankinter: 'BANKINTER_BKBKESMM',
  caixabank: 'CAIXABANK_CAIXESBB',
  bbva: 'BBVA_BBVAESMM',
  santander: 'SANTANDER_BSCHESMM',
  sabadell: 'SABADELL_BSABESBB',
};

const BANKS = [
  { id: 'bankinter', name: 'Bankinter', color: 'bg-red-600' },
  { id: 'caixabank', name: 'CaixaBank', color: 'bg-[#0066a1]' },
  { id: 'bbva', name: 'BBVA', color: 'bg-[#004481]' },
  { id: 'santander', name: 'Santander', color: 'bg-[#ec0000]' },
  { id: 'sabadell', name: 'Sabadell', color: 'bg-[#00529b]' },
];

interface PSD2ConnectionWizardProps {
  onComplete?: () => void;
}

interface AvailableCompany {
  id: string;
  nombre: string;
}

export function PSD2ConnectionWizard({ onComplete }: PSD2ConnectionWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [availableCompanies, setAvailableCompanies] = useState<AvailableCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const res = await fetch('/api/user/companies');
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'No se pudieron cargar las sociedades');
        }

        const companies = Array.isArray(data.companies)
          ? data.companies
              .filter((company: { id?: string; nombre?: string }) => company.id && company.nombre)
              .map((company: { id: string; nombre: string }) => ({
                id: company.id,
                nombre: company.nombre,
              }))
          : [];

        if (!cancelled) {
          setAvailableCompanies(companies);
          setSelectedCompany(
            (currentCompanyId) =>
              currentCompanyId || data.currentCompanyId || companies[0]?.id || ''
          );
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Error cargando sociedades');
        }
      } finally {
        if (!cancelled) {
          setLoadingCompanies(false);
        }
      }
    };

    void loadCompanies();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleConnect = async () => {
    if (!selectedBank || !selectedCompany) {
      toast.error('Seleccione banco y empresa');
      return;
    }
    const institutionId = BANK_CODES[selectedBank];
    if (!institutionId) {
      toast.error('Banco no válido');
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch('/api/open-banking/nordigen/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          companyId: selectedCompany,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar');
      }

      const redirectUrl = data.redirectUrl || data.link;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      setConnected(true);
      setStep(4);
      toast.success('Cuenta conectada correctamente');
      onComplete?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al conectar');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Conectar cuenta bancaria (PSD2)
        </CardTitle>
        <CardDescription>
          Conecte sus cuentas bancarias de forma segura mediante Open Banking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Select bank */}
        {step >= 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Paso 1: Seleccione su banco</p>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un banco" />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    <span className="flex items-center gap-2">
                      <span className={`inline-block h-3 w-3 rounded-full ${bank.color}`} />
                      {bank.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Step 2: Select company */}
        {step >= 2 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Paso 2: ¿Para qué empresa es esta cuenta?</p>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingCompanies ? 'Cargando sociedades...' : 'Seleccione empresa'}
                />
              </SelectTrigger>
              <SelectContent>
                {availableCompanies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingCompanies && availableCompanies.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay sociedades accesibles para conectar cuentas bancarias.
              </p>
            )}
          </div>
        )}

        {/* Step 3: Authorization */}
        {step >= 3 && !connected && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Autorización en el banco</p>
                <p className="text-sm text-muted-foreground">
                  Será redirigido a la página de su banco para autorizar el acceso de forma segura.
                  Solo podremos leer los movimientos de la cuenta.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleConnect}
                disabled={connecting || !selectedBank || !selectedCompany}
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    Conectar con {BANKS.find((b) => b.id === selectedBank)?.name || 'banco'}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} disabled={connecting}>
                Atrás
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Status */}
        {connected && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Cuenta conectada correctamente
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                La sincronización de movimientos comenzará en breve.
              </p>
            </div>
          </div>
        )}

        {/* Step navigation */}
        {!connected && step < 3 && (
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Atrás
            </Button>
            <Button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={
                (step === 1 && !selectedBank) ||
                (step === 2 && (!selectedCompany || loadingCompanies))
              }
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step < 3 && !connected && (
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <Badge key={s} variant={s <= step ? 'default' : 'secondary'} className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
