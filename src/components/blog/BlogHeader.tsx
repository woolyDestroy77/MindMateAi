import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  Users, 
  MessageSquare, 
  Bell, 
  Search,
  User
} from 'lucide-react';
import Button from '../ui/Button';
import { useBlogSocial } from '../../hooks/useBlogSocial';
import FollowersList from './FollowersList';
import MessagesDrawer from './MessagesDrawer';
import SendMessageModal from './SendMessageModal';

interface BlogHeaderProps {
  onSearch?: (term: string) => void;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ onSearch }) => {
  const { 
    followers, 
    following, 
    unreadMessageCount, 
    isLoading, 
    followUser, 
    unfollowUser, 
    isFollowing,
    setConversation
  } = useBlogSocial();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string}>({id: '', name: ''});
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };
  
  const handleMessageUser = (userId: string, userName: string) => {
    setSelectedUser({id: userId, name: userName});
    setShowSendMessage(true);
    setShowFollowers(false);
    setShowFollowing(false);
  };
  
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-6">
            <Link to="/blog" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-lavender-600" />
              <span className="text-xl font-bold text-gray-900">Community</span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <button 
                onClick={() => setShowFollowers(true)}
                className="text-gray-600 hover:text-lavender-600 flex items-center space-x-1"
              >
                <Users size={18} />
                <span>{followers.length} Followers</span>
              </button>
              
              <button 
                onClick={() => setShowFollowing(true)}
                className="text-gray-600 hover:text-lavender-600 flex items-center space-x-1"
              >
                <Users size={18} />
                <span>{following.length} Following</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent w-64"
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </form>
            
            <button 
              onClick={() => setShowMessages(true)}
              className="relative p-2 text-gray-600 hover:text-lavender-600 hover:bg-lavender-50 rounded-full transition-colors"
            >
              <MessageSquare size={20} />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </button>
            
            <Link to="/blog/create">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={16} />}
                className="bg-gradient-to-r from-lavender-500 to-sage-500"
              >
                Create Post
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile Search - Shown below header on small screens */}
      <div className="md:hidden mt-4 px-4">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent w-full"
          />
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </form>
      </div>
      
      {/* Followers Modal */}
      <FollowersList
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        followers={followers}
        isLoading={isLoading}
        onFollow={followUser}
        onUnfollow={unfollowUser}
        onMessage={handleMessageUser}
        isFollowing={isFollowing}
        title="Followers"
      />
      
      {/* Following Modal */}
      <FollowersList
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        followers={following}
        isLoading={isLoading}
        onFollow={followUser}
        onUnfollow={unfollowUser}
        onMessage={handleMessageUser}
        isFollowing={isFollowing}
        title="Following"
      />
      
      {/* Messages Drawer */}
      <MessagesDrawer
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
      />
      
      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={showSendMessage}
        onClose={() => setShowSendMessage(false)}
        recipientId={selectedUser.id}
        recipientName={selectedUser.name}
      />
    </div>
  );
};

export default BlogHeader;