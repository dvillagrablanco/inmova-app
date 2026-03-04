'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Rows3, Rows4 } from 'lucide-react';

export function useCompactMode(key: string = 'compact-mode') {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored === 'true') setCompact(true);
  }, [key]);
  const toggle = () => {
    const next = !compact;
    setCompact(next);
    localStorage.setItem(key, String(next));
  };
  return { compact, toggle };
}

export function CompactModeToggle({
  compact,
  onToggle,
}: {
  compact: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      title={compact ? 'Vista normal' : 'Vista compacta'}
    >
      {compact ? <Rows3 className="h-4 w-4" /> : <Rows4 className="h-4 w-4" />}
    </Button>
  );
}
