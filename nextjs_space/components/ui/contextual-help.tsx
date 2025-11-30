'use client';

import { useState } from 'react';
import { HelpCircle, X, Book, MessageCircle, Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HelpResource {
  title: string;
  description: string;
  type: 'doc' | 'video' | 'tutorial';
  link?: string;
}

interface ContextualHelpProps {
  title: string;
  resources: HelpResource[];
  quickTips?: string[];
}

export function ContextualHelp({ title, resources, quickTips = [] }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-24 right-6 h-12 px-4 rounded-full shadow-lg border-2 border-indigo-200 hover:border-indigo-400 bg-white z-40"
      >
        <HelpCircle className="h-4 w-4 mr-2 text-indigo-600" />
        <span className="text-sm font-medium">Ayuda</span>
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-24 right-6 w-96 shadow-2xl border-2 border-indigo-200 z-40 animate-in slide-in-from-bottom-4">
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardTitle className="text-lg pr-8">Ayuda: {title}</CardTitle>
        <CardDescription>Recursos y tips para esta sección</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recursos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recursos">Recursos</TabsTrigger>
            <TabsTrigger value="tips">Tips Rápidos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recursos" className="space-y-3 mt-4">
            {resources.map((resource, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                onClick={() => resource.link && window.open(resource.link, '_blank')}
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50">
                  {resource.type === 'doc' && <Book className="h-4 w-4 text-indigo-600" />}
                  {resource.type === 'video' && <Video className="h-4 w-4 text-violet-600" />}
                  {resource.type === 'tutorial' && <MessageCircle className="h-4 w-4 text-pink-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                    {resource.link && <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{resource.description}</p>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-2 mt-4">
            {quickTips.length > 0 ? (
              quickTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50">
                  <Badge className="mt-0.5 bg-indigo-600 text-white">Tip {index + 1}</Badge>
                  <p className="text-sm text-gray-700 flex-1">{tip}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay tips disponibles para esta sección</p>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            onClick={() => window.open('/landing/contacto', '_blank')}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contactar Soporte
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}