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
import { Users, Plus, Search, Mail, Phone } from 'lucide-react';

export default function StaffPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/housekeeping/staff')
        .then((res) => res.json())
        .then(setStaff)
        .catch(() => toast.error('Error al cargar personal'))
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">Cargando...</div>
        </main>
      </AuthenticatedLayout>
    );
  }

  const filteredStaff = staff.filter((member) =>
    member.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Personal
            </h1>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Personal
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Personal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStaff.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{member.nombre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {member.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {member.email}
                      </p>
                    )}
                    {member.telefono && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {member.telefono}
                      </p>
                    )}
                    <Badge variant={member.activo ? 'default' : 'secondary'}>
                      {member.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStaff.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No se encontró personal</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
