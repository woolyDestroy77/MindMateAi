import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from 'react-hot-toast';
import NotificationToast from './NotificationToast';
import { supabase } from '../../lib/supabase';

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
  const { notifications, markAsRead, createReminder, user } = notificationService;
  
  // Use a ref to track which notifications have been shown as toasts
  const shownNotificationsRef = useRef<Set<string>>(new Set());
  // Track notification processing to prevent duplicates
  const processingNotificationRef = useRef<Set<string>>(new Set());

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

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;
    
    // Track processed notifications to prevent duplicates
    const processedNotifications = new Set<string>();
    
    const notificationsSubscription = supabase
      .channel('user_notifications_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('New notification received:', payload);
        
        // Show toast for new notification
        const newNotification = payload.new as any;
        if (newNotification) {
          // Generate a unique key for this notification to prevent duplicates
          const notificationKey = `${newNotification.id}-${newNotification.created_at}`;
          
          // Check if we've already processed this notification
          if (processedNotifications.has(notificationKey)) {
            return;
          }
          
          // Mark as processed
          processedNotifications.add(notificationKey);
          
          // Only show toast for high priority notifications
          if (newNotification.priority === 'high') {
            toast.custom((t) => (
              <NotificationToast
                notification={{
                  id: newNotification.id,
                  title: newNotification.title,
                  message: newNotification.message,
                  type: newNotification.type,
                  priority: newNotification.priority,
                  read: false,
                  actionUrl: newNotification.action_url,
                  actionText: newNotification.action_text,
                  created_at: newNotification.created_at
                }}
                onClose={() => {
                  toast.dismiss(t.id);
                }}
                onAction={() => {
                  markAsRead(newNotification.id);
                }}
              />
            ), {
              id: newNotification.id,
              duration: 6000
            });
          }
          
          // Refresh notifications list
          notificationService.refreshNotifications();
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  }, [user, notificationService, markAsRead]);


  return (
    <NotificationContext.Provider value={notificationService}>
      {children}
    </NotificationContext.Provider>
  );
};