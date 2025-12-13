/**
 * Social Preview Component
 * Muestra cómo se verá el contenido cuando se comparta en redes sociales
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/lazy-tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Linkedin, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export interface SocialPreviewProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  siteName?: string;
  className?: string;
}

/**
 * Componente principal de preview social
 */
export function SocialPreview({
  title,
  description,
  url,
  image = '/inmova-og-image.jpg',
  siteName = 'INMOVA',
  className,
}: SocialPreviewProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Truncar texto para simulación
  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const domain = new URL(url).hostname;

  if (!isVisible) {
    return (
      <div className={cn('flex justify-center', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Vista previa de redes sociales
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Vista Previa en Redes Sociales</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 p-0"
          aria-label="Ocultar preview"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="facebook" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="facebook" className="gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="twitter" className="gap-2">
              <Twitter className="h-4 w-4" />
              Twitter
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </TabsTrigger>
          </TabsList>

          {/* Facebook Preview */}
          <TabsContent value="facebook" className="mt-4">
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              {/* Image */}
              <div className="relative aspect-[1.91/1] w-full bg-gray-100">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {/* Content */}
              <div className="p-3 space-y-1">
                <div className="text-xs text-gray-500 uppercase">{domain}</div>
                <h3 className="font-semibold text-gray-900 line-clamp-2">{truncate(title, 100)}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{truncate(description, 200)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              ℹ️ Cómo se verá cuando se comparta en Facebook
            </p>
          </TabsContent>

          {/* Twitter Preview */}
          <TabsContent value="twitter" className="mt-4">
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {/* Image */}
              <div className="relative aspect-[2/1] w-full bg-gray-100">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {/* Content */}
              <div className="p-3 space-y-1">
                <h3 className="font-semibold text-gray-900 text-[15px] line-clamp-1">
                  {truncate(title, 70)}
                </h3>
                <p className="text-[15px] text-gray-600 line-clamp-2">{truncate(description, 150)}</p>
                <div className="flex items-center gap-1 text-[13px] text-gray-500 pt-1">
                  <ExternalLink className="h-3 w-3" />
                  {domain}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              ℹ️ Cómo se verá cuando se comparta en Twitter/X
            </p>
          </TabsContent>

          {/* LinkedIn Preview */}
          <TabsContent value="linkedin" className="mt-4">
            <div className="rounded border border-gray-300 bg-white overflow-hidden shadow-sm">
              {/* Image */}
              <div className="relative aspect-[1.91/1] w-full bg-gray-100">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {/* Content */}
              <div className="p-3 bg-gray-50 space-y-1">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                  {truncate(title, 200)}
                </h3>
                <div className="text-xs text-gray-500">{domain}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              ℹ️ Cómo se verá cuando se comparta en LinkedIn
            </p>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5">
              SEO
            </Badge>
            <div className="space-y-1 text-xs">
              <p className="font-medium">Optimización para Compartir</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Título optimizado para búsquedas</li>
                <li>Descripción atractiva y relevante</li>
                <li>Imagen de alta calidad (1200x630px)</li>
                <li>Meta-tags Open Graph y Twitter Cards activos</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente compacto de preview
 */
export function SocialPreviewCompact({
  title,
  description,
  url,
  image = '/inmova-og-image.jpg',
  className,
}: SocialPreviewProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative h-20 w-32 flex-shrink-0 rounded overflow-hidden bg-gray-100">
          <Image src={image} alt={title} fill className="object-cover" unoptimized />
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2 mb-1">{title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] h-5">
              <Facebook className="h-3 w-3 mr-1" />
              FB
            </Badge>
            <Badge variant="outline" className="text-[10px] h-5">
              <Twitter className="h-3 w-3 mr-1" />
              X
            </Badge>
            <Badge variant="outline" className="text-[10px] h-5">
              <Linkedin className="h-3 w-3 mr-1" />
              IN
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
