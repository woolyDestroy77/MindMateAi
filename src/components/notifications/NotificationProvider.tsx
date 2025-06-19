import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from 'react-hot-toast';
import NotificationToast from './NotificationToast';

// Create context
const NotificationContext = createContext<ReturnType<typeof useNotifications> | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notificationService = useNotifications();
  const { notifications, markAsRead, createReminder } = notificationService;
  
  // Use a ref to track which notifications have been shown as toasts
  const shownNotificationsRef = useRef<Set<string>>(new Set());

  // Set up reminder check interval
  useEffect(() => {
    // Check for reminders that need to be shown
    const checkScheduledReminders = () => {
      // Get notification settings
      const settings = localStorage.getItem('notification_settings');
      let parsedSettings = {
        dailyReminders: true,
        reminderTime: '20:00' // Default to 8:00 PM
      };
      
      if (settings) {
        try {
          parsedSettings = { ...parsedSettings, ...JSON.parse(settings) };
        } catch (error) {
          console.error('Error parsing notification settings:', error);
        }
      }
      
      // If daily reminders are disabled, return
      if (!parsedSettings.dailyReminders) return;
      
      // Check if it's time to show daily reminders
      const now = new Date();
      const [hours, minutes] = parsedSettings.reminderTime.split(':').map(Number);
      
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);
      
      // If it's within 5 minutes of the reminder time and we haven't shown reminders today
      const fiveMinutesBeforeReminder = new Date(reminderTime);
      fiveMinutesBeforeReminder.setMinutes(reminderTime.getMinutes() - 5);
      
      const fiveMinutesAfterReminder = new Date(reminderTime);
      fiveMinutesAfterReminder.setMinutes(reminderTime.getMinutes() + 5);
      
      const isReminderTime = now >= fiveMinutesBeforeReminder && now <= fiveMinutesAfterReminder;
      
      if (isReminderTime) {
        const lastReminderCheck = localStorage.getItem('last_reminder_check');
        const today = new Date().toDateString();
        
        if (lastReminderCheck !== today) {
          // Create a daily check-in reminder
          createReminder(
            'Daily Check-in',
            'Time for your daily wellness check-in. How are you feeling today?',
            {
              actionUrl: '/chat',
              actionText: 'Start Check-in',
              priority: 'medium'
            }
          );
          
          // Mark that we've checked reminders today
          localStorage.setItem('last_reminder_check', today);
        }
      }
    };
    
    // Check immediately on mount
    checkScheduledReminders();
    
    // Set up interval to check every 5 minutes
    const interval = setInterval(checkScheduledReminders, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [createReminder]);

  // Custom toast renderer for notifications
  useEffect(() => {
    // Find unread notifications that haven't been shown as toast yet
    const unshownNotifications = notifications.filter(n => 
      !n.read && !shownNotificationsRef.current.has(n.id)
    );
    
    // Show toast for each unshown notification
    unshownNotifications.forEach(notification => {
      // Mark as shown in our ref
      shownNotificationsRef.current.add(notification.id);
      
      // Show custom toast
      toast.custom((t) => (
        <NotificationToast
          notification={notification}
          onClose={() => toast.dismiss(t.id)}
          onAction={() => markAsRead(notification.id)}
        />
      ));
    });
  }, [notifications, markAsRead]);

  return (
    <NotificationContext.Provider value={notificationService}>
      {children}
    </NotificationContext.Provider>
  );
};