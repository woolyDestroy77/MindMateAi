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

  // Helper function to generate signed URLs for images
  const generateSignedUrl = async (imageUrl: string): Promise<string | null> => {
    try {
      // Extract the object path from the public URL
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'blogimages');
      
      if (bucketIndex === -1 || bucketIndex === urlParts.length - 1) {
        // If we can't find the bucket name or there's no path after it, return null
        return null;
      }
      
      const objectPath = urlParts.slice(bucketIndex + 1).join('/');
      
      // Generate signed URL (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from('blogimages')
        .createSignedUrl(objectPath, 3600);
      
      if (error) {
        console.error('Error creating signed URL:', error);
        return null; // Return null instead of original URL
      }
      
      return data.signedUrl;
    } catch (err) {
      console.error('Error generating signed URL:', err);
      return null; // Return null instead of original URL
    }
  };

  // Helper function to process posts and generate signed URLs for images
  const processPostsWithSignedUrls = async (posts: BlogPost[]): Promise<BlogPost[]> => {
    return Promise.all(
      posts.map(async (post) => {
        if (post.image_url) {
          const signedUrl = await generateSignedUrl(post.image_url);
          return { ...post, image_url: signedUrl || undefined };
        }
        return post;
      })
    );
  };

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
      
      // Process posts with signed URLs
      const postsWithSignedUrls = await processPostsWithSignedUrls(data || []);
      setPosts(postsWithSignedUrls);
      
      // Extract popular tags
      const allTags = postsWithSignedUrls?.flatMap(post => post.tags || []) || [];
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
      const featured = postsWithSignedUrls?.filter(post => post.metadata?.featured) || [];
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
      
      // Process posts with signed URLs
      const postsWithSignedUrls = await processPostsWithSignedUrls(data || []);
      setUserPosts(postsWithSignedUrls);
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
      
      // Process the single post with signed URL
      let processedPost = data;
      if (data && data.image_url) {
        const signedUrl = await generateSignedUrl(data.image_url);
        processedPost = { ...data, image_url: signedUrl || undefined };
      }
      
      // Get author info from auth.users metadata
      if (processedPost) {
        try {
          // Get user metadata from auth
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData && userData.user) {
            processedPost.author = {
              id: userData.user.id,
              full_name: userData.user.user_metadata.full_name || 'Anonymous',
              avatar_url: userData.user.user_metadata.avatar_url
            };
          }
        } catch (userError) {
          console.error('Error fetching author data:', userError);
          // Continue without author data
        }
      }
      
      return processedPost;
    } catch (err) {
      console.error('Error fetching blog post:', err);
      toast.error('Failed to load blog post');
      return null;
    }
  }, []);

  // Convert data URL to File object
  const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  };

  // Upload an image for a blog post
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      console.log('Starting image upload process...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User authentication error:', userError);
        throw userError;
      }
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.size);
        throw new Error('Image size must be less than 5MB');
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        console.error('Invalid file type:', file.type);
        throw new Error('Please select an image file');
      }

      console.log('Uploading image to Supabase storage bucket "blogimages"...');
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });
      
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('blogimages')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('Image uploaded successfully:', uploadData);
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('blogimages')
        .getPublicUrl(fileName);
      
      console.log('Public URL generated:', publicUrlData.publicUrl);
      
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload image');
      return null;
    }
  }, []);

  // Create a new blog post
  const createPost = useCallback(async (
    title: string,
    content: string,
    tags: string[] = [],
    imageFile?: File | string,
    metadata?: any,
    isPublished: boolean = true
  ): Promise<BlogPost | null> => {
    try {
      console.log('Creating new blog post...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Handle image upload if provided
      let imageUrl = undefined;
      
      if (imageFile) {
        console.log('Processing image for blog post:', typeof imageFile);
        
        if (imageFile instanceof File) {
          // Direct file upload
          console.log('Uploading file directly');
          imageUrl = await uploadImage(imageFile);
        } else if (typeof imageFile === 'string' && imageFile.startsWith('data:')) {
          // Convert data URL to file and upload
          console.log('Converting data URL to file');
          const file = await dataURLtoFile(imageFile, `blog-image-${Date.now()}.png`);
          imageUrl = await uploadImage(file);
        } else if (typeof imageFile === 'string') {
          // It's already a URL
          console.log('Using existing URL');
          imageUrl = imageFile;
        }
        
        console.log('Final image URL:', imageUrl);
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([
          {
            title,
            content,
            image_url: imageUrl,
            user_id: user.id,
            tags,
            is_published: isPublished,
            metadata
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
  }, [fetchPosts, fetchUserPosts, uploadImage]);

  // Update an existing blog post
  const updatePost = useCallback(async (
    postId: string,
    updates: Partial<BlogPost>
  ): Promise<BlogPost | null> => {
    try {
      // Handle image upload if it's a File
      let finalUpdates = { ...updates };
      if (updates.image_url instanceof File) {
        const imageUrl = await uploadImage(updates.image_url);
        if (imageUrl) {
          finalUpdates.image_url = imageUrl;
        } else {
          delete finalUpdates.image_url; // Remove if upload failed
        }
      } else if (typeof updates.image_url === 'string' && updates.image_url.startsWith('data:')) {
        // Handle base64 image data
        const file = await dataURLtoFile(updates.image_url, 'blog-image.png');
        const imageUrl = await uploadImage(file);
        if (imageUrl) {
          finalUpdates.image_url = imageUrl;
        } else {
          delete finalUpdates.image_url; // Remove if upload failed
        }
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(finalUpdates)
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
  }, [fetchPosts, fetchUserPosts, uploadImage]);

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

        // Decrement likes count
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ likes: supabase.sql`likes - 1` })
          .eq('id', postId);

        if (updateError) throw updateError;
        
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

        // Increment likes count
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ likes: supabase.sql`likes + 1` })
          .eq('id', postId);

        if (updateError) throw updateError;
        
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

      // Increment comments count
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ comments_count: supabase.sql`comments_count + 1` })
        .eq('id', postId);

      if (updateError) throw updateError;
      
      toast.success('Comment added');
      
      // Try to add author info
      if (data) {
        try {
          // Get user metadata from auth
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData && userData.user) {
            data.author = {
              id: userData.user.id,
              full_name: userData.user.user_metadata.full_name || 'Anonymous',
              avatar_url: userData.user.user_metadata.avatar_url
            };
          }
        } catch (userError) {
          console.error('Error adding author data to comment:', userError);
          // Continue without author data
        }
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
      
      // Try to add author info to each comment
      const commentsWithAuthors = await Promise.all((data || []).map(async (comment) => {
        try {
          // Get user metadata from auth
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData && userData.user && userData.user.id === comment.user_id) {
            return {
              ...comment,
              author: {
                id: userData.user.id,
                full_name: userData.user.user_metadata.full_name || 'Anonymous',
                avatar_url: userData.user.user_metadata.avatar_url
              }
            };
          }
        } catch (userError) {
          console.error('Error fetching comment author data:', userError);
        }
        return comment;
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

      // Decrement comments count
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ comments_count: supabase.sql`comments_count - 1` })
        .eq('id', postId);

      if (updateError) throw updateError;
      
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
      
      // Process posts with signed URLs
      const postsWithSignedUrls = await processPostsWithSignedUrls(data || []);
      return postsWithSignedUrls;
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
      
      // Process posts with signed URLs
      const postsWithSignedUrls = await processPostsWithSignedUrls(data || []);
      return postsWithSignedUrls;
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
    uploadImage,
    filterPostsByTag,
    searchPosts
  };
};