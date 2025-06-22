import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MessageSquare, 
  Tag, 
  User, 
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { BlogPost } from '../../hooks/useBlog';
import { useAuth } from '../../hooks/useAuth';

interface BlogCardProps {
  post: BlogPost;
  onLike: (postId: string) => Promise<void>;
  isLiked: boolean;
}

const BlogCard: React.FC<BlogCardProps> = ({ post, onLike, isLiked }) => {
  const { user } = useAuth();
  
  // Get excerpt from content
  const getExcerpt = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow overflow-hidden"
    >
      {/* Featured Badge */}
      {post.metadata?.featured && (
        <div className="bg-yellow-500 text-white px-4 py-1 text-center text-sm font-medium flex items-center justify-center">
          Featured Story
        </div>
      )}
      
      <div className="p-6">
        {/* Author and Date */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-lavender-100 flex-shrink-0">
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
            <div className="text-xs text-gray-500 flex items-center">
              <Calendar size={12} className="mr-1" />
              {format(parseISO(post.created_at), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
        
        {/* Title */}
        <Link to={`/blog/post/${post.id}`}>
          <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-lavender-600 transition-colors">
            {post.title}
          </h2>
        </Link>
        
        {/* Content Preview */}
        <p className="text-gray-600 mb-4">
          {getExcerpt(post.content)}
          {post.content.length > 150 && (
            <Link to={`/blog/post/${post.id}`} className="text-lavender-600 hover:text-lavender-800 ml-1">
              Read more
            </Link>
          )}
        </p>
        
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/blog?tag=${tag}`}
                className="bg-lavender-50 text-lavender-700 px-2 py-1 rounded-full text-xs flex items-center hover:bg-lavender-100 transition-colors"
              >
                <Tag size={12} className="mr-1" />
                {tag}
              </Link>
            ))}
          </div>
        )}
        
        {/* Metadata */}
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
              onClick={() => onLike(post.id)}
              className={`flex items-center space-x-1 text-sm ${
                isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
              }`}
              disabled={!user}
              aria-label={isLiked ? "Unlike post" : "Like post"}
            >
              <Heart size={16} className={isLiked ? 'fill-current' : ''} />
              <span>{post.likes}</span>
            </button>
            
            <Link 
              to={`/blog/post/${post.id}#comments`}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-lavender-600"
              aria-label="View comments"
            >
              <MessageSquare size={16} />
              <span>{post.comments_count}</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BlogCard;