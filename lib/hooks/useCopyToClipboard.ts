'use client';

import { useState } from 'react';
import { copyToClipboard } from '@/lib/utils';

interface UseCopyToClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  isCopied: boolean;
  error: Error | null;
}

export function useCopyToClipboard(): UseCopyToClipboardReturn {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = async (text: string): Promise<boolean> => {
    try {
      const success = await copyToClipboard(text);
      setIsCopied(success);
      setError(success ? null : new Error('Failed to copy'));

      if (success) {
        setTimeout(() => setIsCopied(false), 2000);
      }

      return success;
    } catch (err) {
      setError(err as Error);
      setIsCopied(false);
      return false;
    }
  };

  return { copy, isCopied, error };
}
