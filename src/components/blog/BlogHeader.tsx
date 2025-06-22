import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  MessageSquare, 
  Bell, 
  User, 
  Users, 
  Heart, 
  Search, 
  Menu, 
  X 
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
  const { user, userProfile } = useAuth();
  const { unreadCount, followers, following, messages } = useBlogSocial();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/blog" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-lavender-600" />
            <span className="text-xl font-bold text-gray-900">PureMind Blog</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Search */}
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
            <nav className="flex items-center space-x-4">
              <Link to="/blog" className="text-gray-700 hover:text-lavender-600 transition-colors">
                Home
              </Link>
              <Link to="/blog?filter=popular" className="text-gray-700 hover:text-lavender-600 transition-colors">
                Popular
              </Link>
              <Link to="/blog?filter=mine" className="text-gray-700 hover:text-lavender-600 transition-colors">
                My Posts
              </Link>
              <Link to="/blog/create" className="text-gray-700 hover:text-lavender-600 transition-colors">
                Write
              </Link>
            </nav>

            {/* User Actions */}
            {user && (
              <div className="flex items-center space-x-4">
                {/* Messages */}
                <button
                  onClick={() => setShowMessagesModal(true)}
                  className="relative p-2 text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 rounded-full transition-colors"
                >
                  <MessageSquare size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Followers */}
                <button
                  onClick={() => {
                    setActiveTab('followers');
                    setShowFollowersModal(true);
                  }}
                  className="relative p-2 text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 rounded-full transition-colors"
                >
                  <Users size={20} />
                  {followers.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-lavender-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {followers.length > 9 ? '9+' : followers.length}
                    </span>
                  )}
                </button>

                {/* Following */}
                <button
                  onClick={() => {
                    setActiveTab('following');
                    setShowFollowersModal(true);
                  }}
                  className="relative p-2 text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 rounded-full transition-colors"
                >
                  <Heart size={20} />
                  <span className="absolute -top-1 -right-1 bg-lavender-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {following.length > 9 ? '9+' : following.length}
                  </span>
                </button>

                {/* Profile */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center">
                    {userProfile?.avatar_url ? (
                      <img 
                        src={userProfile.avatar_url} 
                        alt={userProfile.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-lavender-600" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Auth Buttons */}
            {!user && (
              <div className="flex items-center space-x-2">
                <Link to="/">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/blog" 
                className="text-gray-700 hover:text-lavender-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/blog?filter=popular" 
                className="text-gray-700 hover:text-lavender-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Popular
              </Link>
              <Link 
                to="/blog?filter=mine" 
                className="text-gray-700 hover:text-lavender-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                My Posts
              </Link>
              <Link 
                to="/blog/create" 
                className="text-gray-700 hover:text-lavender-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Write
              </Link>

              {user && (
                <>
                  <button
                    onClick={() => {
                      setShowMessagesModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-700 hover:text-lavender-600 transition-colors"
                  >
                    <MessageSquare size={18} />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('followers');
                      setShowFollowersModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-700 hover:text-lavender-600 transition-colors"
                  >
                    <Users size={18} />
                    <span>Followers</span>
                    <span className="text-gray-500 text-sm">({followers.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('following');
                      setShowFollowersModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-700 hover:text-lavender-600 transition-colors"
                  >
                    <Heart size={18} />
                    <span>Following</span>
                    <span className="text-gray-500 text-sm">({following.length})</span>
                  </button>
                </>
              )}

              {!user && (
                <div className="flex flex-col space-y-2 pt-2">
                  <Link to="/">
                    <Button variant="outline" fullWidth>
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button variant="primary" fullWidth>
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Modals */}
      {user && (
        <>
          <SendMessageModal
            isOpen={showMessagesModal}
            onClose={() => setShowMessagesModal(false)}
            messages={messages}
          />
          
          <FollowersModal
            isOpen={showFollowersModal}
            onClose={() => setShowFollowersModal(false)}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            followers={followers}
            following={following}
          />
        </>
      )}
    </header>
  );
};

export default BlogHeader;