import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, UserPlus, UserMinus, MessageSquare } from 'lucide-react';
import Button from '../ui/Button';
import { BlogFollower } from '../../hooks/useBlogSocial';
import { useAuth } from '../../hooks/useAuth';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  followers: BlogFollower[];
  following: BlogFollower[];
  onMessage?: (userId: string) => void;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
}

const FollowersModal: React.FC<FollowersModalProps> = ({ 
  isOpen, 
  onClose,
  followers,
  following,
  onMessage,
  onFollow,
  onUnfollow
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');

  const isFollowing = (userId: string) => {
    return following.some(f => f.following_id === userId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Connections</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('followers')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'followers'
                    ? 'text-lavender-600 border-b-2 border-lavender-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Followers ({followers.length})
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'following'
                    ? 'text-lavender-600 border-b-2 border-lavender-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Following ({following.length})
              </button>
            </div>

            {/* User List */}
            <div className="overflow-y-auto max-h-[60vh]">
              {activeTab === 'followers' ? (
                followers.length > 0 ? (
                  followers.map(follower => (
                    <div key={follower.id} className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                          {follower.follower?.avatar_url ? (
                            <img 
                              src={follower.follower.avatar_url} 
                              alt={follower.follower.full_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-full h-full p-2 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{follower.follower?.full_name}</div>
                          <div className="text-xs text-gray-500">Follows you</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {onMessage && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMessage(follower.follower_id)}
                            title="Send message"
                          >
                            <MessageSquare size={16} />
                          </Button>
                        )}
                        {onFollow && follower.follower_id !== user?.id && (
                          isFollowing(follower.follower_id) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onUnfollow && onUnfollow(follower.follower_id)}
                              title="Unfollow"
                            >
                              <UserMinus size={16} />
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onFollow(follower.follower_id)}
                              title="Follow back"
                            >
                              <UserPlus size={16} />
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>No followers yet</p>
                  </div>
                )
              ) : (
                following.length > 0 ? (
                  following.map(follow => (
                    <div key={follow.id} className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                          {follow.following?.avatar_url ? (
                            <img 
                              src={follow.following.avatar_url} 
                              alt={follow.following.full_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-full h-full p-2 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{follow.following?.full_name}</div>
                          <div className="text-xs text-gray-500">You follow</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {onMessage && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMessage(follow.following_id)}
                            title="Send message"
                          >
                            <MessageSquare size={16} />
                          </Button>
                        )}
                        {onUnfollow && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUnfollow(follow.following_id)}
                            title="Unfollow"
                          >
                            <UserMinus size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>You're not following anyone yet</p>
                  </div>
                )
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <Button
                variant="outline"
                fullWidth
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FollowersModal;