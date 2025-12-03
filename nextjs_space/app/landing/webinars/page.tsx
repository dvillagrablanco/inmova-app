'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, Video, Calendar, Clock, Users, CheckCircle, 
  Sparkles, TrendingUp, Hammer, Euro, Home, Target,
  BarChart3, Zap, Star, ArrowRight, AlertCircle, PlayCircle
} from 'lucide-react';

interface WebinarData {
  nombre: string;
  email: string;
  empresa?: string;
  telefono?: string;
  webinarId: string;
}

export default function WebinarsPage() {
  const [formData, setFormData] = useState<WebinarData>({
    nombre: '',
    email: '',
    empresa: '',
    telefono: '',
    webinarId: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<string>('');

  const webinars = [
    {
      id: 'house-flipping-roi',
      titulo: 'House Flipping: Cálculo de ROI en Tiempo Real',
      descripcion: 'Aprende a evaluar proyectos de flipping con datos reales y evita inversiones poco rentables.',
      fecha: 'Martes 15 Enero 2025',
      hora: '18:00 - 19:00 CET',
      instructor: 'Javier Pérez',
      cargo: 'Inversor Full-Time con +20 proyectos completados',
      icon: Hammer,
      color: 'from-orange-600 to-amber-600',
      bgColor: 'from-orange-50 to-amber-50',
      temas: [
        'Cómo calcular el ROI real de un proyecto de flipping',
        'Errores comunes al estimar costes de reforma',
        'Demo en vivo del módulo de House Flipping de INMOVA',
        'Casos reales: proyectos exitosos y fracasos evitables',
        'Q&A con participantes'
      ]
    },
    {
      id: 'coliving-prorrateo',
      titulo: 'Coliving: Prorrateo de Suministros y Gestión de Convivencia',
      descripcion: 'Descubre cómo automatizar el reparto de gastos y gestionar múltiples inquilinos sin conflictos.',
      fecha: 'Jueves 17 Enero 2025',
      hora: '19:00 - 20:00 CET',
      instructor: 'Mónica Sánchez',
      cargo: 'Propietaria de 3 Colivings en Valencia y Madrid',
      icon: Users,
      color: 'from-cyan-600 to-blue-600',
      bgColor: 'from-cyan-50 to-blue-50',
      temas: [
        'Sistemas de prorrateo: ¿cuál elegir para tu coliving?',
        'Cómo evitar discusiones por facturas de suministros',
        'Gestión de normas de convivencia digitales',
        'Demo del módulo de Coliving Avanzado de INMOVA',
        'Estrategias de ocupación y rentabilidad'
      ]
    },
    {
      id: 'multi-vertical-mastery',
      titulo: 'Multi-Vertical Mastery: Gestiona 7 Modelos de Negocio',
      descripcion: 'Para gestores que manejan alquiler tradicional, STR, obras y más simultáneamente.',
      fecha: 'Martes 22 Enero 2025',
      hora: '18:30 - 20:00 CET',
      instructor: 'Carlos Martínez',
      cargo: 'Fundador de INMOVA',
      icon: Building2,
      color: 'from-indigo-600 to-violet-600',
      bgColor: 'from-indigo-50 to-violet-50',
      temas: [
        'Por qué la multi-verticalidad es el futuro del PropTech',
        'Cómo integrar alquiler tradicional + STR + flipping en un solo sistema',
        'Caso de estudio: Agencia que gestía 200 unidades con 5 modelos de negocio',
        'Tour completo por los 88 módulos de INMOVA',
        'Oferta especial exclusiva para asistentes'
      ]
    }
  ];

  const handleSubmit = async (e: React.FormEvent, webinarId: string) => {
    e.preventDefault();
    setLoading(true);

    // Simular envío de formulario
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSubmitted(true);
    setLoading(false);
    setSelectedWebinar(webinarId);
  };

  const handleInputChange = (field: keyof WebinarData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      empresa: '',
      telefono: '',
      webinarId: ''
    });
    setSubmitted(false);
    setSelectedWebinar('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 w-full bg-white backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">INMOVA</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/landing/campanas/launch2025">
                <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                  Ver Oferta LAUNCH2025
                </Button>
              </Link>
              <Link href="/register?coupon=LAUNCH2025">
                <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white">
                  Comenzar Ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 text-sm px-4 py-1">
            <Video className="h-4 w-4 mr-2" />
            Webinars Gratuitos
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Domina la Gestión Inmobiliaria
            <br />
            con Nuestros Expertos
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Sesiones en vivo sobre <strong>House Flipping, Coliving y estrategias Multi-Vertical</strong>.
            <br />
            100% gratuito. Cupos limitados.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-lg h-14 px-8" onClick={() => document.getElementById('webinars-list')?.scrollIntoView({ behavior: 'smooth' })}>
              <Calendar className="mr-2 h-5 w-5" />
              Ver Próximos Webinars
            </Button>
            <Button size="lg" variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-lg h-14 px-8">
              <PlayCircle className="mr-2 h-5 w-5" />
              Ver Grabaciones Anteriores
            </Button>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">¿Qué Aprenderás en Nuestros Webinars?</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="bg-indigo-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Casos Reales</h3>
                <p className="text-gray-600 text-sm">Ejemplos y números de proyectos exitosos y errores que debes evitar</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="bg-violet-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-violet-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Demostraciones en Vivo</h3>
                <p className="text-gray-600 text-sm">Ve en directo cómo funcionan los módulos de INMOVA</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="bg-pink-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Networking</h3>
                <p className="text-gray-600 text-sm">Conecta con otros gestores e inversores inmobiliarios</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* LISTADO DE WEBINARS */}
      <section id="webinars-list" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Próximos Webinars</h2>
          <p className="text-xl text-gray-600 text-center mb-12">Regístrate gratis y recibe el enlace de acceso por email</p>

          <div className="space-y-8">
            {webinars.map((webinar, index) => (
              <Card key={webinar.id} className={`bg-gradient-to-r ${webinar.bgColor} border-2 ${submitted && selectedWebinar === webinar.id ? 'border-green-400' : 'border-gray-200'} shadow-xl overflow-hidden`}>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* COLUMNA IZQUIERDA: INFO DEL WEBINAR */}
                  <div className="md:col-span-2 p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-4 bg-gradient-to-br ${webinar.color} rounded-lg flex-shrink-0`}>
                        <webinar.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{webinar.titulo}</h3>
                        <p className="text-gray-700 mb-4">{webinar.descripcion}</p>
                        
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-5 w-5 text-indigo-600" />
                            <span className="font-semibold">{webinar.fecha}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="h-5 w-5 text-indigo-600" />
                            <span className="font-semibold">{webinar.hora}</span>
                          </div>
                        </div>

                        <div className="bg-white/60 rounded-lg p-4 mb-4">
                          <p className="text-sm font-semibold text-gray-800 mb-1">Imparte:</p>
                          <p className="font-bold text-gray-900">{webinar.instructor}</p>
                          <p className="text-sm text-gray-600">{webinar.cargo}</p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-800 mb-2">Temas que cubriremos:</p>
                          <ul className="space-y-1">
                            {webinar.temas.map((tema, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{tema}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: FORMULARIO */}
                  <div className="bg-white/80 backdrop-blur-sm p-6 border-l border-gray-200">
                    {submitted && selectedWebinar === webinar.id ? (
                      <div className="text-center space-y-4">
                        <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto">
                          <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h4 className="text-xl font-bold text-green-700">¡Registro Confirmado!</h4>
                        <p className="text-sm text-gray-700">
                          Hemos enviado un email de confirmación a <strong>{formData.email}</strong> con el enlace del webinar.
                        </p>
                        <Alert className="bg-indigo-50 border-indigo-200">
                          <Sparkles className="h-4 w-4 text-indigo-600" />
                          <AlertDescription className="text-indigo-800 text-sm">
                            Como regalo por registrarte, te enviamos un código de descuento adicional para INMOVA.
                          </AlertDescription>
                        </Alert>
                        <Button 
                          onClick={resetForm}
                          variant="outline" 
                          className="w-full"
                        >
                          Registrarse en Otro Webinar
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={(e) => handleSubmit(e, webinar.id)} className="space-y-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-4">Reserva Tu Plaza</h4>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`nombre-${webinar.id}`} className="text-sm font-medium">Nombre Completo *</Label>
                          <Input 
                            id={`nombre-${webinar.id}`}
                            type="text" 
                            placeholder="Juan Pérez"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            required
                            className="bg-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`email-${webinar.id}`} className="text-sm font-medium">Email *</Label>
                          <Input 
                            id={`email-${webinar.id}`}
                            type="email" 
                            placeholder="juan@ejemplo.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                            className="bg-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`empresa-${webinar.id}`} className="text-sm font-medium">Empresa (opcional)</Label>
                          <Input 
                            id={`empresa-${webinar.id}`}
                            type="text" 
                            placeholder="Mi Inmobiliaria S.L."
                            value={formData.empresa}
                            onChange={(e) => handleInputChange('empresa', e.target.value)}
                            className="bg-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`telefono-${webinar.id}`} className="text-sm font-medium">Teléfono (opcional)</Label>
                          <Input 
                            id={`telefono-${webinar.id}`}
                            type="tel" 
                            placeholder="+34 600 123 456"
                            value={formData.telefono}
                            onChange={(e) => handleInputChange('telefono', e.target.value)}
                            className="bg-white"
                          />
                        </div>

                        <Button 
                          type="submit"
                          className={`w-full bg-gradient-to-r ${webinar.color} hover:opacity-90 text-white font-semibold h-12`}
                          disabled={loading}
                        >
                          {loading ? 'Registrando...' : 'Reservar Plaza Gratis'}
                          {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                        </Button>

                        <p className="text-xs text-gray-500 text-center">
                          Al registrarte, aceptas recibir comunicaciones sobre este webinar y ofertas de INMOVA.
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BONUS */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-yellow-400 text-gray-900 border-0 text-base px-6 py-2">
            <Star className="h-4 w-4 mr-2" />
            Bonus Exclusivo
          </Badge>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Asistentes Obtienen Acceso Prioritario
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Si asistes al webinar completo, recibirás:
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="pt-6 text-center">
                <div className="bg-yellow-400 text-gray-900 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                  15%
                </div>
                <p className="font-semibold">Descuento adicional en INMOVA</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="pt-6 text-center">
                <Euro className="h-12 w-12 text-yellow-300 mx-auto mb-3" />
                <p className="font-semibold">Plantillas y recursos descargables</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 text-yellow-300 mx-auto mb-3" />
                <p className="font-semibold">Consultoría 1-a-1 de 30 min gratis</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 bg-slate-900 border-t border-gray-800">
        <div className="container mx-auto text-center">
          <Link href="/landing" className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-indigo-400" />
            <span className="text-xl font-bold text-white">INMOVA</span>
          </Link>
          <p className="text-gray-400 text-sm mb-4">
            La plataforma PropTech Multi-Vertical más completa del mercado
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <Link href="/landing/legal/privacidad" className="hover:text-gray-300">Privacidad</Link>
            <Link href="/landing/legal/terminos" className="hover:text-gray-300">Términos</Link>
            <Link href="/landing/contacto" className="hover:text-gray-300">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
