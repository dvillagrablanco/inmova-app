'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Building2,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

interface DemoDataSummary {
  edificios: number;
  unidades: number;
  inquilinos: number;
  contratos: number;
}

export default function DemoDataGenerator() {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [summary, setSummary] = useState<DemoDataSummary | null>(null);
  const [hasExistingData, setHasExistingData] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/automation/generate-demo-data', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.hasData) {
          setHasExistingData(true);
          toast.error('Ya tienes datos en tu cuenta', {
            description: 'Los datos demo solo se pueden generar en cuentas nuevas',
          });
        } else {
          throw new Error(data.error || 'Error al generar datos');
        }
      } else {
        setGenerated(true);
        setSummary(data.summary);
        toast.success('¡Datos demo generados!', {
          description: data.message,
        });
      }
    } catch (error) {
      logger.error('Error generating demo data:', error);
      toast.error('Error al generar datos demo');
    } finally {
      setLoading(false);
    }
  };

  if (hasExistingData) {
    return (
      <Alert variant="default" className="border-2 border-primary/20">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ya tienes datos en tu cuenta. Los datos demo solo están disponibles para cuentas nuevas.
        </AlertDescription>
      </Alert>
    );
  }

  if (generated && summary) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card className="border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-green-900 dark:text-green-100">
                  ¡Datos Demo Generados!
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Tu cuenta está lista para explorar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{summary.edificios}</p>
                <p className="text-xs text-muted-foreground">Edificios</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{summary.unidades}</p>
                <p className="text-xs text-muted-foreground">Unidades</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{summary.inquilinos}</p>
                <p className="text-xs text-muted-foreground">Inquilinos</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{summary.contratos}</p>
                <p className="text-xs text-muted-foreground">Contratos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Generar Datos de Prueba</CardTitle>
            <CardDescription>
              Crea automáticamente datos de ejemplo para explorar INMOVA
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Se crearán automáticamente:
            <br />
            • 3 edificios de diferentes tipos
            <br />
            • 7 unidades (apartamentos, locales, habitaciones)
            <br />
            • 4 inquilinos con datos completos
            <br />• 2 contratos activos
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Esto te permitirá explorar todas las funcionalidades sin tener que ingresar datos
            manualmente.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <Building2 className="h-3 w-3 mr-1" />
              Edificios variados
            </Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              Inquilinos realistas
            </Badge>
            <Badge variant="outline">
              <FileText className="h-3 w-3 mr-1" />
              Contratos activos
            </Badge>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generando datos...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generar Datos de Prueba
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Solo disponible para cuentas nuevas sin datos
        </p>
      </CardContent>
    </Card>
  );
}
