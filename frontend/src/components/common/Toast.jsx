import { createContext, useContext, useCallback, useState } from 'react';

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'error') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div
                aria-live="polite"
                aria-atomic="false"
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    pointerEvents: 'none',
                }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="alert"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.875rem 1.25rem',
                            borderRadius: '0.75rem',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#F0EEE8',
                            background: toast.type === 'error'
                                ? 'rgba(232, 92, 92, 0.95)'
                                : toast.type === 'success'
                                ? 'rgba(34, 197, 94, 0.95)'
                                : 'rgba(232, 168, 56, 0.95)',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            pointerEvents: 'auto',
                            cursor: 'pointer',
                            animation: 'slideInUp 0.25s ease',
                            maxWidth: '380px',
                        }}
                        onClick={() => dismiss(toast.id)}
                    >
                        <span>
                            {toast.type === 'error' ? '❌' : toast.type === 'success' ? '✅' : 'ℹ️'}
                        </span>
                        <span style={{ flex: 1 }}>{toast.message}</span>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}
