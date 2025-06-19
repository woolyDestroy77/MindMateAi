import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Tag, 
  BookOpen, 
  Award, 
  User, 
  Calendar, 
  Heart, 
  MessageSquare, 
  Plus,
  TrendingUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { BlogPost } from '../../hooks/useBlog';

interface BlogSidebarProps {
  popularTags: { tag: string; count: number }[];
  userPosts: BlogPost[];
  featuredPosts: BlogPost[];
  onTagSelect: (tag: string) => void;
  selectedTag: string | null;
}

const BlogSidebar: React.FC<BlogSidebarProps> = ({ 
  popularTags, 
  userPosts, 
  featuredPosts, 
  onTagSelect,
  selectedTag
}) => {
  return (
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
                onClick={() => onTagSelect(tag)}
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
                >
                  View all your posts
                </Link>
              )}
            </div>
          </div>
        </Card>
      )}
      
      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <Card>
          <div className="p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-600" />
              Featured Stories
            </h3>
            <div className="space-y-4">
              {featuredPosts.slice(0, 3).map((post) => (
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
                      <Heart size={12} className="mr-1" />
                      {post.likes}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}
      
      {/* Popular Posts */}
      <Card>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Popular This Week
          </h3>
          <div className="space-y-4">
            {/* This would be populated with actual popular posts */}
            <div className="text-center py-4 text-gray-500 text-sm">
              Check back soon for popular posts!
            </div>
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
  );
};

export default BlogSidebar;