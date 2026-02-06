import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error';

export interface NotificationState {
  type: NotificationType;
  message: string;
}

interface NotificationProps {
  notification: NotificationState | null;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm w-full ${
      isSuccess 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <div className="flex-shrink-0">
        {isSuccess ? (
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>
      <div className="flex-1 text-sm font-medium">
        {notification.message}
      </div>
      <button 
        onClick={onClose}
        className={`p-1 rounded-full hover:bg-black/5 transition-colors ${
          isSuccess ? 'text-emerald-600' : 'text-red-600'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};