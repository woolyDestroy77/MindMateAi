import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Tag, 
  X, 
  ArrowLeft, 
  Heart, 
  MapPin, 
  Smile, 
  Eye, 
  EyeOff, 
  Calendar,
  Info,
  User
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import { useBlog } from '../hooks/useBlog';
import { useAddictionSupport } from '../hooks/useAddictionSupport';
import { useNotificationContext } from '../components/notifications/NotificationProvider';

const CreateBlogPost = () => {
  const navigate = useNavigate();
  const { createPost } = useBlog();
  const { userAddictions } = useAddictionSupport();
  const { createAchievement } = useNotificationContext();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadata, setMetadata] = useState({
    location: '',
    mood: '😊',
    recovery_day: userAddictions.length > 0 ? userAddictions[0].days_clean : undefined,
    privacy: 'public' as 'public' | 'private' | 'followers'
  });

  // Common tags for addiction and mental health
  const commonTags = [
    'recovery', 'sobriety', 'mentalhealth', 'anxiety', 'depression', 
    'selfcare', 'wellness', 'mindfulness', 'therapy', 'progress',
    'gratitude', 'inspiration', 'motivation', 'community', 'support'
  ];

  // Moods
  const moods = ['😊', '😌', '😐', '😕', '😢', '😠', '😴', '🤔', '😰', '🥰', '🤩'];

  // Add tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Add common tag
  const addCommonTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Please provide both a title and content for your post.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newPost = await createPost(
        title.trim(),
        content.trim(),
        tags,
        metadata
      );
      
      if (newPost) {
        // Create achievement notification for first post
        createAchievement(
          'First Blog Post!',
          'You\'ve shared your story with the community. Your experiences can inspire others.',
          {
            actionUrl: `/blog/post/${newPost.id}`,
            actionText: 'View Post'
          }
        );
        
        // Navigate to the new post
        navigate(`/blog/post/${newPost.id}`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Back Button */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/blog')}
            className="inline-flex items-center text-lavender-600 hover:text-lavender-800"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Blog
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="mr-3 text-lavender-600" size={24} />
              Create New Blog Post
            </h1>
            <p className="text-gray-600 mt-1">
              Share your story, experiences, and insights with the community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Post Title*
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title for your post"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Post Content*
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your story, experiences, or insights..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                  rows={12}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tip: Use line breaks to separate paragraphs and make your post more readable.
                </p>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (Press Enter to add)
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Tag size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tags to help others find your post"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Selected Tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-lavender-100 text-lavender-800 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-lavender-600 hover:text-lavender-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                
                {/* Common Tags */}
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2">Common tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addCommonTag(tag)}
                        disabled={tags.includes(tag)}
                        className={`text-xs px-2 py-1 rounded-full ${
                          tags.includes(tag)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Metadata Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="text-sm text-lavender-600 hover:text-lavender-800 font-medium flex items-center"
                >
                  {showMetadata ? 'Hide additional details' : 'Add additional details'}
                  <span className="ml-1 text-xs">{showMetadata ? '▲' : '▼'}</span>
                </button>
                
                {showMetadata && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
                      {/* Location */}
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <MapPin size={16} className="mr-1 text-gray-500" />
                          Location (Optional)
                        </label>
                        <input
                          type="text"
                          id="location"
                          value={metadata.location}
                          onChange={(e) => setMetadata({...metadata, location: e.target.value})}
                          placeholder="e.g., New York, Remote, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Mood */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <Smile size={16} className="mr-1 text-gray-500" />
                          Current Mood
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {moods.map((mood) => (
                            <button
                              key={mood}
                              type="button"
                              onClick={() => setMetadata({...metadata, mood})}
                              className={`text-2xl p-2 rounded-full transition-all ${
                                metadata.mood === mood
                                  ? 'bg-lavender-100 scale-110 shadow-sm'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {mood}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Recovery Day */}
                      {userAddictions.length > 0 && (
                        <div>
                          <label htmlFor="recovery_day" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Heart size={16} className="mr-1 text-gray-500" />
                            Recovery Day
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              id="recovery_day"
                              value={metadata.recovery_day}
                              onChange={(e) => setMetadata({...metadata, recovery_day: parseInt(e.target.value) || 0})}
                              min="0"
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                            />
                            <span className="text-sm text-gray-600">
                              Current: Day {userAddictions[0].days_clean}
                            </span>
                            <button
                              type="button"
                              onClick={() => setMetadata({...metadata, recovery_day: userAddictions[0].days_clean})}
                              className="text-xs text-lavender-600 hover:text-lavender-800"
                            >
                              Use current
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Privacy Setting */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <Eye size={16} className="mr-1 text-gray-500" />
                          Privacy Setting
                        </label>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setMetadata({...metadata, privacy: 'public'})}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center ${
                              metadata.privacy === 'public'
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Eye size={16} className="mr-1" />
                            Public
                          </button>
                          <button
                            type="button"
                            onClick={() => setMetadata({...metadata, privacy: 'followers'})}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center ${
                              metadata.privacy === 'followers'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <User size={16} className="mr-1" />
                            Followers
                          </button>
                          <button
                            type="button"
                            onClick={() => setMetadata({...metadata, privacy: 'private'})}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center ${
                              metadata.privacy === 'private'
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <EyeOff size={16} className="mr-1" />
                            Private
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 flex items-center">
                          <Info size={12} className="mr-1" />
                          {metadata.privacy === 'public' 
                            ? 'Anyone can view this post' 
                            : metadata.privacy === 'followers' 
                              ? 'Only your followers can view this post' 
                              : 'Only you can view this post'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/blog')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={!title.trim() || !content.trim() || isSubmitting}
                  className="bg-gradient-to-r from-lavender-500 to-sage-500"
                >
                  Publish Post
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateBlogPost;