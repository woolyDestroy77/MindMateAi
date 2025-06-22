import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { useNotificationContext } from '../components/notifications/NotificationProvider';

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface Following {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  following?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  recipient?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface ConversationUser {
  id: string;
  full_name: string;
  avatar_url?: string;
  unreadCount: number;
  latestMessage: DirectMessage;
}

export const useBlogSocial = () => {
  const { user } = useAuth();
  const { createNotification } = useNotificationContext();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Following[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationUsers, setConversationUsers] = useState<ConversationUser[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  // Fetch followers (people who follow the current user)
  const fetchFollowers = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('blog_followers')
        .select(`
          *,
          follower:users!follower_id(id, full_name, avatar_url)
        `)
        .eq('following_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching followers:', err);
      setError('Error fetching followers: ' + (err instanceof Error ? err.message : String(err)));
      return [];
    }
  }, [user]);

  // Fetch following (people the current user follows)
  const fetchFollowing = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('blog_followers')
        .select(`
          *,
          following:users!following_id(id, full_name, avatar_url)
        `)
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching following:', err);
      setError('Error fetching following: ' + (err instanceof Error ? err.message : String(err)));
      return [];
    }
  }, [user]);

  // Fetch direct messages
  const fetchMessages = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('blog_direct_messages')
        .select(`
          *,
          sender:users!sender_id(id, full_name, avatar_url),
          recipient:users!recipient_id(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Count unread messages
      const unread = data?.filter(msg => 
        msg.recipient_id === user.id && !msg.is_read
      ).length || 0;
      
      setUnreadCount(unread);
      
      // Process conversation users
      processConversationUsers(data || []);
      
      return data || [];
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Error fetching messages: ' + (err instanceof Error ? err.message : String(err)));
      return [];
    }
  }, [user]);

  // Process conversation users from messages
  const processConversationUsers = useCallback((messageData: DirectMessage[]) => {
    if (!user) return;
    
    const userMap = new Map<string, {
      id: string;
      full_name: string;
      avatar_url?: string;
      unreadCount: number;
      latestMessage: DirectMessage;
    }>();
    
    // Group messages by conversation partner
    messageData.forEach(msg => {
      const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      const partner = msg.sender_id === user.id ? msg.recipient : msg.sender;
      
      if (!partner) return;
      
      const existing = userMap.get(partnerId);
      const isUnread = msg.recipient_id === user.id && !msg.is_read;
      
      if (!existing) {
        userMap.set(partnerId, {
          id: partnerId,
          full_name: partner.full_name,
          avatar_url: partner.avatar_url,
          unreadCount: isUnread ? 1 : 0,
          latestMessage: msg
        });
      } else {
        // Update unread count
        if (isUnread) {
          existing.unreadCount += 1;
        }
        
        // Update latest message if this one is newer
        if (new Date(msg.created_at) > new Date(existing.latestMessage.created_at)) {
          existing.latestMessage = msg;
        }
      }
    });
    
    // Convert map to array and sort by latest message
    const conversationList = Array.from(userMap.values())
      .sort((a, b) => 
        new Date(b.latestMessage.created_at).getTime() - 
        new Date(a.latestMessage.created_at).getTime()
      );
    
    setConversationUsers(conversationList);
  }, [user]);

  // Follow a user
  const followUser = useCallback(async (userId: string, userName: string = 'this user') => {
    if (!user) {
      toast.error('You must be logged in to follow users');
      return false;
    }
    
    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('blog_followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();
      
      if (existingFollow) {
        toast.error('You are already following this user');
        return false;
      }
      
      // Create follow relationship
      const { error } = await supabase
        .from('blog_followers')
        .insert([
          { follower_id: user.id, following_id: userId }
        ]);
      
      if (error) throw error;
      
      // Refresh following list
      const newFollowing = await fetchFollowing();
      setFollowing(newFollowing);
      
      // Send notification to the user being followed
      try {
        await supabase
          .from('user_notifications')
          .insert([{
            user_id: userId,
            title: 'New Follower',
            message: `${user.user_metadata.full_name || 'Someone'} started following you`,
            type: 'follow',
            priority: 'medium',
            read: false,
            action_url: '/blog',
            action_text: 'View Profile'
          }]);
      } catch (notifError) {
        console.error('Error creating follow notification:', notifError);
      }
      
      toast.success(`Now following ${userName}`);
      return true;
    } catch (err) {
      console.error('Error following user:', err);
      toast.error('Failed to follow user');
      return false;
    }
  }, [user, fetchFollowing]);

  // Unfollow a user
  const unfollowUser = useCallback(async (userId: string, userName: string = 'this user') => {
    if (!user) {
      toast.error('You must be logged in to unfollow users');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('blog_followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);
      
      if (error) throw error;
      
      // Refresh following list
      const newFollowing = await fetchFollowing();
      setFollowing(newFollowing);
      
      toast.success(`Unfollowed ${userName}`);
      return true;
    } catch (err) {
      console.error('Error unfollowing user:', err);
      toast.error('Failed to unfollow user');
      return false;
    }
  }, [user, fetchFollowing]);

  // Check if following a user
  const isFollowing = useCallback((userId: string) => {
    return following.some(f => f.following_id === userId);
  }, [following]);

  // Get follower count for a user
  const getFollowerCount = useCallback(async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('blog_followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      
      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Error getting follower count:', err);
      return 0;
    }
  }, []);

  // Get following count for a user
  const getFollowingCount = useCallback(async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('blog_followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Error getting following count:', err);
      return 0;
    }
  }, []);

  // Send a direct message
  const sendMessage = useCallback(async (recipientId: string, message: string) => {
    if (!user) {
      toast.error('You must be logged in to send messages');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('blog_direct_messages')
        .insert([
          { 
            sender_id: user.id, 
            recipient_id: recipientId, 
            message,
            is_read: false
          }
        ])
        .select(`
          *,
          sender:users!sender_id(id, full_name, avatar_url),
          recipient:users!recipient_id(id, full_name, avatar_url)
        `)
        .single();
      
      if (error) throw error;
      
      // Refresh messages
      const newMessages = await fetchMessages();
      setMessages(newMessages);
      
      // Send notification to recipient
      try {
        await supabase
          .from('user_notifications')
          .insert([{
            user_id: recipientId,
            title: 'New Message',
            message: `${user.user_metadata.full_name || 'Someone'} sent you a message`,
            type: 'message',
            priority: 'medium',
            read: false,
            action_url: '/blog',
            action_text: 'View Message'
          }]);
      } catch (notifError) {
        console.error('Error creating message notification:', notifError);
      }
      
      toast.success('Message sent');
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return null;
    }
  }, [user, fetchMessages]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('blog_direct_messages')
        .update({ is_read: true })
        .eq('id', messageId);
      
      if (error) throw error;
      
      // Refresh messages
      const newMessages = await fetchMessages();
      setMessages(newMessages);
      
      return true;
    } catch (err) {
      console.error('Error marking message as read:', err);
      return false;
    }
  }, [fetchMessages]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('blog_direct_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      
      // Refresh messages
      const newMessages = await fetchMessages();
      setMessages(newMessages);
      
      toast.success('Message deleted');
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');
      return false;
    }
  }, [fetchMessages]);

  // Get messages for a specific conversation
  const getConversationMessages = useCallback((partnerId: string) => {
    if (!user) return [];
    
    return messages.filter(msg => 
      (msg.sender_id === user.id && msg.recipient_id === partnerId) ||
      (msg.sender_id === partnerId && msg.recipient_id === user.id)
    ).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [user, messages]);

  // Set active conversation
  const setConversation = useCallback((userId: string | null) => {
    setActiveConversation(userId);
    
    // Mark messages as read when opening conversation
    if (userId && user) {
      const unreadMessages = messages.filter(
        msg => msg.sender_id === userId && 
               msg.recipient_id === user.id && 
               !msg.is_read
      );
      
      unreadMessages.forEach(msg => {
        markMessageAsRead(msg.id);
      });
    }
  }, [user, messages, markMessageAsRead]);

  // Load all data
  const loadData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [followingData, followersData, messagesData] = await Promise.all([
        fetchFollowing(),
        fetchFollowers(),
        fetchMessages()
      ]);
      
      setFollowing(followingData);
      setFollowers(followersData);
      setMessages(messagesData);
    } catch (err) {
      console.error('Error loading social data:', err);
      setError('Failed to load social data');
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchFollowing, fetchFollowers, fetchMessages]);

  // Initialize data
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    followers,
    following,
    messages,
    unreadCount,
    isLoading,
    error,
    followUser,
    unfollowUser,
    isFollowing,
    sendMessage,
    markMessageAsRead,
    deleteMessage,
    refreshData: loadData,
    getFollowerCount,
    getFollowingCount,
    conversationUsers,
    activeConversation,
    setConversation,
    getConversationMessages,
    refreshMessages: fetchMessages
  };
};