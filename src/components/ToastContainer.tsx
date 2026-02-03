import React from 'react';
import { Toast } from '@hooks/useToast';

interface Props {
  toasts: Toast[];
}

/**
 * Renders toast notifications on the screen.
 */
const ToastContainer: React.FC<Props> = ({ toasts }) => {
  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;