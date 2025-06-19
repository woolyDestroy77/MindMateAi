import React from 'react';
import { motion } from 'framer-motion';
import { User, Trash2, Heart, Reply } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { BlogComment as BlogCommentType } from '../../hooks/useBlog';
import { useAuth } from '../../hooks/useAuth';

interface BlogCommentProps {
  comment: BlogCommentType;
  onDelete: (commentId: string) => Promise<void>;
  onReply?: (authorName: string) => void;
}

const BlogComment: React.FC<BlogCommentProps> = ({ comment, onDelete, onReply }) => {
  const { user } = useAuth();
  
  return (
    <motion.div
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
                onClick={() => onDelete(comment.id)}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Delete comment"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <p className="mt-2 text-gray-700">{comment.content}</p>
          
          {/* Comment actions */}
          <div className="mt-3 flex space-x-4">
            <button className="text-xs text-gray-500 hover:text-red-600 flex items-center space-x-1">
              <Heart size={12} />
              <span>Like</span>
            </button>
            
            {onReply && (
              <button 
                onClick={() => onReply(comment.author?.full_name || 'Anonymous')}
                className="text-xs text-gray-500 hover:text-lavender-600 flex items-center space-x-1"
              >
                <Reply size={12} />
                <span>Reply</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BlogComment;