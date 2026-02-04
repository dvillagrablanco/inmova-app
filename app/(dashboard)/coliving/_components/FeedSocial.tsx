'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import logger from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Post {
  id: string;
  tipo: string;
  contenido: string;
  imagenes?: string[];
  likes: string[];
  comentarios: Array<{ tenantId: string; texto: string; fecha: string }>;
  createdAt: string;
  profile: {
    tenant: {
      nombreCompleto: string;
    };
  };
}

export default function FeedSocial() {
  const { data: session } = useSession() || {};
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoPost, setNuevoPost] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  useEffect(() => {
    cargarFeed();
  }, []);

  const cargarFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/coliving/feed?companyId=${session?.user?.companyId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      logger.error('Error cargando feed:', error);
      toast.error('Error al cargar feed');
    } finally {
      setLoading(false);
    }
  };

  const crearPost = async () => {
    if (!nuevoPost.trim()) return;

    try {
      setCreatingPost(true);
      const res = await fetch('/api/coliving/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: session?.user?.companyId,
          profileId: session?.user?.profileId, // Asumiendo que el perfil está vinculado
          tipo: 'post',
          contenido: nuevoPost,
        }),
      });

      if (res.ok) {
        toast.success('Publicación creada');
        setNuevoPost('');
        cargarFeed();
      } else {
        toast.error('Error al crear publicación');
      }
    } catch (error) {
      logger.error('Error creando post:', error);
      toast.error('Error al crear publicación');
    } finally {
      setCreatingPost(false);
    }
  };

  const darLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/coliving/feed/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: session?.user?.tenantId,
        }),
      });

      if (res.ok) {
        cargarFeed();
      }
    } catch (error) {
      logger.error('Error dando like:', error);
    }
  };

  const handleComment = () => {
    toast.info('Comentarios en desarrollo');
  };

  const handleShare = () => {
    toast.success('Enlace compartido');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Crear nueva publicación */}
      <Card>
        <CardHeader>
          <CardTitle>¿Qué quieres compartir?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Comparte tus pensamientos, logros o preguntas con la comunidad..."
            value={nuevoPost}
            onChange={(e) => setNuevoPost(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={crearPost} disabled={!nuevoPost.trim() || creatingPost}>
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed de publicaciones */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No hay publicaciones aún. ¡Sé el primero en compartir!
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {post.profile.tenant.nombreCompleto
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{post.profile.tenant.nombreCompleto}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 whitespace-pre-wrap">{post.contenido}</p>

                {/* Imagenes */}
                {post.imagenes && post.imagenes.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.imagenes.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <Image
                          src={img}
                          alt={`Imagen ${idx + 1} de ${post.imagenes?.length || 0} en la publicación de ${post.profile?.tenant?.nombreCompleto || 'residente'}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 300px"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => darLike(post.id)}
                    className="gap-2"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        post.likes?.includes(session?.user?.tenantId || '')
                          ? 'fill-red-500 text-red-500'
                          : ''
                      }`}
                    />
                    <span>{post.likes?.length || 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={handleComment}>
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comentarios?.length || 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                    Compartir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
