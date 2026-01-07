import React, { useEffect } from "react";

/**
 * Simple toast component. Dismisses itself automatically unless `persistent` is true.
 */
export default function Toast({ toast, onDismiss }) {
  const { id, type, message, persistent } = toast;

  useEffect(() => {
    if (persistent) return undefined;
    const t = window.setTimeout(() => onDismiss(id), 3500);
    return () => window.clearTimeout(t);
  }, [id, onDismiss, persistent]);

  return (
    <div className={`toast toast--${type}`} role="status" aria-live="polite">
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={() => onDismiss(id)} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  );
}
