import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ThumbsUp
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import BlogCard from '../components/blog/BlogCard';
import { useBlog } from '../hooks/useBlog';
import { useAuth } from '../hooks/useAuth';
import { format, parseISO } from 'date-fns';

const Blog = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { posts, userPosts, isLoading, fetchPosts, likePost, checkUserLiked, popularTags } = useBlog();
  const { user, userProfile } = useAuth();
  const [filter, setFilter] = useState<'all' | 'featured' | 'popular' | 'mine'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  
  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tagParam = params.get('tag');
    const filterParam = params.get('filter') as 'all' | 'featured' | 'popular' | 'mine' | null;
    const searchParam = params.get('search');
    
    if (tagParam) {
      setSelectedTag(tagParam);
    }
    
    if (filterParam && ['all', 'featured', 'popular', 'mine'].includes(filterParam)) {
      setFilter(filterParam);
    }
    
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [location.search]);
  
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

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    navigate(`/blog?search=${encodeURIComponent(term)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16"> {/* Add padding to account for fixed navbar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading blog posts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16"> {/* Add padding to account for fixed navbar */}
        <header className="bg-white shadow-sm sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo */}
              <Link to="/blog" className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-lavender-600" />
                <span className="text-xl font-bold text-gray-900">PureMind Blog</span>
              </Link>

              {/* Search */}
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchTerm); }} className="relative max-w-xs w-full mx-4 hidden md:block">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </form>

              {/* Create Post Button */}
              <div className="flex items-center">
                <Link to="/blog/create">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={16} />}
                    className="bg-lavender-600 hover:bg-lavender-700"
                  >
                    Create Post
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Search - Only visible on small screens */}
          <div className="mb-4 md:hidden">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchTerm); }} className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </form>
          </div>

          {/* Filters */}
          <div className="mb-8 bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFilter('all');
                  setSelectedTag(null);
                  navigate('/blog');
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
                  navigate('/blog?filter=featured');
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
                  navigate('/blog?filter=popular');
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
                  navigate('/blog?filter=mine');
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
                    onClick={() => {
                      setSelectedTag(null);
                      navigate('/blog');
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              )}
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
                    <BlogCard 
                      key={post.id} 
                      post={post} 
                      onLike={handleLike} 
                      isLiked={likedPosts[post.id] || false} 
                    />
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
                    {popularTags.map(({ tag, count }) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(tag);
                          navigate(`/blog?tag=${encodeURIComponent(tag)}`);
                        }}
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
                            {post.image_url ? (
                              <img 
                                src={post.image_url} 
                                alt={post.title} 
                                className="w-full h-full object-cover"
                                loading="lazy"
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
                          <div className="w-12 h-12 rounded-lg bg-yellow-100 flex-shrink-0 flex items-center justify-center">
                            <Award size={20} className="text-yellow-600" />
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
    </div>
  );
};

export default Blog;