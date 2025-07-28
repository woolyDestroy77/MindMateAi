import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  birthdate?: string;
  location?: string;
  bio?: string;
  created_at?: string;
}

// Create a cache for user profiles to reduce database calls
const profileCache = new Map<string, UserProfile>();

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Check cache first
      if (profileCache.has(userId)) {
        const cachedProfile = profileCache.get(userId);
        setUserProfile(cachedProfile || null);
        return cachedProfile;
      }

      setIsLoadingProfile(true);
      
      // Get user metadata from auth.users
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!userData.user) return null;
      
      // Create profile object from user metadata
      const profile: UserProfile = {
        id: userData.user.id,
        full_name: userData.user.user_metadata.full_name || '',
        avatar_url: userData.user.user_metadata.avatar_url,
        birthdate: userData.user.user_metadata.birthdate,
        location: userData.user.user_metadata.location,
        bio: userData.user.user_metadata.bio,
        created_at: userData.user.created_at
      };
      
      // Cache the profile
      profileCache.set(userId, profile);
      
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const initialize = useCallback(async () => {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      
      setIsInitialized(true);

      // Set up real-time subscription
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          // Clear cache on logout
          profileCache.clear();
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
      setUserProfile(null);
      setIsInitialized(true);
      return undefined;
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      if (!user) {
        toast.error('You must be logged in to update your profile');
        return false;
      }
      
      // Filter out undefined values and empty strings
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined && v !== '')
      );
      
      // Set loading state to show feedback to the user
      setIsLoadingProfile(true);
      
      const { data, error } = await supabase.auth.updateUser({
        data: filteredUpdates
      });

      if (error) {
        throw error;
      }
      
      // Update local state with the new profile data
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          ...filteredUpdates
        };
        
        // Update cache
        profileCache.set(user.id, updatedProfile);
        
        setUserProfile(updatedProfile);
      }
      
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const updateAvatar = async (file: File): Promise<string | null> => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }
      
      // Set loading state
      setIsLoadingProfile(true);
      
      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profile_images')
        .upload(fileName, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('profile_images')
        .getPublicUrl(fileName);
        
      // Update user profile with image URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          avatar_url: publicUrlData.publicUrl
        }
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      if (userProfile) {
        const updatedProfile = { ...userProfile, avatar_url: publicUrlData.publicUrl };
        setUserProfile(updatedProfile);
        
        // Update cache
        profileCache.set(user.id, updatedProfile);
      }
      
      toast.success('Profile picture updated successfully');
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile picture');
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserProfile(null);
      // Clear cache on logout
      profileCache.clear();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const signOutTherapist = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Therapist signed out successfully');
      // Redirect to therapist portal
      window.location.href = '/become-therapist';
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
      throw error;
    }
  };

  return {
    user,
    userProfile,
    isInitialized,
    isLoadingProfile,
    signOut,
    updateProfile,
    updateAvatar,
    signInWithGoogle,
    refreshProfile: () => user ? fetchUserProfile(user.id) : Promise.resolve(null)
  };
};