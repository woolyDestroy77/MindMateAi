import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, UserPlus, UserMinus, MessageSquare } from 'lucide-react';
import Button from '../ui/Button';
import { Follower } from '../../hooks/useBlogSocial';
import { useAuth } from '../../hooks/useAuth';

interface FollowersListProps {
  isOpen: boolean;
  onClose: () => void;
  followers: Follower[];
  isLoading: boolean;
  onFollow: (userId: string, userName: string) => Promise<boolean>;
  onUnfollow: (userId: string, userName: string) => Promise<boolean>;
  onMessage: (userId: string, userName: string) => void;
  isFollowing: (userId: string) => boolean;
  title?: string;
}

const FollowersList: React.FC<FollowersListProps> = ({
  isOpen,
  onClose,
  followers,
  isLoading,
  onFollow,
  onUnfollow,
  onMessage,
  isFollowing,
  title = 'Followers'
}) => {
  const { user } = useAuth();
  
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
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </div>
              ) : followers.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No {title.toLowerCase()} yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {followers.map((follower) => {
                    const followData = 'follower' in follower ? follower.follower : follower.following;
                    const userId = followData?.id || '';
                    const userName = followData?.full_name || 'Anonymous';
                    const avatarUrl = followData?.avatar_url;
                    const isCurrentUser = user?.id === userId;
                    const isFollowingThisUser = isFollowing(userId);
                    
                    return (
                      <div key={follower.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-lavender-100">
                            {avatarUrl ? (
                              <img 
                                src={avatarUrl} 
                                alt={userName} 
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
                            <div className="font-medium text-gray-900">{userName}</div>
                          </div>
                        </div>
                        
                        {!isCurrentUser && (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onMessage(userId, userName)}
                              leftIcon={<MessageSquare size={14} />}
                            >
                              Message
                            </Button>
                            
                            {isFollowingThisUser ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUnfollow(userId, userName)}
                                leftIcon={<UserMinus size={14} />}
                              >
                                Unfollow
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onFollow(userId, userName)}
                                leftIcon={<UserPlus size={14} />}
                              >
                                Follow
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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

export default FollowersList;