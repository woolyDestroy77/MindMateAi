import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Bell, 
  MessageSquare, 
  User, 
  Plus, 
  Menu, 
  X,
  Users
} from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useBlogSocial } from '../../hooks/useBlogSocial';
import SendMessageModal from './SendMessageModal';
import FollowersModal from './FollowersModal';

interface BlogHeaderProps {
  onSearch?: (term: string) => void;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ onSearch }) => {
  const { user } = useAuth();
  const { unreadCount, messages, following, followers, isLoading } = useBlogSocial();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const openMessageModal = (userId?: string) => {
    if (userId) {
      setRecipientId(userId);
    } else {
      setRecipientId(null);
    }
    setShowMessageModal(true);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link to="/blog" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-lavender-600" />
              <span className="font-bold text-xl text-gray-900">Community Blog</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </form>

            {/* Navigation Links */}
            {user && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFollowersModal(true)}
                  className="text-gray-600 hover:text-lavender-600 transition-colors relative"
                  title="Followers & Following"
                >
                  <Users size={20} />
                  {!isLoading && followers.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-lavender-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {followers.length > 9 ? '9+' : followers.length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => openMessageModal()}
                  className="text-gray-600 hover:text-lavender-600 transition-colors relative"
                  title="Messages"
                >
                  <MessageSquare size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
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
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-lavender-600 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </form>

            {user && (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setShowFollowersModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-lavender-50 transition-colors"
                >
                  <Users size={20} className="text-lavender-600" />
                  <span>Followers & Following</span>
                  {!isLoading && followers.length > 0 && (
                    <span className="bg-lavender-500 text-white text-xs rounded-full px-2 py-0.5">
                      {followers.length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => openMessageModal()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-lavender-50 transition-colors"
                >
                  <MessageSquare size={20} className="text-lavender-600" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                <Link to="/blog/create" className="block">
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Plus size={16} />}
                    className="bg-gradient-to-r from-lavender-500 to-sage-500"
                  >
                    Create Post
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showMessageModal && (
        <SendMessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          recipientId={recipientId}
        />
      )}

      {showFollowersModal && (
        <FollowersModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          followers={followers}
          following={following}
        />
      )}
    </header>
  );
};

export default BlogHeader;