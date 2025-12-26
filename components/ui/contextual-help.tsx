'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HelpCircle, X, BookOpen, Lightbulb, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HelpSection {
  title: string;
  content: string;
  tips?: string[];
}

interface ContextualHelpProps {
  module: string;
  title: string;
  description: string;
  sections: HelpSection[];
  quickActions?: { label: string; action: () => void }[];
}

export function ContextualHelp({
  module,
  title,
  description,
  sections,
  quickActions,
}: ContextualHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-muted-foreground hover:text-primary"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Ayuda</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{title}</DialogTitle>
              <DialogDescription className="mt-2">{description}</DialogDescription>
            </div>
            <Badge variant="secondary" className="ml-4">
              {module}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Secciones de ayuda */}
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{section.content}</p>
                {section.tips && section.tips.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <span>Consejos:</span>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {section.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="text-sm text-muted-foreground list-disc">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Acciones rápidas */}
          {quickActions && quickActions.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        action.action();
                        setOpen(false);
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => setOpen(false)}>Entendido</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
