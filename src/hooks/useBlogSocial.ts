import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';

export interface BlogFollower {
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

export interface BlogMessage {
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

export const useBlogSocial = () => {
  const { user } = useAuth();
  const [following, setFollowing] = useState<BlogFollower[]>([]);
  const [followers, setFollowers] = useState<BlogFollower[]>([]);
  const [messages, setMessages] = useState<BlogMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users the current user is following
  const fetchFollowing = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('blog_followers')
        .select(`
          *,
          following:following_id (
            id,
            full_name,
            avatar_url
          )
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

  // Fetch users following the current user
  const fetchFollowers = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('blog_followers')
        .select(`
          *,
          follower:follower_id (
            id,
            full_name,
            avatar_url
          )
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

  // Fetch direct messages
  const fetchMessages = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('blog_direct_messages')
        .select(`
          *,
          sender:sender_id (
            id,
            full_name,
            avatar_url
          ),
          recipient:recipient_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Count unread messages
      const unread = data?.filter(msg => 
        msg.recipient_id === user.id && !msg.is_read
      ).length || 0;
      
      setUnreadCount(unread);
      
      return data || [];
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Error fetching messages: ' + (err instanceof Error ? err.message : String(err)));
      return [];
    }
  }, [user]);

  // Follow a user
  const followUser = useCallback(async (userId: string) => {
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
      const updatedFollowing = await fetchFollowing();
      setFollowing(updatedFollowing);
      
      toast.success('User followed successfully');
      return true;
    } catch (err) {
      console.error('Error following user:', err);
      toast.error('Failed to follow user');
      return false;
    }
  }, [user, fetchFollowing]);

  // Unfollow a user
  const unfollowUser = useCallback(async (userId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('blog_followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);
      
      if (error) throw error;
      
      // Update local state
      setFollowing(prev => prev.filter(f => f.following_id !== userId));
      
      toast.success('User unfollowed');
      return true;
    } catch (err) {
      console.error('Error unfollowing user:', err);
      toast.error('Failed to unfollow user');
      return false;
    }
  }, [user]);

  // Check if following a user
  const isFollowing = useCallback((userId: string) => {
    return following.some(f => f.following_id === userId);
  }, [following]);

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
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh messages
      const updatedMessages = await fetchMessages();
      setMessages(updatedMessages);
      
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
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('blog_direct_messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      console.error('Error marking message as read:', err);
      return false;
    }
  }, [user]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('blog_direct_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast.success('Message deleted');
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');
      return false;
    }
  }, [user]);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
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
    };
    
    loadData();
  }, [user, fetchFollowing, fetchFollowers, fetchMessages]);

  return {
    following,
    followers,
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
    refreshData: useCallback(async () => {
      const [followingData, followersData, messagesData] = await Promise.all([
        fetchFollowing(),
        fetchFollowers(),
        fetchMessages()
      ]);
      
      setFollowing(followingData);
      setFollowers(followersData);
      setMessages(messagesData);
    }, [fetchFollowing, fetchFollowers, fetchMessages])
  };
};