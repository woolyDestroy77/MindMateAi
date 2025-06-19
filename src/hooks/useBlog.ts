import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  likes: number;
  comments_count: number;
  is_published: boolean;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  metadata?: {
    location?: string;
    mood?: string;
    recovery_day?: number;
    privacy?: 'public' | 'private' | 'followers';
    featured?: boolean;
    [key: string]: any;
  };
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export const useBlog = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [userPosts, setUserPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all published blog posts
  const fetchPosts = useCallback(async (filter?: string, tag?: string) => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          author:user_id(id, full_name, avatar_url)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      // Apply filters if provided
      if (filter === 'featured') {
        query = query.eq('metadata->featured', true);
      } else if (filter === 'popular') {
        query = query.order('likes', { ascending: false });
      }
      
      // Filter by tag if provided
      if (tag) {
        query = query.contains('tags', [tag]);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      setPosts(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch blog posts';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user's blog posts
  const fetchUserPosts = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:user_id(id, full_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserPosts(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch your blog posts';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch a single blog post by ID
  const fetchPostById = useCallback(async (postId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:user_id(id, full_name, avatar_url)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch blog post';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new blog post
  const createPost = useCallback(async (
    title: string,
    content: string,
    tags: string[] = [],
    imageFile?: File,
    metadata: any = {}
  ) => {
    if (!user) {
      toast.error('You must be logged in to create a post');
      return null;
    }
    
    try {
      setIsLoading(true);
      
      // Upload image if provided
      let imageUrl = '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('blog_images')
          .upload(fileName, imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('blog_images')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrlData.publicUrl;
      }
      
      // Create post
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([{
          title,
          content,
          image_url: imageUrl || null,
          user_id: user.id,
          tags,
          likes: 0,
          comments_count: 0,
          is_published: true,
          metadata
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUserPosts(prev => [data, ...prev]);
      setPosts(prev => [data, ...prev]);
      
      toast.success('Blog post created successfully!');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create blog post';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update an existing blog post
  const updatePost = useCallback(async (
    postId: string,
    updates: Partial<BlogPost>,
    imageFile?: File
  ) => {
    if (!user) {
      toast.error('You must be logged in to update a post');
      return null;
    }
    
    try {
      setIsLoading(true);
      
      // Upload new image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('blog_images')
          .upload(fileName, imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('blog_images')
          .getPublicUrl(fileName);
          
        updates.image_url = publicUrlData.publicUrl;
      }
      
      // Update post
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', postId)
        .eq('user_id', user.id) // Ensure user can only update their own posts
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUserPosts(prev => prev.map(post => post.id === postId ? data : post));
      setPosts(prev => prev.map(post => post.id === postId ? data : post));
      
      toast.success('Blog post updated successfully!');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update blog post';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Delete a blog post
  const deletePost = useCallback(async (postId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a post');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Get the post to check if there's an image to delete
      const { data: post, error: fetchError } = await supabase
        .from('blog_posts')
        .select('image_url')
        .eq('id', postId)
        .eq('user_id', user.id) // Ensure user can only delete their own posts
        .single();
        
      if (fetchError) throw fetchError;
      
      // Delete the post
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Delete the image if it exists
      if (post.image_url) {
        const imagePath = post.image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage
            .from('blog_images')
            .remove([imagePath]);
        }
      }

      // Update local state
      setUserPosts(prev => prev.filter(post => post.id !== postId));
      setPosts(prev => prev.filter(post => post.id !== postId));
      
      toast.success('Blog post deleted successfully!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete blog post';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Like a blog post
  const likePost = useCallback(async (postId: string) => {
    if (!user) {
      toast.error('You must be logged in to like a post');
      return false;
    }
    
    try {
      // Check if user already liked this post
      const { data: existingLike, error: checkError } = await supabase
        .from('blog_post_likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
        
      if (!checkError && existingLike) {
        // User already liked this post, so unlike it
        await supabase
          .from('blog_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        // Decrement likes count
        const { data: updatedPost, error: updateError } = await supabase.rpc(
          'decrement_post_likes',
          { post_id: postId }
        );
        
        if (updateError) throw updateError;
        
        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: post.likes - 1 } : post
        ));
        setUserPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: post.likes - 1 } : post
        ));
        
        return false; // Returned unliked state
      } else {
        // User hasn't liked this post yet, so like it
        await supabase
          .from('blog_post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);
          
        // Increment likes count
        const { data: updatedPost, error: updateError } = await supabase.rpc(
          'increment_post_likes',
          { post_id: postId }
        );
        
        if (updateError) throw updateError;
        
        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: post.likes + 1 } : post
        ));
        setUserPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: post.likes + 1 } : post
        ));
        
        return true; // Returned liked state
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to like/unlike post';
      setError(message);
      toast.error(message);
      return false;
    }
  }, [user]);

  // Check if user has liked a post
  const checkUserLiked = useCallback(async (postId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('blog_post_likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
        
      return !error && data;
    } catch (err) {
      return false;
    }
  }, [user]);

  // Add a comment to a blog post
  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user) {
      toast.error('You must be logged in to comment');
      return null;
    }
    
    try {
      // Add comment
      const { data: comment, error: commentError } = await supabase
        .from('blog_comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content
        }])
        .select(`
          *,
          author:user_id(id, full_name, avatar_url)
        `)
        .single();
        
      if (commentError) throw commentError;
      
      // Increment comments count
      const { error: updateError } = await supabase.rpc(
        'increment_post_comments',
        { post_id: postId }
      );
      
      if (updateError) throw updateError;
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments_count: post.comments_count + 1 } : post
      ));
      setUserPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments_count: post.comments_count + 1 } : post
      ));
      
      toast.success('Comment added successfully!');
      return comment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add comment';
      setError(message);
      toast.error(message);
      return null;
    }
  }, [user]);

  // Fetch comments for a blog post
  const fetchComments = useCallback(async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          author:user_id(id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch comments';
      setError(message);
      toast.error(message);
      return [];
    }
  }, []);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string, postId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a comment');
      return false;
    }
    
    try {
      // Delete comment
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only delete their own comments

      if (error) throw error;
      
      // Decrement comments count
      const { error: updateError } = await supabase.rpc(
        'decrement_post_comments',
        { post_id: postId }
      );
      
      if (updateError) throw updateError;
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments_count: Math.max(0, post.comments_count - 1) } : post
      ));
      setUserPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments_count: Math.max(0, post.comments_count - 1) } : post
      ));
      
      toast.success('Comment deleted successfully!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment';
      setError(message);
      toast.error(message);
      return false;
    }
  }, [user]);

  // Get popular tags from all posts
  const getPopularTags = useCallback(() => {
    const tagCounts: Record<string, number> = {};
    
    posts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  // Initialize
  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserPosts();
    }
  }, [fetchPosts, fetchUserPosts, user]);

  return {
    posts,
    userPosts,
    isLoading,
    error,
    fetchPosts,
    fetchUserPosts,
    fetchPostById,
    createPost,
    updatePost,
    deletePost,
    likePost,
    checkUserLiked,
    addComment,
    fetchComments,
    deleteComment,
    getPopularTags
  };
};