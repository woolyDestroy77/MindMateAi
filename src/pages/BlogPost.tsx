import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Calendar, 
  User, 
  Heart, 
  MessageSquare, 
  Tag, 
  ArrowLeft, 
  Send, 
  Edit, 
  Trash2, 
  Share2, 
  AlertTriangle,
  X,
  ThumbsUp,
  Award
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useBlog, BlogPost as BlogPostType, BlogComment } from '../hooks/useBlog';
import { useAuth } from '../hooks/useAuth';
import { useNotificationContext } from '../components/notifications/NotificationProvider';

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchPost, likePost, checkUserLiked, addComment, fetchComments, deleteComment, deletePost } = useBlog();
  const { user } = useAuth();
  const { createAchievement } = useNotificationContext();
  
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to get valid image URL
  const getValidImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return "https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
    }
    return imageUrl;
  };

  // Load post and comments
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      
      try {
        // Fetch post
        const postData = await fetchPost(id);
        if (postData) {
          setPost(postData);
          
          // Check if user has liked this post
          const liked = await checkUserLiked(id);
          setIsLiked(liked);
          
          // Fetch comments
          const commentsData = await fetchComments(id);
          setComments(commentsData);
        } else {
          // Post not found
          navigate('/blog');
        }
      } catch (error) {
        console.error('Error loading blog post:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, fetchPost, checkUserLiked, fetchComments, navigate]);

  // Handle like/unlike
  const handleLike = async () => {
    if (!post || !user) return;
    
    const liked = await likePost(post.id);
    setIsLiked(liked);
    
    // Update post likes count in local state
    setPost(prev => {
      if (!prev) return null;
      return {
        ...prev,
        likes: liked ? prev.likes + 1 : prev.likes - 1
      };
    });
  };

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!post || !commentText.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    
    try {
      const newComment = await addComment(post.id, commentText.trim());
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        setCommentText('');
        
        // Update post comments count in local state
        setPost(prev => {
          if (!prev) return null;
          return {
            ...prev,
            comments_count: prev.comments_count + 1
          };
        });
        
        // Create achievement notification for first comment
        if (comments.length === 0) {
          createAchievement(
            'First Comment!',
            'You\'ve joined the conversation by leaving your first comment.',
            {
              actionUrl: `/blog/post/${post.id}#comments`,
              actionText: 'View Comment'
            }
          );
        }
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    
    const success = await deleteComment(commentId, post.id);
    if (success) {
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    }
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!post) return;
    
    setIsDeleting(true);
    
    try {
      const success = await deletePost(post.id);
      if (success) {
        navigate('/blog');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading blog post...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h2>
            <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
            <Link to="/blog">
              <Button
                variant="primary"
                leftIcon={<ArrowLeft size={18} />}
              >
                Back to Blog
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/blog" className="inline-flex items-center text-lavender-600 hover:text-lavender-800">
            <ArrowLeft size={18} className="mr-2" />
            Back to Blog
          </Link>
        </div>

        {/* Post Content */}
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Featured Badge */}
          {post.metadata?.featured && (
            <div className="bg-yellow-500 text-white px-4 py-1 text-center text-sm font-medium">
              Featured Story
            </div>
          )}
          
          {/* Post Image */}
          {post.image_url && (
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              <img 
                src={getValidImageUrl(post.image_url)} 
                alt={post.title} 
                className="w-full h-96 object-cover"
                onError={(e) => {
                  console.error("Image failed to load:", post.image_url);
                  e.currentTarget.src = "https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
                }}
              />
            </div>
          )}
          
          <div className="p-6 md:p-8">
            {/* Author and Date */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-lavender-100 flex-shrink-0">
                {post.author?.avatar_url ? (
                  <img 
                    src={post.author.avatar_url} 
                    alt={post.author.full_name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200";
                    }}
                  />
                ) : (
                  <User className="w-full h-full p-2 text-lavender-600" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">{post.author?.full_name || 'Anonymous'}</div>
                <div className="text-sm text-gray-500 flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {format(parseISO(post.created_at), 'MMMM d, yyyy')}
                  <span className="mx-2">•</span>
                  {formatDistanceToNow(parseISO(post.created_at), { addSuffix: true })}
                </div>
              </div>
              
              {/* Edit/Delete Options (if author) */}
              {user && user.id === post.user_id && (
                <div className="ml-auto flex space-x-2">
                  <Link to={`/blog/edit/${post.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit size={16} />}
                    >
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Trash2 size={16} />}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
            
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${tag}`}
                    className="bg-lavender-50 text-lavender-700 px-3 py-1 rounded-full text-sm flex items-center hover:bg-lavender-100 transition-colors"
                  >
                    <Tag size={14} className="mr-1" />
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Content */}
            <div className="prose prose-lavender max-w-none mb-8">
              {post.content.split('\n').map((paragraph, index) => (
                paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
              ))}
            </div>
            
            {/* Metadata */}
            {post.metadata && (
              <div className="mb-8">
                {post.metadata.recovery_day !== undefined && (
                  <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm mr-3">
                    <Heart size={14} className="mr-1" />
                    Day {post.metadata.recovery_day} of Recovery
                  </div>
                )}
                
                {post.metadata.mood && (
                  <div className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm mr-3">
                    Mood: {post.metadata.mood}
                  </div>
                )}
                
                {post.metadata.location && (
                  <div className="inline-flex items-center bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg text-sm">
                    Location: {post.metadata.location}
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <div className="flex space-x-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 ${
                    isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                  }`}
                  disabled={!user}
                >
                  <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                  <span className="font-medium">{post.likes}</span>
                </button>
                
                <a 
                  href="#comments"
                  className="flex items-center space-x-2 text-gray-500 hover:text-lavender-600"
                >
                  <MessageSquare size={20} />
                  <span className="font-medium">{post.comments_count}</span>
                </a>
              </div>
              
              <div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                  className="flex items-center space-x-1 text-gray-500 hover:text-lavender-600"
                >
                  <Share2 size={18} />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section id="comments" className="mt-8">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-lavender-600" />
                Comments ({post.comments_count})
              </h2>
              
              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-8">
                <div className="flex space-x-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-lavender-100 flex-shrink-0">
                    <User className="w-full h-full p-2 text-lavender-600" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
                      rows={3}
                      required
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={!commentText.trim() || isSubmittingComment || !user}
                        isLoading={isSubmittingComment}
                        leftIcon={<Send size={16} />}
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
              
              {/* Comments List */}
              {comments.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Comments Yet</h3>
                  <p className="text-gray-600">Be the first to share your thoughts on this post.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex space-x-4"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-lavender-100 flex-shrink-0">
                        {comment.author?.avatar_url ? (
                          <img 
                            src={comment.author.avatar_url} 
                            alt={comment.author.full_name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200";
                            }}
                          />
                        ) : (
                          <User className="w-full h-full p-2 text-lavender-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">
                                {comment.author?.full_name || 'Anonymous'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true })}
                              </div>
                            </div>
                            
                            {/* Delete option (if author) */}
                            {user && user.id === comment.user_id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Delete comment"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <p className="mt-2 text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 text-red-600 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-semibold">Delete Blog Post</h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this blog post? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleDeletePost}
                  isLoading={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Post
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}