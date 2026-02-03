import { useState, useCallback } from 'react';

export interface Toast {
  id: number;
  message: string;
}

/**
 * Hook to manage toast notifications.
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    // Remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);
  return { toasts, showToast };
}