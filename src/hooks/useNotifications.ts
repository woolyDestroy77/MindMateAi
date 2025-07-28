import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { addDays, format, isAfter, isBefore, parseISO } from 'date-fns';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'achievement' | 'alert' | 'info' | 'follow' | 'like' | 'comment' | 'message';
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  created_at: string;
  expires_at?: string;
  metadata?: any;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Use a ref to track notification IDs to prevent duplicates
  const notificationIdsRef = useRef<Set<string>>(new Set());
  // Track recently created notifications to prevent duplicates
  const recentNotificationsRef = useRef<Map<string, number>>(new Map());

  // Check notification permission
  useEffect(() => {
    const checkPermission = async () => {
      if (!('Notification' in window)) {
        console.log('This browser does not support desktop notifications');
        return;
      }

      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      }
    };

    checkPermission();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support desktop notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPermissionGranted(true);
        toast.success('Notification permission granted!');
        return true;
      } else {
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, []);

  // Fetch notifications from local storage and database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // First, load from localStorage for immediate display
      const localNotifications = loadLocalNotifications();
      setNotifications(localNotifications);
      setUnreadCount(localNotifications.filter(n => !n.read).length);
      
      // Update our ref with existing notification IDs
      localNotifications.forEach(notification => {
        notificationIdsRef.current.add(notification.id);
      });

      // Then, fetch from database and merge
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert database notifications to our format
      const dbNotifications: Notification[] = data.map(item => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        priority: item.priority,
        read: item.read,
        actionUrl: item.action_url,
        actionText: item.action_text,
        created_at: item.created_at,
        expires_at: item.expires_at,
        metadata: item.metadata
      }));

      // Merge with local notifications, prioritizing database versions
      const mergedNotifications = mergeNotifications(localNotifications, dbNotifications);
      
      // Save merged notifications to localStorage
      saveLocalNotifications(mergedNotifications);
      
      // Update state
      setNotifications(mergedNotifications);
      setUnreadCount(mergedNotifications.filter(n => !n.read).length);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load notifications from localStorage
  const loadLocalNotifications = (): Notification[] => {
    try {
      const saved = localStorage.getItem('puremind_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Filter out expired notifications
        const now = new Date();
        return parsed.filter((notification: Notification) => {
          if (!notification.expires_at) return true;
          return isBefore(now, parseISO(notification.expires_at));
        });
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
    }
    return [];
  };

  // Save notifications to localStorage
  const saveLocalNotifications = (notificationsToSave: Notification[]) => {
    try {
      localStorage.setItem('puremind_notifications', JSON.stringify(notificationsToSave));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  };

  // Merge local and database notifications
  const mergeNotifications = (local: Notification[], database: Notification[]): Notification[] => {
    const merged = [...local];
    
    // Add or update notifications from database
    database.forEach(dbNotification => {
      const existingIndex = merged.findIndex(n => n.id === dbNotification.id);
      if (existingIndex >= 0) {
        merged[existingIndex] = dbNotification;
      } else {
        merged.push(dbNotification);
      }
    });
    
    // Sort by created_at (newest first)
    return merged.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      // Update local state immediately
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update in localStorage
      const localNotifications = loadLocalNotifications();
      const updatedLocalNotifications = localNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      );
      saveLocalNotifications(updatedLocalNotifications);
      
      // If user is logged in, update in database
      if (user) {
        await supabase
          .from('user_notifications')
          .update({ read: true })
          .eq('id', id)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Update local state immediately
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      // Update in localStorage
      const localNotifications = loadLocalNotifications();
      const updatedLocalNotifications = localNotifications.map(notification => 
        ({ ...notification, read: true })
      );
      saveLocalNotifications(updatedLocalNotifications);
      
      // If user is logged in, update in database
      if (user) {
        await supabase
          .from('user_notifications')
          .update({ read: true })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      // Update local state immediately
      const updatedNotifications = notifications.filter(notification => notification.id !== id);
      setNotifications(updatedNotifications);
      
      // Update unread count
      const newUnreadCount = updatedNotifications.filter(n => !n.read).length;
      setUnreadCount(newUnreadCount);
      
      // Update in localStorage
      saveLocalNotifications(updatedNotifications);
      
      // If user is logged in, delete from database
      if (user) {
        await supabase
          .from('user_notifications')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
      }
      
      // Remove from our tracking ref
      notificationIdsRef.current.delete(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications, user]);

  // Create a new notification
  const createNotification = useCallback(async (
    title: string,
    message: string,
    type: 'reminder' | 'achievement' | 'alert' | 'info' | 'follow' | 'like' | 'comment' | 'message' = 'info',
    options: {
      priority?: 'high' | 'medium' | 'low';
      actionUrl?: string;
      actionText?: string;
      expiresIn?: number; // days
      metadata?: any;
      showToast?: boolean;
      showDesktopNotification?: boolean;
    } = {}
  ) => {
    try {
      const {
        priority = 'medium',
        actionUrl,
        actionText,
        expiresIn,
        metadata = {},
        showToast = false, // Disable toast by default to prevent duplicates
        showDesktopNotification = true
      } = options;

      // Create a unique ID for the notification
      const notificationId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a deduplication key based on content
      const dedupeKey = `${title}_${message}`.replace(/\s+/g, '').toLowerCase();
      
      // Check if we've recently created a similar notification
      const now = Date.now();
      const recentTimestamp = recentNotificationsRef.current.get(dedupeKey);
      
      if (recentTimestamp && (now - recentTimestamp) < 300000) { // 5 minute deduplication window
        console.log('Skipping duplicate notification:', title);
        return null;
      }
      
      // Mark this notification as recently created (expires in 5 minutes)
      recentNotificationsRef.current.set(dedupeKey, now);
      
      // Clean up old entries from the recent notifications map  
      const cleanupTime = now - 300000; // 5 minutes ago
      recentNotificationsRef.current.forEach((timestamp, key) => {
        if (timestamp < cleanupTime) {
          recentNotificationsRef.current.delete(key);
        }
      });

      // Create notification object
      const newNotification: Notification = {
        id: notificationId,
        title,
        message,
        type,
        priority,
        read: false,
        actionUrl,
        actionText,
        created_at: new Date().toISOString(),
        expires_at: expiresIn ? addDays(new Date(), expiresIn).toISOString() : undefined,
        metadata
      };
      
      // Check if we already have this notification ID
      if (notificationIdsRef.current.has(notificationId)) {
        console.log('Notification ID already exists, skipping:', notificationId);
        return null;
      }
      
      // Add to our tracking ref
      notificationIdsRef.current.add(notificationId);

      // Update local state
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Save to localStorage
      const localNotifications = loadLocalNotifications();
      saveLocalNotifications([newNotification, ...localNotifications]);

      // Show toast notification if requested
      if (showToast) {
        toast(message, {
          icon: type === 'achievement' ? '🏆' : 
                type === 'alert' ? '⚠️' : 
                type === 'reminder' ? '⏰' : 
                type === 'follow' ? '👤' :
                type === 'like' ? '❤️' :
                type === 'comment' ? '💬' :
                type === 'message' ? '✉️' : 'ℹ️',
          duration: 5000,
          // Use the notification ID as the toast ID to prevent duplicates
          id: notificationId
        });
      }

      // Show desktop notification if requested and permission granted
      if (showDesktopNotification && permissionGranted && 'Notification' in window) {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      }

      // If user is logged in, save to database
      if (user) {
        const { data, error } = await supabase
          .from('user_notifications')
          .insert([{
            user_id: user.id,
            title,
            message,
            type,
            priority,
            read: false,
            action_url: actionUrl,
            action_text: actionText,
            expires_at: newNotification.expires_at,
            metadata
          }])
          .select()
          .single();

        if (error) throw error;

        // Update the local notification with the database ID
        if (data) {
          const updatedNotification = {
            ...newNotification,
            id: data.id
          };
          
          // Update our tracking ref
          notificationIdsRef.current.delete(notificationId);
          notificationIdsRef.current.add(data.id);

          setNotifications(prev => 
            prev.map(n => n.id === newNotification.id ? updatedNotification : n)
          );

          // Update in localStorage
          const updatedLocalNotifications = loadLocalNotifications().map(n => 
            n.id === newNotification.id ? updatedNotification : n
          );
          saveLocalNotifications(updatedLocalNotifications);
        }
      }

      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }, [user, permissionGranted]);

  // Create a reminder notification
  const createReminder = useCallback((
    title: string,
    message: string,
    options: {
      actionUrl?: string;
      actionText?: string;
      expiresIn?: number;
      priority?: 'high' | 'medium' | 'low';
      metadata?: any;
    } = {}
  ) => {
    return createNotification(title, message, 'reminder', {
      ...options,
      showToast: true,
      showDesktopNotification: true
    });
  }, [createNotification]);

  // Create an achievement notification
  const createAchievement = useCallback((
    title: string,
    message: string,
    options: {
      actionUrl?: string;
      actionText?: string;
      metadata?: any;
    } = {}
  ) => {
    return createNotification(title, message, 'achievement', {
      ...options,
      priority: 'medium',
      expiresIn: 30, // Achievements stay for 30 days
      showToast: true,
      showDesktopNotification: true
    });
  }, [createNotification]);

  // Create an alert notification
  const createAlert = useCallback((
    title: string,
    message: string,
    options: {
      actionUrl?: string;
      actionText?: string;
      priority?: 'high' | 'medium' | 'low';
      metadata?: any;
    } = {}
  ) => {
    return createNotification(title, message, 'alert', {
      ...options,
      priority: options.priority || 'high',
      showToast: true,
      showDesktopNotification: true
    });
  }, [createNotification]);

  // Schedule a notification for a future time
  const scheduleNotification = useCallback(async (
    scheduledTime: Date,
    title: string,
    message: string,
    type: 'reminder' | 'achievement' | 'alert' | 'info' | 'follow' | 'like' | 'comment' | 'message' = 'reminder',
    options: {
      priority?: 'high' | 'medium' | 'low';
      actionUrl?: string;
      actionText?: string;
      expiresIn?: number;
      metadata?: any;
    } = {}
  ) => {
    if (!user) {
      console.error('User must be logged in to schedule notifications');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .insert([{
          user_id: user.id,
          scheduled_time: scheduledTime.toISOString(),
          title,
          message,
          type,
          priority: options.priority || 'medium',
          action_url: options.actionUrl,
          action_text: options.actionText,
          expires_in_days: options.expiresIn,
          metadata: options.metadata || {}
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Notification scheduled successfully');
      return data;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast.error('Failed to schedule notification');
      return null;
    }
  }, [user]);

  // Generate daily reminders based on user activity
  const generateDailyReminders = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Check if we've already generated reminders today
      const lastReminderDate = localStorage.getItem('last_reminder_date');
      if (lastReminderDate === todayStr) {
        console.log('Daily reminders already generated today');
        return;
      }

      // Check for pending therapist applications (admin only)
      if (user.email === 'youssef.arafat09@gmail.com') {
        console.log('Checking for pending therapist applications...');
        
        const { data: pendingTherapists } = await supabase
          .from('therapist_profiles')
          .select(`
            id, 
            professional_title, 
            license_state,
            created_at,
            user:users!therapist_profiles_user_id_fkey(full_name, email)
          `)
          .eq('verification_status', 'pending');

        if (pendingTherapists && pendingTherapists.length > 0) {
          console.log('Found pending therapist applications:', pendingTherapists.length);
          
          createNotification(
            `${pendingTherapists.length} Pending Therapist Applications`,
            `You have ${pendingTherapists.length} therapist application${pendingTherapists.length > 1 ? 's' : ''} waiting for review.`,
            'alert',
            {
              priority: 'high',
              actionUrl: '/admin',
              actionText: 'Review Applications',
              metadata: {
                pending_count: pendingTherapists.length,
                applications: pendingTherapists.map(t => ({
                  id: t.id,
                  name: t.user?.full_name,
                  title: t.professional_title,
                  state: t.license_state
                }))
              }
            }
          );
        } else {
          console.log('No pending therapist applications found');
        }
      }

      // Create journal reminder
      const lastJournalEntry = await supabase
        .from('journal_entries')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastJournalEntry.error || !lastJournalEntry.data) {
        // No journal entries yet, or error - create a first-time reminder
        createReminder(
          'Start Your Journal',
          'Journaling helps track your emotional journey. Take a moment to write your first entry today.',
          {
            actionUrl: '/journal',
            actionText: 'Write Entry',
            priority: 'medium'
          }
        );
      } else {
        const lastEntryDate = parseISO(lastJournalEntry.data.created_at);
        const daysSinceLastEntry = Math.floor((today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastEntry >= 2) {
          createReminder(
            'Journal Check-in',
            `It's been ${daysSinceLastEntry} days since your last journal entry. Take a moment to reflect on your feelings.`,
            {
              actionUrl: '/journal',
              actionText: 'Write Entry',
              priority: daysSinceLastEntry >= 5 ? 'high' : 'medium'
            }
          );
        }
      }

      // Create daily chat reminder
      const lastChatDate = localStorage.getItem('lastChatDate');
      if (!lastChatDate || lastChatDate !== todayStr) {
        createReminder(
          'Daily Wellness Chat',
          'Your AI companion is ready to chat about your day and help track your emotional wellbeing.',
          {
            actionUrl: '/chat',
            actionText: 'Start Chat',
            priority: 'medium'
          }
        );
      }

      // Create addiction recovery reminder if applicable
      const { data: addictions } = await supabase
        .from('user_addictions')
        .select('id, days_clean, last_clean_day_marked, addiction_type:addiction_types(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (addictions && addictions.length > 0) {
        const addiction = addictions[0];
        const lastMarkedDate = addiction.last_clean_day_marked;
        
        if (!lastMarkedDate || lastMarkedDate !== todayStr) {
          createReminder(
            'Mark Your Clean Day',
            `Don't forget to mark today as clean for your ${addiction.addiction_type.name} recovery tracking.`,
            {
              actionUrl: '/addiction-support',
              actionText: 'Mark Clean Day',
              priority: 'high'
            }
          );
        }
      }

      // Create anxiety exercise reminder
      const { data: anxietySessions } = await supabase
        .from('anxiety_sessions')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', format(today, 'yyyy-MM-dd'))
        .limit(1);

      if (!anxietySessions || anxietySessions.length === 0) {
        createReminder(
          'Anxiety Management',
          'Take a few minutes for a breathing exercise or meditation session today.',
          {
            actionUrl: '/anxiety-support',
            actionText: 'Start Exercise',
            priority: 'medium'
          }
        );
      }

      // Mark that we've generated reminders today
      localStorage.setItem('last_reminder_date', todayStr);
    } catch (error) {
      console.error('Error generating daily reminders:', error);
    }
  }, [user, createReminder]);

  // Initialize notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      generateDailyReminders();
    } else {
      // If not logged in, just load from localStorage
      const localNotifications = loadLocalNotifications();
      setNotifications(localNotifications);
      setUnreadCount(localNotifications.filter(n => !n.read).length);
      
      // Update our ref with existing notification IDs
      localNotifications.forEach(notification => {
        notificationIdsRef.current.add(notification.id);
      });
    }
  }, [user, fetchNotifications, generateDailyReminders]);

  return {
    notifications,
    unreadCount,
    isLoading,
    permissionGranted,
    requestPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    createReminder,
    createAchievement,
    createAlert,
    scheduleNotification,
    refreshNotifications: fetchNotifications,
    generateDailyReminders,
    user
  };
};