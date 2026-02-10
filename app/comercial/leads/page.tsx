'use client';

import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, ChevronRight, Phone, Mail, Building2 } from 'lucide-react';

export default function ComercialLeadsPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/comercial" className="hover:text-blue-600">Alquiler Comercial</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900">Leads</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-8 w-8 text-purple-600" />Leads Comerciales</h1>
            <p className="text-gray-600 mt-1">Gestiona contactos interesados en tus espacios comerciales</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" />Nuevo Lead</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Total Leads</div><div className="text-2xl font-bold">0</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Nuevos (7d)</div><div className="text-2xl font-bold text-blue-600">0</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">En negociacion</div><div className="text-2xl font-bold text-amber-600">0</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Convertidos</div><div className="text-2xl font-bold text-green-600">0</div></CardContent></Card>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin leads comerciales</h3>
            <p className="text-gray-600 mb-4">Los leads se generan desde el portal web o puedes crearlos manualmente.</p>
            <Button><Plus className="h-4 w-4 mr-2" />Crear Lead</Button>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
