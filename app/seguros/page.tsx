'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Shield, Plus, Search, AlertTriangle } from 'lucide-react';

export default function SegurosPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [seguros, setSeguros] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/seguros')
        .then((res) => res.json())
        .then(setSeguros)
        .catch(() => toast.error('Error al cargar seguros'))
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">Cargando...</div>
        </main>
      </AuthenticatedLayout>
    );
  }

  const filteredSeguros = seguros.filter((s) =>
    s.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.proveedor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Seguros
            </h1>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Seguro
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Seguros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar por tipo o proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSeguros.map((seguro) => (
              <Card key={seguro.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{seguro.tipo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{seguro.proveedor}</p>
                    <Badge variant={seguro.activo ? 'default' : 'secondary'}>
                      {seguro.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {seguro.vencimiento && new Date(seguro.vencimiento) < new Date() && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs">Vencido</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSeguros.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron seguros</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
