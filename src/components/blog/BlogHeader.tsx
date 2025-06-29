import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Plus
} from 'lucide-react';
import Button from '../ui/Button';

interface BlogHeaderProps {
  onSearch?: (term: string) => void;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/blog" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-lavender-600" />
            <span className="text-xl font-bold text-gray-900">PureMind Blog</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative max-w-xs w-full mx-4 hidden md:block">
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
  );
};

export default BlogHeader;