'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Save, User, Mail, Phone, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';


export default function PartnerSettingsPage() {
  const router = useRouter();
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar datos del partner desde localStorage
    const storedData = localStorage.getItem('partnerData');
    if (storedData) {
      setPartnerData(JSON.parse(storedData));
    } else {
      router.push('/partners/login');
    }
    setLoading(false);
  }, [router]);

  if (loading || !partnerData) {
    return <div className="p-8">Cargando configuración...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
          <p className="text-gray-600">Gestiona la información de tu Partner</p>
      </div>

      {/* Información de la Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Información de la Empresa</span>
          </CardTitle>
          <CardDescription>
            Datos principales de tu organización como Partner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Comercial</Label>
                <Input id="nombre" value={partnerData.nombre} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón Social</Label>
                <Input id="razonSocial" value={partnerData.razonSocial} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cif">CIF / NIF</Label>
                <Input id="cif" value={partnerData.cif} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Partner</Label>
                <Input id="tipo" value={partnerData.tipo} disabled />
            </div>
          </div>

          <Alert>
            <AlertDescription>
              Para modificar estos datos, por favor contacta con nuestro equipo de soporte en partners@inmova.com
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Contacto Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Contacto Principal</span>
          </CardTitle>
          <CardDescription>
            Información de la persona de contacto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactoNombre">Nombre Completo</Label>
                <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="contactoNombre" 
                  value={partnerData.contactoNombre} 
                  className="pl-10" 
                  disabled 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactoEmail">Email de Contacto</Label>
                <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="contactoEmail" 
                  value={partnerData.contactoEmail} 
                  className="pl-10" 
                  disabled 
                />
              </div>
            </div>

            {partnerData.contactoTelefono && (
              <div className="space-y-2">
                <Label htmlFor="contactoTelefono">Teléfono</Label>
                  <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="contactoTelefono" 
                    value={partnerData.contactoTelefono} 
                    className="pl-10" 
                    disabled 
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email de Acceso</Label>
                <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="email" 
                  value={partnerData.email} 
                  className="pl-10" 
                  disabled 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comisiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Configuración de Comisiones</span>
          </CardTitle>
          <CardDescription>
            Tu esquema actual de comisiones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 mb-2">
              <span className="font-semibold">Comisión actual:</span> {partnerData.comisionPorcentaje}%
            </p>
            <p className="text-sm text-green-700">
              Tu porcentaje de comisión aumenta automáticamente según el número de clientes activos.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Escala de Comisiones:</h4>
              <div className="space-y-1 text-sm text-gray-600">
              <p>• 1-10 clientes: 20%</p>
                <p>• 11-25 clientes: 30%</p>
                <p>• 26-50 clientes: 40%</p>
                <p>• 51-100 clientes: 50%</p>
                <p>• 101-250 clientes: 60%</p>
                <p>• 251+ clientes: 70%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de la Cuenta</CardTitle>
            <CardDescription>
            Estado actual de tu Partner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Estado:</p>
                <p className="text-sm text-gray-600">
                Fecha de registro: {new Date(partnerData.createdAt).toLocaleDateString('es-ES')}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              partnerData.estado === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : partnerData.estado === 'PENDING'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {partnerData.estado === 'ACTIVE' ? 'Activo' :
               partnerData.estado === 'PENDING' ? 'Pendiente de Aprobación' :
               'Suspendido'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Soporte */}
      <Card className="bg-primary text-white">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-2">¿Necesitas ayuda?</h3>
          <p className="text-primary-foreground/90 mb-4">
            Nuestro equipo de soporte está disponible para ayudarte con cualquier duda o problema.
          </p>
          <div className="space-y-2 text-sm">
            <p>Email: <a href="mailto:partners@inmova.com" className="underline font-medium">partners@inmova.com</a></p>
            <p>Teléfono: +34 900 123 456</p>
          </div>
        </CardContent>
      </Card>
    </div>
          </main>
        </div>
      </div>
  );
}
