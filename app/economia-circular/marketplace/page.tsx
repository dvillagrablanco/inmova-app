'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Plus,
  ShoppingBag,
  Sofa,
  Refrigerator,
  Tv,
  Lamp,
  Heart,
  MessageCircle,
  MapPin,
} from 'lucide-react';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  isFree: boolean;
  images: string[];
  location: string;
  createdAt: string;
  user: {
    name: string;
    building: string;
  };
}

const categories = [
  { value: 'muebles', label: 'Muebles', icon: Sofa },
  { value: 'electrodomesticos', label: 'Electrodomésticos', icon: Refrigerator },
  { value: 'electronica', label: 'Electrónica', icon: Tv },
  { value: 'decoracion', label: 'Decoración', icon: Lamp },
  { value: 'otros', label: 'Otros', icon: ShoppingBag },
];

const conditions = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'como_nuevo', label: 'Como nuevo' },
  { value: 'buen_estado', label: 'Buen estado' },
  { value: 'usado', label: 'Usado' },
  { value: 'para_reparar', label: 'Para reparar' },
];

export default function MarketplaceCircularPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'muebles',
    condition: 'buen_estado',
    price: 0,
    isFree: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchItems();
    }
  }, [status, router]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/circular-economy/marketplace');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/circular-economy/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('Artículo publicado exitosamente');
        setOpenDialog(false);
        setForm({
          title: '',
          description: '',
          category: 'muebles',
          condition: 'buen_estado',
          price: 0,
          isFree: false,
        });
        fetchItems();
      } else {
        throw new Error('Error al publicar');
      }
    } catch (error) {
      toast.error('Error al publicar el artículo');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-8 w-8 text-green-600" />
                Marketplace Circular
              </h1>
              <p className="text-muted-foreground mt-1">
                Compra, vende o regala artículos de segunda mano en tu comunidad
              </p>
            </div>
          </div>
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Publicar Artículo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-sm text-muted-foreground">Artículos disponibles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {items.filter((i) => i.isFree).length}
              </div>
              <p className="text-sm text-muted-foreground">Artículos gratis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(items.map((i) => i.user.building)).size}
              </div>
              <p className="text-sm text-muted-foreground">Edificios participando</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">150 kg</div>
              <p className="text-sm text-muted-foreground">CO₂ ahorrado este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar artículos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  Todos
                </Button>
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.value}
                      variant={selectedCategory === cat.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.value)}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {cat.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay artículos disponibles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sé el primero en publicar un artículo
              </p>
              <Button onClick={() => setOpenDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Publicar Artículo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-green-100 to-emerald-100 rounded-t-lg flex items-center justify-center">
                  {categories.find((c) => c.value === item.category)?.icon ? (
                    (() => {
                      const Icon = categories.find((c) => c.value === item.category)!.icon;
                      return <Icon className="h-16 w-16 text-green-300" />;
                    })()
                  ) : (
                    <ShoppingBag className="h-16 w-16 text-green-300" />
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="mt-1">{item.description}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    {item.isFree ? (
                      <Badge className="bg-green-500">GRATIS</Badge>
                    ) : (
                      <span className="text-xl font-bold">€{item.price}</span>
                    )}
                    <Badge variant="outline">
                      {conditions.find((c) => c.value === item.condition)?.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {item.user.building}
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" className="flex-1" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Contactar
                    </Button>
                    <Button className="flex-1" size="sm">
                      Me interesa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Item Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Publicar Artículo</DialogTitle>
              <DialogDescription>
                Publica un artículo para vender, intercambiar o regalar
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ej: Sofá 3 plazas"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe el artículo..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={form.condition}
                    onValueChange={(v) => setForm({ ...form, condition: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((cond) => (
                        <SelectItem key={cond.value} value={cond.value}>
                          {cond.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Precio (€)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: parseInt(e.target.value) || 0, isFree: false })
                    }
                    disabled={form.isFree}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={form.isFree ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, isFree: !form.isFree, price: 0 })}
                  >
                    Gratis
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Publicar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
