import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationBadgeProps {
  className?: string;
  onClick?: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  className = '',
  onClick
}) => {
  const { unreadCount } = useNotifications();

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={onClick}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label={`${unreadCount} unread notifications`}
      >
        <Bell size={20} className="text-gray-700" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
};

export default NotificationBadge;