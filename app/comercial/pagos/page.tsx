'use client';

import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Euro, Plus, ChevronRight, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

export default function ComercialPagosPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/comercial" className="hover:text-blue-600">Alquiler Comercial</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900">Pagos</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Euro className="h-8 w-8 text-emerald-600" />Pagos Comerciales</h1>
            <p className="text-gray-600 mt-1">Control de cobros, facturas y conciliacion de rentas comerciales</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" />Registrar Pago</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Cobrado este mes</div><div className="text-2xl font-bold text-green-600">0 EUR</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Pendiente</div><div className="text-2xl font-bold text-amber-600">0 EUR</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Vencido</div><div className="text-2xl font-bold text-red-600">0 EUR</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Facturas emitidas</div><div className="text-2xl font-bold">0</div></CardContent></Card>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin pagos registrados</h3>
            <p className="text-gray-600 mb-4">Los pagos se generan automaticamente desde los contratos comerciales activos.</p>
            <Link href="/comercial/contratos"><Button variant="outline">Ver Contratos</Button></Link>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
