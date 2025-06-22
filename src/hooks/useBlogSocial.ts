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

export const useBlogSocial = () => {
  const { user, userProfile } = useAuth();
  const { createNotification } = useNotificationContext();
  
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [conversationUsers, setConversationUsers] = useState<any[]>([]);

  // Fetch followers (people who follow the current user)
  const fetchFollowers = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('blog_followers')
        .select('*, follower:users!follower_id(id, raw_user_meta_data)')
        .eq('following_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process the data to extract user metadata
      const processedFollowers = data.map((follower: any) => ({
        ...follower,
        follower: follower.follower ? {
          id: follower.follower.id,
          full_name: follower.follower.raw_user_meta_data?.full_name || 'Anonymous',
          avatar_url: follower.follower.raw_user_meta_data?.avatar_url
        } : null
      }));
      
      setFollowers(processedFollowers);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  }, [user]);

  // Fetch following (people the current user follows)
  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('blog_followers')
        .select('*, following:users!following_id(id, raw_user_meta_data)')
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process the data to extract user metadata
      const processedFollowing = data.map((follow: any) => ({
        ...follow,
        following: follow.following ? {
          id: follow.following.id,
          full_name: follow.following.raw_user_meta_data?.full_name || 'Anonymous',
          avatar_url: follow.following.raw_user_meta_data?.avatar_url
        } : null
      }));
      
      setFollowing(processedFollowing);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  }, [user]);

  // Follow a user
  const followUser = useCallback(async (userId: string, userName: string) => {
    if (!user) {
      toast.error('You must be logged in to follow users');
      return false;
    }
    
    if (user.id === userId) {
      toast.error('You cannot follow yourself');
      return false;
    }
    
    try {
      // Check if already following
      const { data: existingFollow, error: checkError } = await supabase
        .from('blog_followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
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
      await fetchFollowing();
      
      // Create notification for the followed user
      try {
        await supabase
          .from('user_notifications')
          .insert([{
            user_id: userId,
            title: 'New Follower',
            message: `${userProfile?.full_name || 'Someone'} started following you`,
            type: 'follow',
            priority: 'medium',
            read: false,
            action_url: '/blog',
            action_text: 'View Profile'
          }]);
      } catch (notifError) {
        console.error('Error creating follow notification:', notifError);
      }
      
      toast.success(`You are now following ${userName}`);
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
      return false;
    }
  }, [user, userProfile, fetchFollowing]);

  // Unfollow a user
  const unfollowUser = useCallback(async (userId: string, userName: string) => {
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
      await fetchFollowing();
      
      toast.success(`You have unfollowed ${userName}`);
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
      return false;
    }
  }, [user, fetchFollowing]);

  // Check if following a user
  const isFollowing = useCallback((userId: string): boolean => {
    return following.some(follow => follow.following_id === userId);
  }, [following]);

  // Get follower count
  const getFollowerCount = useCallback(async (userId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('blog_followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
        
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Error getting follower count:', error);
      return 0;
    }
  }, []);

  // Get following count
  const getFollowingCount = useCallback(async (userId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('blog_followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
        
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Error getting following count:', error);
      return 0;
    }
  }, []);

  // Fetch direct messages
  const fetchMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('blog_direct_messages')
        .select('*, sender:users!sender_id(id, raw_user_meta_data), recipient:users!recipient_id(id, raw_user_meta_data)')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process the data to extract user metadata
      const processedMessages = data.map((message: any) => ({
        ...message,
        sender: message.sender ? {
          id: message.sender.id,
          full_name: message.sender.raw_user_meta_data?.full_name || 'Anonymous',
          avatar_url: message.sender.raw_user_meta_data?.avatar_url
        } : null,
        recipient: message.recipient ? {
          id: message.recipient.id,
          full_name: message.recipient.raw_user_meta_data?.full_name || 'Anonymous',
          avatar_url: message.recipient.raw_user_meta_data?.avatar_url
        } : null
      }));
      
      setMessages(processedMessages);
      
      // Count unread messages
      const unreadCount = processedMessages.filter(
        msg => msg.recipient_id === user.id && !msg.is_read
      ).length;
      
      setUnreadMessageCount(unreadCount);
      
      // Get unique conversation users
      const uniqueUsers = new Set<string>();
      const conversationUsersList: any[] = [];
      
      processedMessages.forEach(msg => {
        const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender;
        
        if (!uniqueUsers.has(otherUserId) && otherUser) {
          uniqueUsers.add(otherUserId);
          
          // Find the latest message with this user
          const latestMessage = processedMessages
            .filter(m => 
              (m.sender_id === user.id && m.recipient_id === otherUserId) || 
              (m.sender_id === otherUserId && m.recipient_id === user.id)
            )
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          
          conversationUsersList.push({
            id: otherUserId,
            full_name: otherUser.full_name,
            avatar_url: otherUser.avatar_url,
            latestMessage: latestMessage,
            unreadCount: processedMessages.filter(
              m => m.sender_id === otherUserId && m.recipient_id === user.id && !m.is_read
            ).length
          });
        }
      });
      
      // Sort by latest message
      conversationUsersList.sort((a, b) => 
        new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime()
      );
      
      setConversationUsers(conversationUsersList);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user]);

  // Send a direct message
  const sendMessage = useCallback(async (recipientId: string, message: string) => {
    if (!user) {
      toast.error('You must be logged in to send messages');
      return null;
    }
    
    if (!message.trim()) {
      toast.error('Message cannot be empty');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('blog_direct_messages')
        .insert([
          { 
            sender_id: user.id, 
            recipient_id: recipientId, 
            message: message.trim() 
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // Refresh messages
      await fetchMessages();
      
      // Create notification for the recipient
      try {
        await supabase
          .from('user_notifications')
          .insert([{
            user_id: recipientId,
            title: 'New Message',
            message: `${userProfile?.full_name || 'Someone'} sent you a message`,
            type: 'message',
            priority: 'medium',
            read: false,
            action_url: '/blog/messages',
            action_text: 'View Message'
          }]);
      } catch (notifError) {
        console.error('Error creating message notification:', notifError);
      }
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return null;
    }
  }, [user, userProfile, fetchMessages]);

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
      setUnreadMessageCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }, [user]);

  // Mark all messages from a user as read
  const markAllMessagesAsRead = useCallback(async (senderId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('blog_direct_messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);
        
      if (error) throw error;
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.sender_id === senderId && msg.recipient_id === user.id
            ? { ...msg, is_read: true } 
            : msg
        )
      );
      
      // Recalculate unread count
      const newUnreadCount = messages.filter(
        msg => msg.recipient_id === user.id && !msg.is_read && msg.sender_id !== senderId
      ).length;
      
      setUnreadMessageCount(newUnreadCount);
      
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }, [user, messages]);

  // Get conversation messages with a specific user
  const getConversationMessages = useCallback((otherUserId: string): DirectMessage[] => {
    return messages
      .filter(msg => 
        (msg.sender_id === user?.id && msg.recipient_id === otherUserId) || 
        (msg.sender_id === otherUserId && msg.recipient_id === user?.id)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, user]);

  // Set active conversation
  const setConversation = useCallback(async (userId: string | null) => {
    setActiveConversation(userId);
    
    // Mark all messages from this user as read
    if (user && userId) {
      await markAllMessagesAsRead(userId);
    }
  }, [user, markAllMessagesAsRead]);

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (user) {
        await Promise.all([
          fetchFollowers(),
          fetchFollowing(),
          fetchMessages()
        ]);
      }
      setIsLoading(false);
    };
    
    loadData();
    
    // Set up real-time subscription for new messages
    if (user) {
      const messagesSubscription = supabase
        .channel('blog_direct_messages_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'blog_direct_messages',
          filter: `recipient_id=eq.${user.id}`
        }, (payload) => {
          console.log('New message received:', payload);
          fetchMessages();
          
          // Show notification for new message
          const newMessage = payload.new as any;
          if (newMessage && newMessage.sender_id) {
            // Get sender info
            supabase.auth.admin.getUserById(newMessage.sender_id)
              .then(({ data }) => {
                const senderName = data?.user?.user_metadata?.full_name || 'Someone';
                
                // Create notification
                createNotification(
                  'New Message',
                  `${senderName} sent you a message`,
                  'message',
                  {
                    priority: 'medium',
                    actionUrl: '/blog/messages',
                    actionText: 'View Message',
                    showToast: true
                  }
                );
              })
              .catch(error => {
                console.error('Error getting sender info:', error);
              });
          }
        })
        .subscribe();
        
      // Set up real-time subscription for new followers
      const followersSubscription = supabase
        .channel('blog_followers_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'blog_followers',
          filter: `following_id=eq.${user.id}`
        }, (payload) => {
          console.log('New follower:', payload);
          fetchFollowers();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(messagesSubscription);
        supabase.removeChannel(followersSubscription);
      };
    }
  }, [user, fetchFollowers, fetchFollowing, fetchMessages, createNotification]);

  return {
    followers,
    following,
    messages,
    unreadMessageCount,
    isLoading,
    activeConversation,
    conversationUsers,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowerCount,
    getFollowingCount,
    sendMessage,
    markMessageAsRead,
    markAllMessagesAsRead,
    getConversationMessages,
    setConversation,
    refreshFollowers: fetchFollowers,
    refreshFollowing: fetchFollowing,
    refreshMessages: fetchMessages
  };
};