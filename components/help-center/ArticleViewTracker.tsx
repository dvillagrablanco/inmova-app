'use client';

import { useEffect } from 'react';

interface ArticleViewTrackerProps {
  articleId: string;
}

/**
 * Componente invisible que registra una vista al montar.
 * Fire-and-forget — no bloquea renderizado.
 */
export function ArticleViewTracker({ articleId }: ArticleViewTrackerProps) {
  useEffect(() => {
    fetch('/api/help/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
    }).catch(() => {
      // Silencioso
    });
  }, [articleId]);

  return null;
}
