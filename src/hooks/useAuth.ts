import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  user_type: 'patient' | 'therapist' | 'admin';
  account_status: 'pending' | 'active' | 'suspended' | 'rejected';
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  location?: string;
  bio?: string;
  preferences?: any;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
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
      
      // Get user profile from user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        // If no profile exists, create one from auth metadata
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData.user) return null;
        
        const newProfile = {
          user_id: userData.user.id,
          user_type: (userData.user.user_metadata.user_type || 'patient') as 'patient' | 'therapist' | 'admin',
          account_status: 'active' as 'pending' | 'active' | 'suspended' | 'rejected',
          full_name: userData.user.user_metadata.full_name || '',
          email: userData.user.email || '',
          avatar_url: userData.user.user_metadata.avatar_url,
          phone: userData.user.user_metadata.phone,
          date_of_birth: userData.user.user_metadata.date_of_birth,
          location: userData.user.user_metadata.location,
          bio: userData.user.user_metadata.bio,
          preferences: userData.user.user_metadata.preferences || {}
        };
        
        // Create the profile
        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single();
          
        if (createError) throw createError;
        
        const profile: UserProfile = {
          id: createdProfile.id,
          user_id: createdProfile.user_id,
          user_type: createdProfile.user_type,
          account_status: createdProfile.account_status,
          full_name: createdProfile.full_name,
          email: createdProfile.email,
          avatar_url: createdProfile.avatar_url,
          phone: createdProfile.phone,
          date_of_birth: createdProfile.date_of_birth,
          location: createdProfile.location,
          bio: createdProfile.bio,
          preferences: createdProfile.preferences,
          created_at: createdProfile.created_at,
          updated_at: createdProfile.updated_at,
          last_login: createdProfile.last_login
        };
        
        profileCache.set(userId, profile);
        setUserProfile(profile);
        return profile;
      }
      
      // Create profile object from database
      const profile: UserProfile = {
        id: profileData.id,
        user_id: profileData.user_id,
        user_type: profileData.user_type,
        account_status: profileData.account_status,
        full_name: profileData.full_name,
        email: profileData.email,
        avatar_url: profileData.avatar_url,
        phone: profileData.phone,
        date_of_birth: profileData.date_of_birth,
        location: profileData.location,
        bio: profileData.bio,
        preferences: profileData.preferences,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        last_login: profileData.last_login
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