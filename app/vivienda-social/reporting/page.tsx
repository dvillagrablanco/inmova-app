'use client';

/**
 * Vivienda Social - Informes
 *
 * Generación de informes y reportes de vivienda social
 */

import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ViviendaSocialReportingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Informes y Estadísticas
        </h1>
        <p className="text-muted-foreground">
          Generación de informes de gestión de vivienda social
        </p>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Sin datos disponibles</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Configure los módulos de vivienda social para generar reportes.
          </p>
          <Button variant="outline" asChild>
            <Link href="/vivienda-social">
              <Settings className="h-4 w-4 mr-2" />
              Configurar módulos
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
