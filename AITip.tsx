'use client';

import { useEffect, useState, useMemo } from 'react';
import { suggestTargetedMessage } from '@/ai/flows/suggest-targeted-messages';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

type AITipProps = {
  userType: string;
  serviceRequested: string;
  pastMessages: string[];
  onNewMessage: (message: string) => void;
};

export function AITip({
  userType,
  serviceRequested,
  pastMessages,
  onNewMessage,
}: AITipProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const memoizedServiceRequested = useMemo(() => serviceRequested, [serviceRequested]);

  useEffect(() => {
    if (memoizedServiceRequested) {
      setLoading(true);
      setSuggestion(null);

      const timer = setTimeout(() => {
        suggestTargetedMessage({
          userType,
          serviceRequested: memoizedServiceRequested,
          pastMessages,
        })
          .then((output) => {
            if (output.isAppropriate && output.message) {
              setSuggestion(output.message);
              onNewMessage(output.message);
            }
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      }, 1000); // Debounce API call

      return () => clearTimeout(timer);
    }
  }, [memoizedServiceRequested, userType, pastMessages, onNewMessage]);

  if (!serviceRequested) return null;

  if (loading) {
    return (
      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!suggestion) {
    return null;
  }

  return (
    <Alert className="mt-6 animate-fade-in bg-primary/10 border-primary/20 transition-all">
      <Lightbulb className="h-4 w-4 text-primary" />
      <AlertTitle className="font-bold text-primary">
        Conseil du chef !
      </AlertTitle>
      <AlertDescription className="text-primary/90">
        {suggestion}
      </AlertDescription>
    </Alert>
  );
}
