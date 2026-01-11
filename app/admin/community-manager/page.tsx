'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { 
  Bot,
  Settings,
  Calendar as CalendarIcon,
  Clock,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  FileText,
  PenTool,
  Sparkles,
  Send,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Image as ImageIcon,
  Palette,
  Zap,
  Target,
  Users,
  Globe,
  Newspaper,
  BookOpen,
  Hash,
  AtSign,
  Link2,
  ExternalLink,
  Copy,
  MoreHorizontal,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos
interface SocialAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter';
  name: string;
  username: string;
  followers: number;
  connected: boolean;
  lastPost?: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledDate: Date;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  type: 'post' | 'story' | 'reel' | 'article';
  mediaUrl?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  status: 'draft' | 'scheduled' | 'published';
  publishDate?: Date;
  category: string;
  tags: string[];
  views: number;
}

interface CMConfig {
  enabled: boolean;
  autoGenerate: boolean;
  postsPerDay: number;
  preferredTimes: string[];
  tone: 'profesional' | 'casual' | 'inspiracional' | 'educativo';
  language: 'es' | 'en' | 'ca';
  hashtags: {
    auto: boolean;
    maxCount: number;
    custom: string[];
  };
  topics: string[];
  platforms: {
    instagram: { enabled: boolean; stories: boolean; reels: boolean };
    facebook: { enabled: boolean; stories: boolean };
    linkedin: { enabled: boolean; articles: boolean };
    twitter: { enabled: boolean; threads: boolean };
  };
  blog: {
    enabled: boolean;
    postsPerWeek: number;
    categories: string[];
    autoSEO: boolean;
  };
}

// Datos de ejemplo
const SAMPLE_ACCOUNTS: SocialAccount[] = [
  { id: '1', platform: 'instagram', name: 'Inmova App', username: '@inmovaapp', followers: 12500, connected: true, lastPost: '2026-01-10' },
  { id: '2', platform: 'facebook', name: 'Inmova App', username: 'inmovaapp', followers: 8300, connected: true, lastPost: '2026-01-09' },
  { id: '3', platform: 'linkedin', name: 'Inmova App', username: 'inmova-app', followers: 5200, connected: true, lastPost: '2026-01-08' },
  { id: '4', platform: 'twitter', name: 'Inmova App', username: '@inmovaapp', followers: 3100, connected: false, lastPost: undefined },
];

const SAMPLE_POSTS: ScheduledPost[] = [
  { 
    id: '1', 
    content: '🏠 ¿Sabías que el 73% de los compradores busca propiedades online antes de visitar? Con Inmova, digitaliza tu gestión inmobiliaria y llega a más clientes. #PropTech #InmobiliariaDigital', 
    platforms: ['instagram', 'facebook', 'linkedin'], 
    scheduledDate: new Date('2026-01-11T10:00:00'), 
    status: 'scheduled',
    type: 'post',
  },
  { 
    id: '2', 
    content: '📊 Nuevo informe: El mercado inmobiliario español en 2026. Descarga gratis nuestro análisis completo. Link en bio 👆', 
    platforms: ['instagram'], 
    scheduledDate: new Date('2026-01-11T18:00:00'), 
    status: 'scheduled',
    type: 'story',
  },
  { 
    id: '3', 
    content: '5 tendencias PropTech que transformarán el sector inmobiliario este año 🚀\n\n1. IA para valoraciones\n2. Tours virtuales 360°\n3. Firma digital\n4. Automatización de contratos\n5. Analytics predictivo\n\n¿Cuál crees que tendrá más impacto?', 
    platforms: ['linkedin', 'twitter'], 
    scheduledDate: new Date('2026-01-12T09:00:00'), 
    status: 'scheduled',
    type: 'post',
  },
  { 
    id: '4', 
    content: '✨ Case Study: Cómo Inmova ayudó a Gestiones Madrid a reducir un 40% el tiempo de gestión de contratos. Lee la historia completa 👇', 
    platforms: ['linkedin'], 
    scheduledDate: new Date('2026-01-10T11:00:00'), 
    status: 'published',
    type: 'article',
    engagement: { likes: 234, comments: 18, shares: 45 },
  },
];

const SAMPLE_BLOG_POSTS: BlogPost[] = [
  { id: '1', title: 'Guía completa: Digitaliza tu inmobiliaria en 2026', excerpt: 'Descubre los pasos esenciales para transformar tu negocio inmobiliario...', status: 'published', publishDate: new Date('2026-01-05'), category: 'Guías', tags: ['digitalización', 'proptech', 'guía'], views: 1250 },
  { id: '2', title: '10 errores comunes en la gestión de alquileres', excerpt: 'Evita estos errores que cometen la mayoría de gestores de propiedades...', status: 'scheduled', publishDate: new Date('2026-01-15'), category: 'Tips', tags: ['alquiler', 'gestión', 'errores'], views: 0 },
  { id: '3', title: 'El futuro de la firma digital en el sector inmobiliario', excerpt: 'La firma electrónica está revolucionando cómo se cierran las operaciones...', status: 'draft', category: 'Tendencias', tags: ['firma digital', 'tecnología', 'contratos'], views: 0 },
];

const DEFAULT_CONFIG: CMConfig = {
  enabled: true,
  autoGenerate: true,
  postsPerDay: 2,
  preferredTimes: ['10:00', '18:00'],
  tone: 'profesional',
  language: 'es',
  hashtags: {
    auto: true,
    maxCount: 10,
    custom: ['PropTech', 'InmobiliariaDigital', 'GestiónInmobiliaria', 'Inmova'],
  },
  topics: ['PropTech', 'Gestión Inmobiliaria', 'Tendencias del Mercado', 'Tips para Propietarios', 'Novedades Inmova'],
  platforms: {
    instagram: { enabled: true, stories: true, reels: false },
    facebook: { enabled: true, stories: true },
    linkedin: { enabled: true, articles: true },
    twitter: { enabled: false, threads: false },
  },
  blog: {
    enabled: true,
    postsPerWeek: 2,
    categories: ['Guías', 'Tips', 'Tendencias', 'Casos de Éxito', 'Novedades'],
    autoSEO: true,
  },
};

// Componente de ícono de plataforma
const PlatformIcon = ({ platform, className = 'h-5 w-5' }: { platform: string; className?: string }) => {
  switch (platform) {
    case 'instagram': return <Instagram className={`${className} text-pink-500`} />;
    case 'facebook': return <Facebook className={`${className} text-blue-600`} />;
    case 'linkedin': return <Linkedin className={`${className} text-blue-700`} />;
    case 'twitter': return <Twitter className={`${className} text-gray-800`} />;
    default: return <Globe className={className} />;
  }
};

export default function CommunityManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState<CMConfig>(DEFAULT_CONFIG);
  const [agentStatus, setAgentStatus] = useState<'running' | 'paused' | 'stopped'>('running');
  const [accounts, setAccounts] = useState<SocialAccount[]>(SAMPLE_ACCOUNTS);
  const [posts, setPosts] = useState<ScheduledPost[]>(SAMPLE_POSTS);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(SAMPLE_BLOG_POSTS);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showGenerateContent, setShowGenerateContent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentPrompt, setContentPrompt] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    if (status === 'authenticated' && userRole && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  // Generar contenido con IA
  const generateContent = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/community-manager/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: contentPrompt,
          tone: config.tone,
          language: config.language,
          hashtags: config.hashtags,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setGeneratedContent(data.content);
      } else {
        // Generar contenido de ejemplo si la API falla
        const sampleContents = [
          `🏠 ${contentPrompt || 'La gestión inmobiliaria nunca fue tan fácil'}\n\nCon Inmova, automatiza tus procesos y dedica más tiempo a lo que importa: tus clientes.\n\n✅ Contratos digitales\n✅ Cobros automáticos\n✅ Comunicación centralizada\n\n#PropTech #InmobiliariaDigital #GestiónInmobiliaria`,
          `📊 Dato del día: El 85% de las inmobiliarias que digitalizan sus procesos aumentan su productividad en un 40%.\n\n¿Ya diste el paso hacia la transformación digital?\n\nDescubre cómo en inmova.app 🚀\n\n#PropTech #TransformaciónDigital #Inmobiliaria`,
          `💡 Tip para gestores inmobiliarios:\n\nAutomatiza los recordatorios de pago y reduce la morosidad hasta un 60%.\n\nCon Inmova puedes configurarlo en 2 minutos ⏱️\n\n#GestiónAlquileres #PropTech #TipsInmobiliarios`,
        ];
        setGeneratedContent(sampleContents[Math.floor(Math.random() * sampleContents.length)]);
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Stats calculados
  const totalFollowers = accounts.reduce((sum, acc) => sum + acc.followers, 0);
  const connectedAccounts = accounts.filter(acc => acc.connected).length;
  const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;

  // Días de la semana actual para el calendario
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">Community Manager IA</h1>
                  <Badge 
                    variant={agentStatus === 'running' ? 'default' : 'secondary'}
                    className={agentStatus === 'running' ? 'bg-green-500' : ''}
                  >
                    {agentStatus === 'running' ? '🟢 Activo' : agentStatus === 'paused' ? '🟡 Pausado' : '🔴 Detenido'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">Gestión automatizada de redes sociales y blog con IA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {agentStatus === 'running' ? (
                <Button variant="outline" onClick={() => setAgentStatus('paused')}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar Agente
                </Button>
              ) : (
                <Button onClick={() => setAgentStatus('running')} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Activar Agente
                </Button>
              )}
              <Dialog open={showGenerateContent} onOpenChange={setShowGenerateContent}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Contenido
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-violet-500" />
                      Generar Contenido con IA
                    </DialogTitle>
                    <DialogDescription>
                      Describe qué tipo de contenido quieres crear y la IA lo generará automáticamente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>¿Sobre qué quieres crear contenido?</Label>
                      <Textarea 
                        placeholder="Ej: Un post sobre los beneficios de digitalizar la gestión de alquileres..."
                        value={contentPrompt}
                        onChange={(e) => setContentPrompt(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tono</Label>
                        <Select value={config.tone} onValueChange={(v: any) => setConfig({ ...config, tone: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="profesional">Profesional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="inspiracional">Inspiracional</SelectItem>
                            <SelectItem value="educativo">Educativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de contenido</Label>
                        <Select defaultValue="post">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="post">Post estándar</SelectItem>
                            <SelectItem value="carousel">Carrusel</SelectItem>
                            <SelectItem value="story">Historia</SelectItem>
                            <SelectItem value="thread">Hilo/Thread</SelectItem>
                            <SelectItem value="article">Artículo blog</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {generatedContent && (
                      <div className="space-y-2">
                        <Label>Contenido Generado</Label>
                        <div className="p-4 bg-muted rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(generatedContent)}>
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open('/admin/canva?action=create', '_blank')}>
                            <Palette className="h-4 w-4 mr-1" />
                            Crear Visual en Canva
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowGenerateContent(false)}>
                      Cerrar
                    </Button>
                    <Button 
                      onClick={generateContent}
                      disabled={isGenerating || !contentPrompt}
                      className="bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    >
                      {isGenerating ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando...</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" /> Generar</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Seguidores Totales</p>
                  <p className="text-2xl font-bold">{totalFollowers.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" /> +5.2% este mes
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                  <Users className="h-6 w-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cuentas Conectadas</p>
                  <p className="text-2xl font-bold">{connectedAccounts}/{accounts.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Link2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Posts Programados</p>
                  <p className="text-2xl font-bold">{scheduledPosts}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Posts Publicados</p>
                  <p className="text-2xl font-bold">{publishedPosts}</p>
                  <p className="text-xs text-muted-foreground">Este mes</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                  <p className="text-2xl font-bold">4.8%</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" /> +0.3% vs anterior
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="blog">
              <Newspaper className="h-4 w-4 mr-2" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="accounts">
              <Globe className="h-4 w-4 mr-2" />
              Cuentas
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Próximos Posts */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Próximas Publicaciones
                    </span>
                    <Button size="sm" onClick={() => setActiveTab('calendar')}>
                      Ver Todo
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {posts.filter(p => p.status === 'scheduled').slice(0, 4).map(post => (
                      <div key={post.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center text-center min-w-[60px]">
                          <span className="text-xs text-muted-foreground">{format(post.scheduledDate, 'MMM', { locale: es })}</span>
                          <span className="text-2xl font-bold">{format(post.scheduledDate, 'd')}</span>
                          <span className="text-xs text-muted-foreground">{format(post.scheduledDate, 'HH:mm')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {post.platforms.map(platform => (
                              <PlatformIcon key={platform} platform={platform} className="h-4 w-4" />
                            ))}
                            <Badge variant="outline" className="ml-2">{post.type}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Acciones Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowGenerateContent(true)}>
                    <Sparkles className="h-4 w-4 mr-2 text-violet-500" />
                    Generar Post con IA
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => window.open('/admin/canva', '_blank')}>
                    <Palette className="h-4 w-4 mr-2 text-pink-500" />
                    Crear Visual en Canva
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('calendar')}>
                    <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                    Programar Publicación
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('blog')}>
                    <PenTool className="h-4 w-4 mr-2 text-green-500" />
                    Escribir Artículo Blog
                  </Button>
                  <Separator />
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2 text-amber-500" />
                    Ver Analytics Completo
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Rendimiento por Plataforma */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Rendimiento por Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  {accounts.map(account => (
                    <div key={account.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <PlatformIcon platform={account.platform} className="h-6 w-6" />
                        <div>
                          <p className="font-medium capitalize">{account.platform}</p>
                          <p className="text-xs text-muted-foreground">{account.username}</p>
                        </div>
                        {account.connected ? (
                          <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">Conectado</Badge>
                        ) : (
                          <Badge variant="outline" className="ml-auto">Desconectado</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Seguidores</p>
                          <p className="font-bold">{account.followers.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Engagement</p>
                          <p className="font-bold">{(Math.random() * 5 + 2).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-4">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Calendario de Publicaciones</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </Button>
                      <span className="px-3 py-1 text-sm font-medium">
                        {format(selectedDate, 'MMMM yyyy', { locale: es })}
                      </span>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Vista semanal */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                    {weekDays.map(day => {
                      const dayPosts = posts.filter(p => isSameDay(p.scheduledDate, day));
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div 
                          key={day.toISOString()} 
                          className={`min-h-[120px] border rounded-lg p-2 ${isToday ? 'border-violet-500 bg-violet-50 dark:bg-violet-950' : ''}`}
                        >
                          <div className={`text-sm font-medium mb-2 ${isToday ? 'text-violet-600' : ''}`}>
                            {format(day, 'd')}
                          </div>
                          <div className="space-y-1">
                            {dayPosts.slice(0, 3).map(post => (
                              <div 
                                key={post.id}
                                className="text-xs p-1 rounded bg-muted truncate cursor-pointer hover:bg-muted/80"
                                title={post.content}
                              >
                                <span className="flex items-center gap-1">
                                  {format(post.scheduledDate, 'HH:mm')}
                                  {post.platforms.slice(0, 2).map(p => (
                                    <PlatformIcon key={p} platform={p} className="h-3 w-3" />
                                  ))}
                                </span>
                              </div>
                            ))}
                            {dayPosts.length > 3 && (
                              <div className="text-xs text-muted-foreground">+{dayPosts.length - 3} más</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Panel lateral */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Crear Publicación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Contenido</Label>
                    <Textarea placeholder="Escribe tu publicación..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Plataformas</Label>
                    <div className="flex flex-wrap gap-2">
                      {accounts.filter(a => a.connected).map(account => (
                        <Button key={account.id} variant="outline" size="sm" className="gap-2">
                          <PlatformIcon platform={account.platform} className="h-4 w-4" />
                          {account.platform}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha y hora</Label>
                    <div className="flex gap-2">
                      <Input type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                      <Input type="time" defaultValue="10:00" className="w-24" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Añadir Media
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/admin/canva', '_blank')}>
                      <Palette className="h-4 w-4" />
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      Guardar Borrador
                    </Button>
                    <Button className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Programar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Gestión del Blog</h2>
                <p className="text-muted-foreground">Crea y programa artículos para el blog de Inmova</p>
              </div>
              <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Artículo
              </Button>
            </div>

            <div className="grid gap-4">
              {blogPosts.map(post => (
                <Card key={post.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={post.status === 'published' ? 'default' : post.status === 'scheduled' ? 'secondary' : 'outline'}
                            className={post.status === 'published' ? 'bg-green-500' : ''}
                          >
                            {post.status === 'published' ? 'Publicado' : post.status === 'scheduled' ? 'Programado' : 'Borrador'}
                          </Badge>
                          <Badge variant="outline">{post.category}</Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{post.excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {post.publishDate && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {format(post.publishDate, 'dd MMM yyyy', { locale: es })}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.views.toLocaleString()} vistas
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="h-4 w-4" />
                            {post.tags.join(', ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Cuentas de Redes Sociales</h2>
                <p className="text-muted-foreground">Conecta y gestiona tus perfiles de redes sociales</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Conectar Cuenta
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {accounts.map(account => (
                <Card key={account.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
                          account.platform === 'instagram' ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400' :
                          account.platform === 'facebook' ? 'bg-blue-600' :
                          account.platform === 'linkedin' ? 'bg-blue-700' :
                          'bg-gray-900'
                        }`}>
                          <PlatformIcon platform={account.platform} className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{account.name}</h3>
                          <p className="text-sm text-muted-foreground">{account.username}</p>
                          <p className="text-sm">{account.followers.toLocaleString()} seguidores</p>
                        </div>
                      </div>
                      <Badge 
                        variant={account.connected ? 'default' : 'secondary'}
                        className={account.connected ? 'bg-green-500' : ''}
                      >
                        {account.connected ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {account.lastPost ? `Último post: ${account.lastPost}` : 'Sin publicaciones'}
                      </div>
                      <div className="flex gap-2">
                        {account.connected ? (
                          <>
                            <Button size="sm" variant="outline">
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Sincronizar
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              Desconectar
                            </Button>
                          </>
                        ) : (
                          <Button size="sm">
                            <Link2 className="h-4 w-4 mr-1" />
                            Conectar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración del Agente CM
                </CardTitle>
                <CardDescription>
                  Personaliza el comportamiento del agente de Community Manager
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Activación */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Agente Activo</h4>
                    <p className="text-sm text-muted-foreground">Habilita o deshabilita la generación automática de contenido</p>
                  </div>
                  <Switch checked={config.enabled} onCheckedChange={(v) => setConfig({ ...config, enabled: v })} />
                </div>

                <Separator />

                {/* Cadencia */}
                <div className="space-y-4">
                  <h4 className="font-medium">Cadencia de Publicación</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Posts por día</Label>
                      <div className="flex items-center gap-4">
                        <Slider 
                          value={[config.postsPerDay]} 
                          onValueChange={([v]) => setConfig({ ...config, postsPerDay: v })}
                          max={10}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-bold w-8 text-center">{config.postsPerDay}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Horarios preferidos</Label>
                      <div className="flex flex-wrap gap-2">
                        {config.preferredTimes.map((time, i) => (
                          <Badge key={i} variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                          </Badge>
                        ))}
                        <Button size="sm" variant="outline" className="h-6">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tono y Estilo */}
                <div className="space-y-4">
                  <h4 className="font-medium">Tono y Estilo</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Tono de comunicación</Label>
                      <Select value={config.tone} onValueChange={(v: any) => setConfig({ ...config, tone: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="profesional">Profesional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="inspiracional">Inspiracional</SelectItem>
                          <SelectItem value="educativo">Educativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Idioma principal</Label>
                      <Select value={config.language} onValueChange={(v: any) => setConfig({ ...config, language: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">Inglés</SelectItem>
                          <SelectItem value="ca">Catalán</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Máximo hashtags</Label>
                      <Input 
                        type="number" 
                        value={config.hashtags.maxCount} 
                        onChange={(e) => setConfig({ 
                          ...config, 
                          hashtags: { ...config.hashtags, maxCount: parseInt(e.target.value) } 
                        })}
                        min={0}
                        max={30}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Plataformas */}
                <div className="space-y-4">
                  <h4 className="font-medium">Plataformas Habilitadas</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(config.platforms).map(([platform, settings]) => (
                      <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <PlatformIcon platform={platform} className="h-6 w-6" />
                          <div>
                            <p className="font-medium capitalize">{platform}</p>
                            <p className="text-xs text-muted-foreground">
                              {Object.entries(settings)
                                .filter(([k, v]) => k !== 'enabled' && v)
                                .map(([k]) => k)
                                .join(', ') || 'Posts estándar'}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          checked={settings.enabled} 
                          onCheckedChange={(v) => setConfig({
                            ...config,
                            platforms: {
                              ...config.platforms,
                              [platform]: { ...settings, enabled: v }
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Blog */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Blog Automático</h4>
                      <p className="text-sm text-muted-foreground">Genera artículos del blog automáticamente</p>
                    </div>
                    <Switch 
                      checked={config.blog.enabled} 
                      onCheckedChange={(v) => setConfig({ ...config, blog: { ...config.blog, enabled: v } })}
                    />
                  </div>
                  {config.blog.enabled && (
                    <div className="grid gap-4 md:grid-cols-2 pl-4 border-l-2 border-violet-200">
                      <div className="space-y-2">
                        <Label>Artículos por semana</Label>
                        <div className="flex items-center gap-4">
                          <Slider 
                            value={[config.blog.postsPerWeek]} 
                            onValueChange={([v]) => setConfig({ ...config, blog: { ...config.blog, postsPerWeek: v } })}
                            max={7}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <span className="font-bold w-8 text-center">{config.blog.postsPerWeek}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>SEO Automático</Label>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={config.blog.autoSEO}
                            onCheckedChange={(v) => setConfig({ ...config, blog: { ...config.blog, autoSEO: v } })}
                          />
                          <span className="text-sm text-muted-foreground">
                            {config.blog.autoSEO ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Temas */}
                <div className="space-y-4">
                  <h4 className="font-medium">Temas de Contenido</h4>
                  <div className="flex flex-wrap gap-2">
                    {config.topics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {topic}
                        <button className="ml-1 hover:text-red-500">×</button>
                      </Badge>
                    ))}
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      Añadir Tema
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Hashtags personalizados */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Hashtags Personalizados</h4>
                      <p className="text-sm text-muted-foreground">Hashtags que siempre se incluirán</p>
                    </div>
                    <Switch 
                      checked={config.hashtags.auto}
                      onCheckedChange={(v) => setConfig({ ...config, hashtags: { ...config.hashtags, auto: v } })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config.hashtags.custom.map((tag, i) => (
                      <Badge key={i} variant="outline" className="gap-1">
                        #{tag}
                      </Badge>
                    ))}
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      Añadir
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
                  Guardar Configuración
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
