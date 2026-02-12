'use client';

import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, ChevronRight, Clock, MapPin } from 'lucide-react';

export default function ComercialVisitasPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/comercial" className="hover:text-blue-600">Alquiler Comercial</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900">Visitas</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Calendar className="h-8 w-8 text-indigo-600" />Visitas Programadas</h1>
            <p className="text-gray-600 mt-1">Agenda y seguimiento de visitas a espacios comerciales</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" />Programar Visita</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Hoy</div><div className="text-2xl font-bold">0</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Esta semana</div><div className="text-2xl font-bold text-blue-600">0</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Pendientes</div><div className="text-2xl font-bold text-amber-600">0</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Realizadas (mes)</div><div className="text-2xl font-bold text-green-600">0</div></CardContent></Card>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin visitas programadas</h3>
            <p className="text-gray-600 mb-4">Programa visitas para que los interesados conozcan tus espacios comerciales.</p>
            <Button><Plus className="h-4 w-4 mr-2" />Programar Visita</Button>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
