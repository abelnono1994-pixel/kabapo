'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { type FirestoreError } from 'firebase/firestore';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It displays a user-friendly toast notification instead of throwing an exception,
 * preventing the application from crashing.
 * 
 * Update: Now silences errors for read operations (get/list) to prevent 
 * annoying popups during normal navigation or background data checks.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: any) => {
      // Determine if this is a permission error from its message or structure
      const isPermissionError = 
        error?.message?.includes('Missing or insufficient permissions') || 
        error?.name === 'FirebaseError' ||
        error instanceof FirestorePermissionError;

      // Extract the operation method (list, get, create, update, delete)
      // Standard FirestoreError doesn't always have this, but our custom class does.
      const method = error.request?.method || error.operation;

      // PROFESSIONAL FILTER: 
      // We don't want to show a scary red toast for simple read checks that fail 
      // (e.g., trying to see private data while logged out). The UI handles this via empty states.
      // We ONLY show the toast for mutation failures (Save, Delete, Create) which represent a failed user intent.
      if (isPermissionError && (method === 'list' || method === 'get')) {
        // Silently log to console for developers but don't bother the user.
        console.warn(`[Firebase] Silent permission suppression for '${method}' at path: ${error.request?.path || 'unknown'}`);
        return;
      }

      // For all other errors, or permission errors on writes, show the toast.
      toast({
        variant: "destructive",
        title: "Action impossible",
        description: "Vous n'avez pas les autorisations nécessaires ou une erreur technique est survenue.",
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  // This component renders nothing.
  return null;
}