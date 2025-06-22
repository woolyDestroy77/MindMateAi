import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

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
  metadata?: {
    location?: string;
    mood?: string;
    recovery_day?: number;
    featured?: boolean;
  };
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
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
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [userPosts, setUserPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [popularTags, setPopularTags] = useState<{tag: string, count: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all published blog posts
  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process posts to add author information
      const processedPosts = await Promise.all((data || []).map(async (post) => {
        try {
          // Get user metadata from auth
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData && userData.user && userData.user.id === post.user_id) {
            return {
              ...post,
              author: {
                id: userData.user.id,
                full_name: userData.user.user_metadata.full_name || 'Anonymous',
                avatar_url: userData.user.user_metadata.avatar_url
              }
            };
          }
        } catch (userError) {
          console.error('Error fetching post author data:', userError);
        }
        return post;
      }));
      
      setPosts(processedPosts);
      
      // Extract popular tags
      const allTags = data?.flatMap(post => post.tags || []) || [];
      const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
      
      const sortedTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      setPopularTags(sortedTags);
      
      // Get featured posts
      const featured = processedPosts.filter(post => post.metadata?.featured) || [];
      setFeaturedPosts(featured.slice(0, 3));
      
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch blog posts');
      toast.error('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user's own posts
  const fetchUserPosts = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process posts to add author information
      const processedPosts = data?.map(post => ({
        ...post,
        author: {
          id: user.id,
          full_name: user.user_metadata.full_name || 'Anonymous',
          avatar_url: user.user_metadata.avatar_url
        }
      })) || [];
      
      setUserPosts(processedPosts);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      // Don't show toast for this error to avoid UI clutter
    }
  }, []);

  // Fetch a single post by ID
  const fetchPost = useCallback(async (postId: string): Promise<BlogPost | null> => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      
      // Add author information
      if (data) {
        try {
          // Get user metadata from auth
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData && userData.user) {
            // Get the post author's metadata
            const { data: authorData, error: authorError } = await supabase.auth.admin.getUserById(data.user_id);
            
            if (!authorError && authorData) {
              data.author = {
                id: authorData.user.id,
                full_name: authorData.user.user_metadata.full_name || 'Anonymous',
                avatar_url: authorData.user.user_metadata.avatar_url
              };
            } else {
              // Fallback to current user if they are the author
              if (userData.user.id === data.user_id) {
                data.author = {
                  id: userData.user.id,
                  full_name: userData.user.user_metadata.full_name || 'Anonymous',
                  avatar_url: userData.user.user_metadata.avatar_url
                };
              }
            }
          }
        } catch (userError) {
          console.error('Error fetching author data:', userError);
          // Continue without author data
        }
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching blog post:', err);
      toast.error('Failed to load blog post');
      return null;
    }
  }, []);

  // Create a new blog post
  const createPost = useCallback(async (
    title: string,
    content: string,
    tags: string[] = [],
    metadata?: any,
    isPublished: boolean = true
  ): Promise<BlogPost | null> => {
    try {
      console.log('Creating new blog post...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([
          {
            title,
            content,
            user_id: user.id,
            tags,
            is_published: isPublished,
            metadata,
            likes: 0,
            comments_count: 0
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      console.log('Blog post created successfully:', data);
      
      // Refresh posts list
      fetchPosts();
      fetchUserPosts();
      
      toast.success('Blog post created successfully');
      return data;
    } catch (err) {
      console.error('Error creating blog post:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create blog post');
      return null;
    }
  }, [fetchPosts, fetchUserPosts]);

  // Update an existing blog post
  const updatePost = useCallback(async (
    postId: string,
    updates: Partial<BlogPost>
  ): Promise<BlogPost | null> => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh posts list
      fetchPosts();
      fetchUserPosts();
      
      toast.success('Blog post updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating blog post:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update blog post');
      return null;
    }
  }, [fetchPosts, fetchUserPosts]);

  // Delete a blog post
  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      // Refresh posts list
      fetchPosts();
      fetchUserPosts();
      
      toast.success('Blog post deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting blog post:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete blog post');
      return false;
    }
  }, [fetchPosts, fetchUserPosts]);

  // Like a blog post
  const likePost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Check if user already liked the post
      const { data: existingLike, error: checkError } = await supabase
        .from('blog_post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Unlike the post
        const { error: unlikeError } = await supabase
          .from('blog_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (unlikeError) throw unlikeError;

        // Get current likes count and decrement it
        const { data: currentPost, error: fetchError } = await supabase
          .from('blog_posts')
          .select('likes')
          .eq('id', postId)
          .single();

        if (fetchError) throw fetchError;

        const newLikesCount = Math.max(0, (currentPost?.likes || 0) - 1);

        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ likes: newLikesCount })
          .eq('id', postId);

        if (updateError) throw updateError;
        
        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: newLikesCount } : post
        ));
        
        setUserPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: newLikesCount } : post
        ));
        
        setFeaturedPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: newLikesCount } : post
        ));
        
        toast.success('Post unliked');
        return false;
      } else {
        // Like the post
        const { error: likeError } = await supabase
          .from('blog_post_likes')
          .insert([
            { post_id: postId, user_id: user.id }
          ]);

        if (likeError) throw likeError;

        // Get current likes count and increment it
        const { data: currentPost, error: fetchError } = await supabase
          .from('blog_posts')
          .select('likes')
          .eq('id', postId)
          .single();

        if (fetchError) throw fetchError;

        const newLikesCount = (currentPost?.likes || 0) + 1;

        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ likes: newLikesCount })
          .eq('id', postId);

        if (updateError) throw updateError;
        
        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: newLikesCount } : post
        ));
        
        setUserPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: newLikesCount } : post
        ));
        
        setFeaturedPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: newLikesCount } : post
        ));
        
        toast.success('Post liked');
        return true;
      }
    } catch (err) {
      console.error('Error liking/unliking post:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to like/unlike post');
      return false;
    }
  }, []);

  // Check if user has liked a post
  const checkUserLiked = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return false;

      const { data, error } = await supabase
        .from('blog_post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error('Error checking if user liked post:', err);
      return false;
    }
  }, []);

  // Add a comment to a blog post
  const addComment = useCallback(async (
    postId: string,
    content: string
  ): Promise<BlogComment | null> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('blog_comments')
        .insert([
          { post_id: postId, user_id: user.id, content }
        ])
        .select('*')
        .single();

      if (error) throw error;

      // Get current comments count and increment it
      const { data: currentPost, error: fetchError } = await supabase
        .from('blog_posts')
        .select('comments_count')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      const newCommentsCount = (currentPost?.comments_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ comments_count: newCommentsCount })
        .eq('id', postId);

      if (updateError) throw updateError;
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments_count: newCommentsCount } : post
      ));
      
      setUserPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments_count: newCommentsCount } : post
      ));
      
      setFeaturedPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments_count: newCommentsCount } : post
      ));
      
      toast.success('Comment added');
      
      // Add author info to the comment
      if (data) {
        data.author = {
          id: user.id,
          full_name: user.user_metadata.full_name || 'Anonymous',
          avatar_url: user.user_metadata.avatar_url
        };
      }
      
      return data;
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add comment');
      return null;
    }
  }, []);

  // Fetch comments for a blog post
  const fetchComments = useCallback(async (postId: string): Promise<BlogComment[]> => {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Get current user for author info
      const { data: { user } } = await supabase.auth.getUser();
      
      // Add author info to each comment
      const commentsWithAuthors = await Promise.all((data || []).map(async (comment) => {
        try {
          // If the comment is from the current user, use their info
          if (user && user.id === comment.user_id) {
            return {
              ...comment,
              author: {
                id: user.id,
                full_name: user.user_metadata.full_name || 'Anonymous',
                avatar_url: user.user_metadata.avatar_url
              }
            };
          }
          
          // Otherwise, try to get the user's info from auth
          const { data: authorData, error: authorError } = await supabase.auth.admin.getUserById(comment.user_id);
          
          if (!authorError && authorData) {
            return {
              ...comment,
              author: {
                id: authorData.user.id,
                full_name: authorData.user.user_metadata.full_name || 'Anonymous',
                avatar_url: authorData.user.user_metadata.avatar_url
              }
            };
          }
        } catch (userError) {
          console.error('Error fetching comment author data:', userError);
        }
        
        // Fallback if we can't get author info
        return {
          ...comment,
          author: {
            id: comment.user_id,
            full_name: 'Anonymous',
            avatar_url: undefined
          }
        };
      }));
      
      return commentsWithAuthors;
    } catch (err) {
      console.error('Error fetching comments:', err);
      toast.error('Failed to load comments');
      return [];
    }
  }, []);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string, postId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Get current comments count and decrement it
      const { data: currentPost, error: fetchError } = await supabase
        .from('blog_posts')
        .select('comments_count')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      const newCommentsCount = Math.max(0, (currentPost?.comments_count || 0) - 1);

      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ comments_count: newCommentsCount })
        .eq('id', postId);

      if (updateError) throw updateError;
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments_count: newCommentsCount } : post
      ));
      
      setUserPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments_count: newCommentsCount } : post
      ));
      
      setFeaturedPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments_count: newCommentsCount } : post
      ));
      
      toast.success('Comment deleted');
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete comment');
      return false;
    }
  }, []);

  // Filter posts by tag
  const filterPostsByTag = useCallback(async (tag: string): Promise<BlogPost[]> => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .contains('tags', [tag])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error filtering posts by tag:', err);
      toast.error('Failed to filter posts');
      return [];
    }
  }, []);

  // Search posts by title or content
  const searchPosts = useCallback(async (query: string): Promise<BlogPost[]> => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching posts:', err);
      toast.error('Failed to search posts');
      return [];
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchPosts();
    fetchUserPosts();
  }, [fetchPosts, fetchUserPosts]);

  return {
    posts,
    userPosts,
    featuredPosts,
    popularTags,
    isLoading,
    error,
    fetchPosts,
    fetchUserPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    likePost,
    checkUserLiked,
    addComment,
    fetchComments,
    deleteComment,
    filterPostsByTag,
    searchPosts
  };
};