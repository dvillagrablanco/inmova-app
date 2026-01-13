'use client';

/**
 * Componente Cliente de la Landing de Partner
 *
 * Renderiza la landing personalizada con el branding del partner
 * y permite interacción (formularios, CTAs, etc.)
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  Star,
  ArrowRight,
  Building2,
  Shield,
  TrendingUp,
  Users,
  Sparkles,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  PartnerTheme,
  PartnerLanding,
  PartnerServiceData,
  PartnerPromotionData,
  PartnerBannerData,
} from '@/lib/partner-branding-service';

interface PartnerData {
  theme: PartnerTheme;
  landing: PartnerLanding;
  services: PartnerServiceData[];
  promotions: PartnerPromotionData[];
  banners: PartnerBannerData[];
}

interface Props {
  data: PartnerData;
  slug: string;
}

export default function PartnerLandingClient({ data, slug }: Props) {
  const { theme, landing, services, promotions, banners } = data;
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: '',
  });

  // CSS personalizado basado en el tema del partner
  const customStyles = `
    :root {
      --partner-primary: ${theme.colors.primary};
      --partner-secondary: ${theme.colors.secondary};
      --partner-accent: ${theme.colors.accent};
    }
  `;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/partners/public/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactForm,
          partnerSlug: slug,
          origen: 'landing_contacto',
        }),
      });

      if (response.ok) {
        toast.success('¡Mensaje enviado! Te contactaremos pronto.');
        setIsContactDialogOpen(false);
        setContactForm({ nombre: '', email: '', telefono: '', mensaje: '' });
      } else {
        toast.error('Error al enviar mensaje');
      }
    } catch (error) {
      toast.error('Error al enviar mensaje');
    }
  };

  const handleRegister = () => {
    // Redirigir al registro con el código del partner
    window.location.href = `/register?ref=${slug}`;
  };

  // Obtener banner hero si existe
  const heroBanner = banners.find((b) => b.posicion === 'hero');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                {theme.logo ? (
                  <Image
                    src={theme.logo}
                    alt={theme.nombre}
                    width={120}
                    height={40}
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-bold text-xl">{theme.nombre}</span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setIsContactDialogOpen(true)}>
                  Contacto
                </Button>
                <Button
                  onClick={handleRegister}
                  style={{ backgroundColor: theme.colors.primary }}
                  className="text-white hover:opacity-90"
                >
                  {landing.hero.cta}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section
          className="relative py-20 lg:py-32 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.secondary}15)`,
          }}
        >
          {heroBanner && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: `url(${heroBanner.imagenUrl})` }}
            />
          )}

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                  style={{ color: theme.colors.text }}
                >
                  {landing.hero.title}
                </h1>

                {landing.hero.subtitle && (
                  <p className="text-xl text-gray-600">{landing.hero.subtitle}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={handleRegister}
                    style={{ backgroundColor: theme.colors.primary }}
                    className="text-white hover:opacity-90 text-lg px-8"
                  >
                    {landing.hero.cta}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  {landing.secondaryCta && (
                    <Button size="lg" variant="outline" className="text-lg px-8">
                      {landing.secondaryCta}
                    </Button>
                  )}
                </div>

                {/* Trust badges */}
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" style={{ color: theme.colors.primary }} />
                    <span className="text-sm text-gray-600">100% Seguro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" style={{ color: theme.colors.primary }} />
                    <span className="text-sm text-gray-600">+10,000 usuarios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">4.9/5 valoración</span>
                  </div>
                </div>
              </div>

              {landing.hero.image && (
                <div className="relative">
                  <Image
                    src={landing.hero.image}
                    alt="Hero"
                    width={600}
                    height={400}
                    className="rounded-2xl shadow-2xl"
                  />
                </div>
              )}

              {landing.hero.video && (
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="rounded-full w-20 h-20"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Play className="h-8 w-8 text-white ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        {landing.valueProposition && (
          <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed">
                {landing.valueProposition}
              </p>
            </div>
          </section>
        )}

        {/* Benefits */}
        {landing.benefits && landing.benefits.length > 0 && (
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4" style={{ color: theme.colors.text }}>
                  ¿Por qué elegirnos?
                </h2>
                <p className="text-xl text-gray-600">
                  Descubre las ventajas de trabajar con nosotros
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {landing.benefits.map((benefit, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${theme.colors.primary}15` }}
                      >
                        <Sparkles className="h-7 w-7" style={{ color: theme.colors.primary }} />
                      </div>
                      <CardTitle>{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Services */}
        {landing.showServices && services.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4" style={{ color: theme.colors.text }}>
                  Nuestros Servicios
                </h2>
                <p className="text-xl text-gray-600">
                  Servicios complementarios para ayudarte en tu gestión
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    className={`hover:shadow-lg transition-shadow ${service.destacado ? 'ring-2 ring-offset-2' : ''}`}
                    style={service.destacado ? { borderColor: theme.colors.primary } : {}}
                  >
                    <CardHeader>
                      {service.destacado && (
                        <Badge
                          className="w-fit mb-2"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          Destacado
                        </Badge>
                      )}
                      <CardTitle>{service.nombre}</CardTitle>
                      <CardDescription>{service.descripcionCorta}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {service.precio.desde && (
                        <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                          Desde €{service.precio.desde}
                          <span className="text-sm font-normal text-gray-500">
                            /{service.precio.tipo}
                          </span>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        style={{ backgroundColor: theme.colors.primary }}
                        onClick={() => setIsContactDialogOpen(true)}
                      >
                        {service.cta.texto}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Promotions */}
        {promotions.length > 0 && (
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <Badge className="mb-4" style={{ backgroundColor: theme.colors.accent }}>
                  Ofertas Especiales
                </Badge>
                <h2 className="text-3xl font-bold mb-4" style={{ color: theme.colors.text }}>
                  Promociones Activas
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {promotions.map((promo) => (
                  <Card
                    key={promo.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {promo.imagenUrl && (
                      <div className="h-48 relative">
                        <Image
                          src={promo.imagenUrl}
                          alt={promo.titulo}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{promo.titulo}</CardTitle>
                      {promo.descuento && (
                        <div className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
                          {promo.descuento.tipo === 'porcentaje'
                            ? `-${promo.descuento.valor}%`
                            : `-€${promo.descuento.valor}`}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 text-sm">{promo.descripcion}</p>
                      {promo.descuento?.codigo && (
                        <div className="bg-gray-100 p-3 rounded-lg text-center">
                          <span className="text-xs text-gray-500">Código:</span>
                          <span className="block font-mono font-bold text-lg">
                            {promo.descuento.codigo}
                          </span>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        style={{ backgroundColor: theme.colors.primary }}
                        onClick={handleRegister}
                      >
                        {promo.cta.texto}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        {landing.showTestimonials && landing.testimonials && landing.testimonials.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4" style={{ color: theme.colors.text }}>
                  Lo que dicen nuestros clientes
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {landing.testimonials.map((testimonial, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                      <div className="flex items-center gap-3">
                        {testimonial.photo ? (
                          <Image
                            src={testimonial.photo}
                            alt={testimonial.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: theme.colors.primary }}
                          >
                            {testimonial.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-gray-500">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {landing.showFaq && landing.faq && landing.faq.length > 0 && (
          <section className="py-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4" style={{ color: theme.colors.text }}>
                  Preguntas Frecuentes
                </h2>
              </div>

              <div className="space-y-4">
                {landing.faq.map((item, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {item.question}
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Final */}
        <section
          className="py-20"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">¿Listo para empezar?</h2>
            <p className="text-xl text-white/90 mb-8">
              Únete a miles de usuarios que ya confían en nosotros
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleRegister}
                className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8"
              >
                {landing.primaryCta}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
                onClick={() => setIsContactDialogOpen(true)}
              >
                Contactar
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Logo y descripción */}
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  {theme.logo ? (
                    <Image
                      src={theme.logoDark || theme.logo}
                      alt={theme.nombre}
                      width={120}
                      height={40}
                      className="h-10 w-auto object-contain brightness-0 invert"
                    />
                  ) : (
                    <span className="font-bold text-xl">{theme.nombre}</span>
                  )}
                </div>
                {theme.footer.text && <p className="text-gray-400 mb-4">{theme.footer.text}</p>}
                {/* Social links */}
                <div className="flex gap-4">
                  {theme.social.linkedin && (
                    <a
                      href={theme.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white"
                    >
                      LinkedIn
                    </a>
                  )}
                  {theme.social.twitter && (
                    <a
                      href={theme.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white"
                    >
                      Twitter
                    </a>
                  )}
                  {theme.social.instagram && (
                    <a
                      href={theme.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              </div>

              {/* Contacto */}
              <div>
                <h4 className="font-semibold mb-4">Contacto</h4>
                <ul className="space-y-2 text-gray-400">
                  {theme.contact.email && (
                    <li className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {theme.contact.email}
                    </li>
                  )}
                  {theme.contact.phone && (
                    <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {theme.contact.phone}
                    </li>
                  )}
                  {theme.contact.address && (
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {theme.contact.address}
                    </li>
                  )}
                </ul>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-semibold mb-4">Enlaces</h4>
                <ul className="space-y-2 text-gray-400">
                  {theme.footer.links?.map((link, index) => (
                    <li key={index}>
                      <a href={link.url} className="hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <Link href="/terminos" className="hover:text-white">
                      Términos y Condiciones
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacidad" className="hover:text-white">
                      Política de Privacidad
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2026 {theme.nombre}. Todos los derechos reservados.
              </p>
              <p className="text-gray-500 text-sm">
                Powered by{' '}
                <a
                  href="https://inmovaapp.com"
                  className="text-gray-400 hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Inmova
                </a>
              </p>
            </div>
          </div>
        </footer>

        {/* Contact Dialog */}
        <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Contactar</DialogTitle>
              <DialogDescription>
                Déjanos tus datos y te contactaremos lo antes posible
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={contactForm.nombre}
                  onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={contactForm.telefono}
                  onChange={(e) => setContactForm({ ...contactForm, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mensaje">Mensaje</Label>
                <Textarea
                  id="mensaje"
                  value={contactForm.mensaje}
                  onChange={(e) => setContactForm({ ...contactForm, mensaje: e.target.value })}
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: theme.colors.primary }}
              >
                Enviar mensaje
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
