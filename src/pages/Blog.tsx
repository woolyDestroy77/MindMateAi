import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Tag, 
  Heart, 
  MessageSquare, 
  Plus, 
  User, 
  Calendar, 
  TrendingUp, 
  Award, 
  Bookmark,
  ThumbsUp,
  Share2,
  Image as ImageIcon
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useBlog } from '../hooks/useBlog';
import { useAuth } from '../hooks/useAuth';
import { format, parseISO } from 'date-fns';

const Blog = () => {
  const { posts, userPosts, isLoading, fetchPosts, likePost, checkUserLiked, popularTags } = useBlog();
  const { user, userProfile } = useAuth();
  const [filter, setFilter] = useState<'all' | 'featured' | 'popular' | 'mine'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Load user likes
  useEffect(() => {
    const loadUserLikes = async () => {
      if (!user) return;
      
      const likes: Record<string, boolean> = {};
      
      for (const post of posts) {
        const isLiked = await checkUserLiked(post.id);
        likes[post.id] = isLiked;
      }
      
      setLikedPosts(likes);
    };
    
    loadUserLikes();
  }, [posts, checkUserLiked, user]);

  // Handle post filtering
  const filteredPosts = posts.filter(post => {
    // Filter by search term
    if (searchTerm && !post.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !post.content.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    
    // Filter by tag
    if (selectedTag && !post.tags.includes(selectedTag)) {
      return false;
    }
    
    // Filter by category
    if (filter === 'featured' && (!post.metadata || !post.metadata.featured)) {
      return false;
    }
    
    if (filter === 'mine' && post.user_id !== user?.id) {
      return false;
    }
    
    return true;
  });

  // Sort posts based on filter
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (filter === 'popular') {
      return b.likes - a.likes;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Handle like/unlike
  const handleLike = async (postId: string) => {
    if (!user) return;
    
    const isLiked = await likePost(postId);
    setLikedPosts(prev => ({
      ...prev,
      [postId]: isLiked
    }));
  };

  // Get excerpt from content
  const getExcerpt = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Handle image error
  const handleImageError = (postId: string) => {
    console.error(`Image failed to load for post: ${postId}`);
    setImageErrors(prev => ({
      ...prev,
      [postId]: true
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="mr-3 text-lavender-600" size={28} />
              Community Blog
            </h1>
            <p className="text-gray-600">Share your journey and connect with others</p>
          </div>
          <Link to="/blog/create">
            <Button
              variant="primary"
              leftIcon={<Plus size={18} />}
              className="bg-gradient-to-r from-lavender-500 to-sage-500"
            >
              Create Post
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFilter('all');
                  setSelectedTag(null);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' && !selectedTag
                    ? 'bg-lavender-100 text-lavender-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Posts
              </button>
              
              <button
                onClick={() => {
                  setFilter('featured');
                  setSelectedTag(null);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  filter === 'featured'
                    ? 'bg-lavender-100 text-lavender-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Award size={16} className="mr-1" />
                Featured
              </button>
              
              <button
                onClick={() => {
                  setFilter('popular');
                  setSelectedTag(null);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  filter === 'popular'
                    ? 'bg-lavender-100 text-lavender-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp size={16} className="mr-1" />
                Popular
              </button>
              
              <button
                onClick={() => {
                  setFilter('mine');
                  setSelectedTag(null);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  filter === 'mine'
                    ? 'bg-lavender-100 text-lavender-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <User size={16} className="mr-1" />
                My Posts
              </button>
              
              {selectedTag && (
                <div className="px-3 py-2 rounded-lg bg-blue-100 text-blue-800 text-sm font-medium flex items-center">
                  <Tag size={16} className="mr-1" />
                  {selectedTag}
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {sortedPosts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'mine' 
                    ? "You haven't created any posts yet." 
                    : selectedTag 
                      ? `No posts found with the tag "${selectedTag}".`
                      : searchTerm
                        ? `No posts found matching "${searchTerm}".`
                        : "No posts available at the moment."}
                </p>
                {filter === 'mine' && (
                  <Link to="/blog/create">
                    <Button
                      variant="primary"
                      leftIcon={<Plus size={18} />}
                      className="bg-gradient-to-r from-lavender-500 to-sage-500"
                    >
                      Create Your First Post
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {sortedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow overflow-hidden"
                  >
                    {post.image_url && !imageErrors[post.id] ? (
                      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                        <img 
                          src={post.image_url} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(post.id)}
                        />
                      </div>
                    ) : post.image_url && imageErrors[post.id] ? (
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Image unavailable</p>
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-lavender-100 flex-shrink-0">
                          {post.author?.avatar_url ? (
                            <img 
                              src={post.author.avatar_url} 
                              alt={post.author.full_name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '';
                                (e.target as HTMLElement).classList.add('flex', 'items-center', 'justify-center');
                                (e.target as HTMLElement).innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-lavender-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                              }}
                            />
                          ) : (
                            <User className="w-full h-full p-2 text-lavender-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{post.author?.full_name || 'Anonymous'}</div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Calendar size={12} className="mr-1" />
                            {format(parseISO(post.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      
                      <Link to={`/blog/post/${post.id}`}>
                        <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-lavender-600 transition-colors">
                          {post.title}
                        </h2>
                      </Link>
                      
                      <p className="text-gray-600 mb-4">
                        {getExcerpt(post.content)}
                        {post.content.length > 150 && (
                          <Link to={`/blog/post/${post.id}`} className="text-lavender-600 hover:text-lavender-800 ml-1">
                            Read more
                          </Link>
                        )}
                      </p>
                      
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setSelectedTag(tag)}
                              className="bg-lavender-50 text-lavender-700 px-2 py-1 rounded-full text-xs flex items-center hover:bg-lavender-100 transition-colors"
                            >
                              <Tag size={12} className="mr-1" />
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {post.metadata && (
                        <div className="mb-4">
                          {post.metadata.recovery_day !== undefined && (
                            <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-xs mr-2">
                              <Heart size={12} className="mr-1" />
                              Day {post.metadata.recovery_day} of Recovery
                            </div>
                          )}
                          
                          {post.metadata.mood && (
                            <div className="inline-flex items-center bg-green-50 text-green-700 px-2 py-0.5 rounded-lg text-xs">
                              {post.metadata.mood}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex space-x-4">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center space-x-1 text-sm ${
                              likedPosts[post.id] ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                            }`}
                            disabled={!user}
                          >
                            <Heart size={16} className={likedPosts[post.id] ? 'fill-current' : ''} />
                            <span>{post.likes}</span>
                          </button>
                          
                          <Link 
                            to={`/blog/post/${post.id}#comments`}
                            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-lavender-600"
                          >
                            <MessageSquare size={16} />
                            <span>{post.comments_count}</span>
                          </Link>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                            <Bookmark size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin + `/blog/post/${post.id}`);
                              alert('Link copied to clipboard!');
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Tags */}
            <Card>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-lavender-600" />
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags && popularTags.map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                        selectedTag === tag
                          ? 'bg-lavender-100 text-lavender-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                      <span className="ml-1 bg-white text-gray-600 rounded-full px-1.5 text-xs">
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
            
            {/* Your Posts */}
            {userPosts.length > 0 && (
              <Card>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-lavender-600" />
                    Your Recent Posts
                  </h3>
                  <div className="space-y-4">
                    {userPosts.slice(0, 3).map((post) => (
                      <Link 
                        key={post.id}
                        to={`/blog/post/${post.id}`}
                        className="flex items-start space-x-3 group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                          {post.image_url && !imageErrors[post.id] ? (
                            <img 
                              src={post.image_url} 
                              alt={post.title} 
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(post.id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-lavender-100">
                              <BookOpen size={20} className="text-lavender-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 group-hover:text-lavender-600 transition-colors">
                            {post.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar size={12} className="mr-1" />
                            {format(parseISO(post.created_at), 'MMM d, yyyy')}
                            <span className="mx-2">•</span>
                            <Heart size={12} className="mr-1" />
                            {post.likes}
                            <span className="mx-2">•</span>
                            <MessageSquare size={12} className="mr-1" />
                            {post.comments_count}
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    {userPosts.length > 3 && (
                      <Link 
                        to="/blog?filter=mine"
                        className="text-sm text-lavender-600 hover:text-lavender-800 font-medium block text-center mt-2"
                        onClick={() => setFilter('mine')}
                      >
                        View all your posts
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            )}
            
            {/* Featured Posts */}
            <Card>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-600" />
                  Featured Stories
                </h3>
                <div className="space-y-4">
                  {posts
                    .filter(post => post.metadata?.featured)
                    .slice(0, 3)
                    .map((post) => (
                      <Link 
                        key={post.id}
                        to={`/blog/post/${post.id}`}
                        className="flex items-start space-x-3 group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                          {post.image_url && !imageErrors[post.id] ? (
                            <img 
                              src={post.image_url} 
                              alt={post.title} 
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(post.id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-yellow-100">
                              <Award size={20} className="text-yellow-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 group-hover:text-lavender-600 transition-colors">
                            {post.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <User size={12} className="mr-1" />
                            {post.author?.full_name || 'Anonymous'}
                            <span className="mx-2">•</span>
                            <ThumbsUp size={12} className="mr-1" />
                            {post.likes}
                          </div>
                        </div>
                      </Link>
                    ))}
                  
                  {posts.filter(post => post.metadata?.featured).length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Check back soon for featured posts!
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Create Post CTA */}
            <Card className="bg-gradient-to-r from-lavender-50 to-sage-50 border border-lavender-200">
              <div className="p-5 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-lavender-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Your Story</h3>
                <p className="text-gray-600 mb-4">
                  Your journey can inspire others. Share your experiences, challenges, and victories.
                </p>
                <Link to="/blog/create">
                  <Button
                    variant="primary"
                    leftIcon={<Plus size={18} />}
                    className="bg-gradient-to-r from-lavender-500 to-sage-500"
                  >
                    Create New Post
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );