import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Search, UserPlus, UserMinus, MessageSquare } from 'lucide-react';
import Button from '../ui/Button';
import { Follower, Following, useBlogSocial } from '../../hooks/useBlogSocial';
import { useAuth } from '../../hooks/useAuth';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'followers' | 'following';
  onChangeTab: (tab: 'followers' | 'following') => void;
  followers: Follower[];
  following: Following[];
}

const FollowersModal: React.FC<FollowersModalProps> = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  onChangeTab,
  followers,
  following
}) => {
  const { user } = useAuth();
  const { followUser, unfollowUser, isFollowing } = useBlogSocial();
  
  const [searchTerm, setSearchTerm] = useState('');

  // Filter users by search term
  const filteredFollowers = searchTerm
    ? followers.filter(f => 
        f.follower?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : followers;

  const filteredFollowing = searchTerm
    ? following.filter(f => 
        f.following?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : following;

  const handleFollow = async (userId: string) => {
    await followUser(userId);
  };

  const handleUnfollow = async (userId: string) => {
    await unfollowUser(userId);
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
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {activeTab === 'followers' ? 'Followers' : 'Following'}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => onChangeTab('followers')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'followers'
                      ? 'text-lavender-600 border-b-2 border-lavender-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Followers ({followers.length})
                </button>
                <button
                  onClick={() => onChangeTab('following')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'following'
                      ? 'text-lavender-600 border-b-2 border-lavender-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Following ({following.length})
                </button>
              </div>

              {/* Search */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                />
              </div>

              {/* User List */}
              <div className="max-h-96 overflow-y-auto">
                {activeTab === 'followers' ? (
                  filteredFollowers.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">
                        {searchTerm ? 'No followers match your search' : 'No followers yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredFollowers.map(follower => (
                        <div key={follower.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-lavender-100 flex-shrink-0">
                              {follower.follower?.avatar_url ? (
                                <img 
                                  src={follower.follower.avatar_url} 
                                  alt={follower.follower.full_name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-full h-full p-2 text-lavender-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{follower.follower?.full_name}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {isFollowing(follower.follower_id) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnfollow(follower.follower_id)}
                                leftIcon={<UserMinus size={16} />}
                              >
                                Unfollow
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFollow(follower.follower_id)}
                                leftIcon={<UserPlus size={16} />}
                              >
                                Follow
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Open message modal with this user
                                onClose();
                                // You would need to implement this functionality
                              }}
                              leftIcon={<MessageSquare size={16} />}
                            >
                              Message
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  filteredFollowing.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">
                        {searchTerm ? 'No following match your search' : 'Not following anyone yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredFollowing.map(follow => (
                        <div key={follow.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-lavender-100 flex-shrink-0">
                              {follow.following?.avatar_url ? (
                                <img 
                                  src={follow.following.avatar_url} 
                                  alt={follow.following.full_name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-full h-full p-2 text-lavender-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{follow.following?.full_name}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnfollow(follow.following_id)}
                              leftIcon={<UserMinus size={16} />}
                            >
                              Unfollow
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Open message modal with this user
                                onClose();
                                // You would need to implement this functionality
                              }}
                              leftIcon={<MessageSquare size={16} />}
                            >
                              Message
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FollowersModal;