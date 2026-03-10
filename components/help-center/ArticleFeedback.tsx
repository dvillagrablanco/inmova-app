'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ArticleFeedback() {
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-lg border bg-muted/50 p-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          ¡Gracias por tu feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-3 text-sm font-medium">¿Te resultó útil este artículo?</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFeedback}
          className="gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          Sí
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFeedback}
          className="gap-2"
        >
          <ThumbsDown className="h-4 w-4" />
          No
        </Button>
      </div>
    </div>
  );
}
