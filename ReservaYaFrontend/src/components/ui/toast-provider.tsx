'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (toast: Omit<Toast, 'id'>) => void;
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

const TOAST_STYLES = {
    success: {
        bg: 'bg-emerald-50 border-emerald-200',
        icon: CheckCircle,
        iconColor: 'text-emerald-600',
        titleColor: 'text-emerald-800',
        msgColor: 'text-emerald-600'
    },
    error: {
        bg: 'bg-red-50 border-red-200',
        icon: AlertCircle,
        iconColor: 'text-red-600',
        titleColor: 'text-red-800',
        msgColor: 'text-red-600'
    },
    warning: {
        bg: 'bg-amber-50 border-amber-200',
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
        titleColor: 'text-amber-800',
        msgColor: 'text-amber-600'
    },
    info: {
        bg: 'bg-blue-50 border-blue-200',
        icon: Info,
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-800',
        msgColor: 'text-blue-600'
    }
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const style = TOAST_STYLES[toast.type];
    const Icon = style.icon;

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, toast.duration || 4000);
        return () => clearTimeout(timer);
    }, [toast.duration, onClose]);

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${style.bg} animate-in slide-in-from-right-full duration-300`}
        >
            <Icon className={`h-5 w-5 ${style.iconColor} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
                <p className={`font-semibold ${style.titleColor}`}>{toast.title}</p>
                {toast.message && (
                    <p className={`text-sm mt-0.5 ${style.msgColor}`}>{toast.message}</p>
                )}
            </div>
            <button
                onClick={onClose}
                className={`${style.iconColor} hover:opacity-70 shrink-0`}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2);
        setToasts(prev => [...prev, { ...toast, id }]);
    }, []);

    const showSuccess = useCallback((title: string, message?: string) => {
        showToast({ type: 'success', title, message });
    }, [showToast]);

    const showError = useCallback((title: string, message?: string) => {
        showToast({ type: 'error', title, message, duration: 6000 });
    }, [showToast]);

    const showWarning = useCallback((title: string, message?: string) => {
        showToast({ type: 'warning', title, message });
    }, [showToast]);

    const showInfo = useCallback((title: string, message?: string) => {
        showToast({ type: 'info', title, message });
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
