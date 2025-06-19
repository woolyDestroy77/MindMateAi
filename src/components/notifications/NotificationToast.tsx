import React from 'react';
import { motion } from 'framer-motion';
import { Bell, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Notification } from '../../hooks/useNotifications';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onAction,
  duration = 5000
}) => {
  const { title, message, type, actionUrl, actionText } = notification;

  // Auto-close after duration
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'reminder':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'achievement':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get background color based on notification type
  const getBackgroundColor = () => {
    switch (type) {
      case 'reminder':
        return 'bg-blue-50 border-blue-200';
      case 'achievement':
        return 'bg-green-50 border-green-200';
      case 'alert':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border ${getBackgroundColor()}`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
            {actionUrl && actionText && (
              <div className="mt-2">
                <Link
                  to={actionUrl}
                  onClick={() => {
                    if (onAction) onAction();
                    onClose();
                  }}
                  className="text-xs font-medium text-lavender-600 hover:text-lavender-800"
                >
                  {actionText} →
                </Link>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationToast;