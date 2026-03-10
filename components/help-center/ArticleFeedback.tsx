'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArticleFeedbackProps {
  articleId: string;
}

export function ArticleFeedback({ articleId }: ArticleFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (helpful: boolean) => {
    setSubmitted(true);
    try {
      await fetch('/api/help/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, helpful }),
      });
    } catch {
      // Fire-and-forget — no bloquear UX por error de tracking
    }
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
          onClick={() => handleFeedback(true)}
          className="gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          Sí
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(false)}
          className="gap-2"
        >
          <ThumbsDown className="h-4 w-4" />
          No
        </Button>
      </div>
    </div>
  );
}
