import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Check, Trash2, X, Settings, Clock, Calendar, CheckCircle } from 'lucide-react';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { format, formatDistanceToNow } from 'date-fns';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    permissionGranted,
    requestPermission
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'reminders' | 'alerts'>('all');
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notification center when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'reminders') return notification.type === 'reminder';
    if (filter === 'alerts') return notification.type === 'alert';
    return true;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'achievement':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'alert':
        return <Bell className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get notification background color based on type and priority
  const getNotificationStyle = (notification: Notification) => {
    const { type, priority, read } = notification;
    
    if (read) {
      return 'bg-gray-50 hover:bg-gray-100';
    }
    
    switch (type) {
      case 'reminder':
        return priority === 'high' 
          ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500' 
          : 'bg-blue-50 hover:bg-blue-100';
      case 'achievement':
        return 'bg-green-50 hover:bg-green-100';
      case 'alert':
        return priority === 'high' 
          ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' 
          : 'bg-red-50 hover:bg-red-100';
      case 'info':
      default:
        return 'bg-lavender-50 hover:bg-lavender-100';
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  return (
    <div className={`relative ${className}`} ref={notificationRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs text-lavender-600 hover:text-lavender-800 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-2 text-sm font-medium ${
                  filter === 'all'
                    ? 'text-lavender-600 border-b-2 border-lavender-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 py-2 text-sm font-medium ${
                  filter === 'unread'
                    ? 'text-lavender-600 border-b-2 border-lavender-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter('reminders')}
                className={`flex-1 py-2 text-sm font-medium ${
                  filter === 'reminders'
                    ? 'text-lavender-600 border-b-2 border-lavender-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reminders
              </button>
              <button
                onClick={() => setFilter('alerts')}
                className={`flex-1 py-2 text-sm font-medium ${
                  filter === 'alerts'
                    ? 'text-lavender-600 border-b-2 border-lavender-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Alerts
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center">
                  <BellOff className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 ${getNotificationStyle(notification)}`}
                    >
                      <div className="flex">
                        <div className="flex-shrink-0 mr-3">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <p className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatNotificationTime(notification.created_at)}
                            </span>
                          </div>
                          <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          
                          {notification.actionUrl && notification.actionText && (
                            <div className="mt-2">
                              <Link
                                to={notification.actionUrl}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setIsOpen(false);
                                }}
                                className="text-xs font-medium text-lavender-600 hover:text-lavender-800"
                              >
                                {notification.actionText} →
                              </Link>
                            </div>
                          )}
                          
                          <div className="mt-2 flex justify-end space-x-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-xs text-gray-500 hover:text-lavender-600 rounded-full hover:bg-lavender-50"
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-xs text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                              title="Delete notification"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Permission Request */}
            {!permissionGranted && (
              <div className="p-4 bg-blue-50 border-t border-blue-100">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Enable notifications</h3>
                    <div className="mt-1 text-xs text-blue-700">
                      <p>Get reminders for your daily goals, journal entries, and more.</p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={requestPermission}
                        className="mt-2 bg-blue-600 hover:bg-blue-700"
                      >
                        Enable Notifications
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;