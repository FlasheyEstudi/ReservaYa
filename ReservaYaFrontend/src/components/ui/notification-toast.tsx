'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface NotificationToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  isVisible: boolean;
  onClose: () => void;
}

export function NotificationToast({ 
  message, 
  type = 'info', 
  duration = 5000,
  isVisible,
  onClose 
}: NotificationToastProps) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
      const timer = setTimeout(() => {
        setShouldShow(false);
        setTimeout(onClose, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      case 'error':
        return 'bg-red-500 text-white border-red-600';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      default:
        return 'bg-blue-500 text-white border-blue-600';
    }
  };

  if (!isVisible && !shouldShow) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 transform',
        getTypeStyles(),
        shouldShow ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setShouldShow(false);
            setTimeout(onClose, 300);
          }}
          className="ml-3 flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}