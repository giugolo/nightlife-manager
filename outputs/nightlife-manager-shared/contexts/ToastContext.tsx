import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const toastConfig = {
    success: {
        icon: CheckCircle,
        bg: 'bg-emerald-600',
        border: 'border-emerald-500',
        duration: 2500,
    },
    error: {
        icon: XCircle,
        bg: 'bg-red-600',
        border: 'border-red-500',
        duration: 4000,
    },
    warning: {
        icon: AlertCircle,
        bg: 'bg-amber-600',
        border: 'border-amber-500',
        duration: 3500,
    },
    info: {
        icon: Info,
        bg: 'bg-blue-600',
        border: 'border-blue-500',
        duration: 3000,
    },
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = crypto.randomUUID();
        const newToast: Toast = { id, message, type };

        setToasts((prev) => [...prev, newToast]);

        // Auto remove after duration
        setTimeout(() => {
            removeToast(id);
        }, toastConfig[type].duration);
    }, [removeToast]);

    const contextValue = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => {
                    const config = toastConfig[toast.type];
                    const Icon = config.icon;

                    return (
                        <div
                            key={toast.id}
                            className={`
                pointer-events-auto
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl
                ${config.bg} border ${config.border}
                text-white font-medium text-sm
                animate-toast-in
                min-w-[280px] max-w-[90vw] md:max-w-md
              `}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="flex-1">{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastContext;
