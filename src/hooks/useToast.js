import { useState, useCallback } from 'react';
/**
 * Hook to manage toast notifications.
 */
export function useToast() {
    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((message) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message }]);
        // Remove after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);
    return { toasts, showToast };
}
