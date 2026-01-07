'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Building2,
  Home,
  Hotel,
  Hammer,
  Briefcase,
  Users,
  ArrowLeft,
  Play,
  CheckCircle,
  Sparkles,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Send,
} from 'lucide-react';

type BusinessVertical = {
  id: string;
  title: string;
  description: string;
  icon: any;
  features: string[];
  gradient: string;
};

const businessVerticals: BusinessVertical[] = [
  {
    id: 'alquiler_tradicional',
    title: 'Alquiler Tradicional',
    description: 'Gestión de alquileres residenciales y comerciales de largo plazo',
    icon: Building2,
    features: ['Contratos', 'Pagos automáticos', 'Portal inquilinos', 'Mantenimiento'],
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'coliving',
    title: 'Coliving / Habitaciones',
    description: 'Gestión de coliving y alquiler por habitaciones con prorrateo automático',
    icon: Home,
    features: [
      'Prorrateo servicios',
      'Gestión individual',
      'Calendario limpieza',
      'Contratos flexibles',
    ],
    gradient: 'from-teal-500 to-green-600',
  },
  {
    id: 'str_vacacional',
    title: 'STR / Alquiler Vacacional',
    description: 'Gestión de alquileres vacacionales con channel manager integrado',
    icon: Hotel,
    features: ['Airbnb/Booking sync', 'Pricing dinámico', 'Calendario reservas', 'Check-in/out'],
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'flipping',
    title: 'House Flipping',
    description: 'Gestión de inversiones inmobiliarias y renovaciones',
    icon: Hammer,
    features: ['ROI automático', 'Timeline renovación', 'Presupuestos', 'Tracking gastos'],
    gradient: 'from-green-500 to-teal-500',
  },
  {
    id: 'servicios_profesionales',
    title: 'Servicios Profesionales',
    description: 'Para arquitectos, aparejadores y consultores inmobiliarios',
    icon: Briefcase,
    features: ['Portfolio proyectos', 'CRM clientes', 'Entregables', 'Facturación'],
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'mixto',
    title: 'Multi-Vertical',
    description: 'Gestión de múltiples modelos de negocio en una sola plataforma',
    icon: Users,
    features: ['Todos los módulos', 'Dashboards unificados', 'Reportes consolidados', 'Vista 360°'],
    gradient: 'from-indigo-500 to-violet-500',
  },
];

// Generar slots de tiempo de 9:00 a 13:30 en tramos de 30 minutos
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30'
];

// Generar próximos 14 días laborables (Lunes a Viernes)
const getNextBusinessDays = () => {
  const days = [];
  const today = new Date();
  let count = 0;
  
  while (days.length < 14) {
    const date = new Date(today);
    date.setDate(today.getDate() + count);
    const dayOfWeek = date.getDay();
    
    // Solo días laborables (1-5 = Lunes-Viernes)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      days.push(date);
    }
    count++;
  }
  
  return days;
};

function DemoScheduler() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const businessDays = getNextBusinessDays();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Por favor selecciona fecha y hora');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulación de envío
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('¡Demo agendada con éxito!', {
      description: `Te esperamos el ${formatDate(selectedDate)} a las ${selectedTime}. Recibirás un email de confirmación.`,
    });
    
    // Reset form
    setSelectedDate(null);
    setSelectedTime(null);
    setFormData({ nombre: '', email: '', telefono: '', empresa: '' });
    setIsSubmitting(false);
  };
  
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8" id="agendar-demo">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">
          <Calendar className="h-6 w-6 inline mr-2" />
          Agenda una Demo Personalizada
        </h3>
        <p className="text-indigo-100">
          Selecciona fecha y hora para una presentación adaptada a tus necesidades
        </p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calendario y Horarios */}
        <div className="bg-white/10 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Selecciona una fecha
          </h4>
          
          {/* Grid de fechas */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
            {businessDays.map((date, i) => (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`p-3 rounded-lg text-center transition-all ${
                  selectedDate?.toDateString() === date.toDateString()
                    ? 'bg-white text-indigo-600 font-bold shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <div className="text-xs opacity-80">
                  {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold">{date.getDate()}</div>
              </button>
            ))}
          </div>
          
          {selectedDate && (
            <>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Selecciona una hora (9:00 - 13:30)
              </h4>
              
              {/* Grid de horarios */}
              <div className="grid grid-cols-5 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 rounded-lg text-sm font-semibold transition-all ${
                      selectedTime === time
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Formulario de contacto */}
        <div className="bg-white rounded-xl p-6">
          <h4 className="text-gray-900 font-semibold mb-4">
            Completa tus datos
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre" className="text-gray-700">Nombre completo *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Tu nombre"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email" className="text-gray-700">Email *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="telefono" className="text-gray-700">Teléfono</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+34 600 000 000"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="empresa" className="text-gray-700">Empresa</Label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Tu empresa"
                  className="pl-10"
                />
              </div>
            </div>
            
            {selectedDate && selectedTime && (
              <div className="bg-indigo-50 rounded-lg p-4 text-sm">
                <p className="text-indigo-800 font-semibold">
                  📅 Demo agendada para:
                </p>
                <p className="text-indigo-700">
                  {formatDate(selectedDate)} a las {selectedTime}
                </p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
              disabled={isSubmitting || !selectedDate || !selectedTime}
            >
              {isSubmitting ? (
                'Agendando...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirmar Demo
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-indigo-100 text-sm">
          ¿Prefieres hablar directamente? Contáctanos en{' '}
          <a href="mailto:inmovaapp@gmail.com" className="text-white font-semibold underline">
            inmovaapp@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const router = useRouter();
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartDemo = async (verticalId: string) => {
    setSelectedVertical(verticalId);
    setIsLoading(true);

    // En una implementación real, aquí cargaríamos datos de demo específicos para el vertical
    // Por ahora simplemente redirigimos al registro con el vertical preseleccionado
    setTimeout(() => {
      router.push(`/register?vertical=${verticalId}&demo=true`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-violet-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/landing"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Building2 className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>
            <Link href="/landing">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-white text-gray-900 border-2 border-indigo-400 px-4 py-2 font-bold shadow-sm">
              <Sparkles className="h-4 w-4 mr-2 inline text-indigo-600" />
              Demo Interactiva
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Explora INMOVA según tu Negocio
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Selecciona tu modelo de negocio para ver una demo adaptada con datos precargados y
              funcionalidades específicas
            </p>
          </div>

          {/* Vertical Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {businessVerticals.map((vertical) => (
              <Card
                key={vertical.id}
                className={`group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 ${
                  selectedVertical === vertical.id
                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                    : 'hover:border-indigo-300'
                }`}
                onClick={() => !isLoading && setSelectedVertical(vertical.id)}
              >
                <CardHeader>
                  <div
                    className={`p-3 bg-gradient-to-br ${vertical.gradient} rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <vertical.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">
                    {vertical.title}
                  </CardTitle>
                  <CardDescription className="text-sm">{vertical.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {vertical.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${selectedVertical === vertical.id ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : ''}`}
                    variant={selectedVertical === vertical.id ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartDemo(vertical.id);
                    }}
                    disabled={isLoading}
                  >
                    {isLoading && selectedVertical === vertical.id ? (
                      'Preparando demo...'
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Ver Demo
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Demo Scheduling Section */}
          <DemoScheduler />
        </div>
      </div>
    </div>
  );
}
