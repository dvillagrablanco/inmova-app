'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Heart,
  Share2,
  MoreVertical,
  Flag,
  Trash2,
  Pin,
  Eye,
  EyeOff,
  Plus,
  Send,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Post {
  id: string;
  tipo: string;
  contenido: string;
  multimedia: string[];
  likes: number;
  likedBy: string[];
  hashtags: string[];
  visibilidad: string;
  destacado: boolean;
  moderado: boolean;
  createdAt: string;
  author?: {
    id: string;
    nombreCompleto: string;
  };
  building?: {
    id: string;
    nombre: string;
  };
  comentarios: any[];
}

export default function SocialFeedPanel() {
  const { canModerateCommunity, canManageSocialPosts } = usePermissions();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchPosts = async (loadMore = false) => {
    try {
      const currentOffset = loadMore ? offset : 0;
      const res = await fetch(`/api/community/posts?limit=20&offset=${currentOffset}`);
      if (res.ok) {
        const data = await res.json();
        if (loadMore) {
          setPosts([...posts, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setHasMore(data.hasMore);
        setOffset(currentOffset + data.posts.length);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Error al cargar posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenido: newPostContent,
          tipo: 'announcement',
        }),
      });

      if (res.ok) {
        toast.success('Post publicado');
        setShowCreateDialog(false);
        setNewPostContent('');
        setOffset(0);
        fetchPosts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al publicar');
      }
    } catch (error) {
      toast.error('Error al publicar');
    }
  };

  const handleModeratePost = async (postId: string, action: 'hide' | 'delete' | 'feature') => {
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/community/posts/${postId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast.success('Post eliminado');
          setPosts(posts.filter((p) => p.id !== postId));
        }
      } else {
        const res = await fetch(`/api/community/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moderado: action === 'hide',
            destacado: action === 'feature',
          }),
        });
        if (res.ok) {
          toast.success(action === 'hide' ? 'Post ocultado' : 'Post destacado');
          fetchPosts();
        }
      }
    } catch (error) {
      toast.error('Error al moderar post');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Post Button */}
      {canManageSocialPosts && (
        <Card>
          <CardContent className="pt-4">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors">
                  <Avatar>
                    <AvatarFallback>CM</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-muted-foreground text-sm bg-muted px-4 py-2 rounded-full">
                    Publica un mensaje para la comunidad...
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Crear Publicación</DialogTitle>
                  <DialogDescription>Comparte algo con la comunidad</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="¿Qué quieres compartir?"
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" disabled>
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Imagen
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Publicar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay publicaciones</h3>
              <p className="text-muted-foreground">
                Sé el primero en compartir algo con la comunidad.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className={post.destacado ? 'border-primary border-2' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {post.author?.nombreCompleto?.slice(0, 2).toUpperCase() || 'CM'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">
                        {post.author?.nombreCompleto || 'Community Manager'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                        {post.building && ` · ${post.building.nombre}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.destacado && (
                      <Badge variant="secondary">
                        <Pin className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                    {canModerateCommunity && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleModeratePost(post.id, 'feature')}>
                            <Pin className="h-4 w-4 mr-2" />
                            {post.destacado ? 'Quitar destacado' : 'Destacar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModeratePost(post.id, 'hide')}>
                            {post.moderado ? (
                              <>
                                <Eye className="h-4 w-4 mr-2" /> Mostrar
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" /> Ocultar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleModeratePost(post.id, 'delete')}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm whitespace-pre-wrap">{post.contenido}</p>
                {post.multimedia?.length > 0 && (
                  <div className="mt-3 grid gap-2">
                    {post.multimedia.map((url, i) => (
                      <img key={i} src={url} alt="" className="rounded-lg max-h-96 object-cover" />
                    ))}
                  </div>
                )}
                {post.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.hashtags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-3">
                <div className="flex items-center justify-between w-full text-muted-foreground">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs">{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs">{post.comentarios?.length || 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => fetchPosts(true)}>
                Cargar más
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
