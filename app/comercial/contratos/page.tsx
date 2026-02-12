'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Search, ChevronRight, Building2, Euro, Calendar, AlertCircle } from 'lucide-react';

export default function ComercialContratosPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/comercial" className="hover:text-blue-600">Alquiler Comercial</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900">Contratos</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Contratos Comerciales
            </h1>
            <p className="text-gray-600 mt-1">Contratos LAU comercial, CAM y escalado de rentas</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" />Nuevo Contrato</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Activos</div><div className="text-2xl font-bold text-green-600">0</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Por vencer (90d)</div><div className="text-2xl font-bold text-amber-600">0</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Facturacion mensual</div><div className="text-2xl font-bold">0 EUR</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Pendientes cobro</div><div className="text-2xl font-bold text-red-600">0 EUR</div></CardContent></Card>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin contratos comerciales</h3>
            <p className="text-gray-600 mb-4">Crea tu primer contrato comercial vinculado a un espacio.</p>
            <Button><Plus className="h-4 w-4 mr-2" />Crear Contrato</Button>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
