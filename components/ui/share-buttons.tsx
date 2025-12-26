/**
 * Share Buttons Component
 * Botones optimizados para compartir en redes sociales
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Link as LinkIcon,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  variant?: 'inline' | 'dropdown';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Copia texto al portapapeles
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

/**
 * Componente principal de botones para compartir
 */
export function ShareButtons({
  url,
  title,
  description = '',
  hashtags = [],
  variant = 'inline',
  className,
  size = 'md',
}: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const hashtagsStr = hashtags.map((tag) => `#${tag}`).join(' ');

  const handleCopyLink = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      toast.success('Enlace copiado al portapapeles');
    } else {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:bg-blue-600',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${hashtags.join(',')}`,
      color: 'hover:bg-sky-500',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'hover:bg-blue-700',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:bg-green-600',
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`,
      color: 'hover:bg-gray-600',
    },
  ];

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  // Versión con botones inline
  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {shareLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Button
              key={link.name}
              variant="outline"
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
              onClick={() => handleShare(link.url)}
              className={cn(
                'transition-colors',
                link.color,
                size === 'sm' && 'h-8 w-8 p-0',
                size === 'lg' && 'h-12 w-12 p-0'
              )}
              aria-label={`Compartir en ${link.name}`}
            >
              <Icon
                className={cn(size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5')}
              />
            </Button>
          );
        })}
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
          onClick={handleCopyLink}
          className={cn(
            'transition-colors hover:bg-primary hover:text-primary-foreground',
            size === 'sm' && 'h-8 w-8 p-0',
            size === 'lg' && 'h-12 w-12 p-0'
          )}
          aria-label="Copiar enlace"
        >
          <LinkIcon
            className={cn(size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5')}
          />
        </Button>
      </div>
    );
  }

  // Versión con dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
          className={className}
        >
          <Share2
            className={cn(
              'mr-2',
              size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
            )}
          />
          Compartir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Compartir en</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {shareLinks.map((link) => {
          const Icon = link.icon;
          return (
            <DropdownMenuItem key={link.name} onClick={() => handleShare(link.url)}>
              <Icon className="mr-2 h-4 w-4" />
              {link.name}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyLink}>
          <LinkIcon className="mr-2 h-4 w-4" />
          Copiar enlace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Botón simple para compartir (usa Web Share API si está disponible)
 */
export function SimpleShareButton({
  url,
  title,
  description,
  className,
  size = 'md',
}: ShareButtonsProps) {
  const handleShare = async () => {
    // Intentar usar Web Share API nativa
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        toast.success('Compartido exitosamente');
      } catch (error) {
        // Usuario canceló o error
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: copiar al portapapeles
      const success = await copyToClipboard(url);
      if (success) {
        toast.success('Enlace copiado al portapapeles');
      } else {
        toast.error('No se pudo compartir');
      }
    }
  };

  return (
    <Button
      variant="outline"
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
      onClick={handleShare}
      className={className}
    >
      <Share2
        className={cn('mr-2', size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5')}
      />
      Compartir
    </Button>
  );
}
