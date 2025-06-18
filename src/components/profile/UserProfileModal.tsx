import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, MapPin, Edit, Upload, Trash2, Save, Image } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../ui/Button';
import { useAuth, UserProfile } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateProfile, updateAvatar, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when profile loads or edit mode changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        birthdate: userProfile.birthdate || '',
        location: userProfile.location || '',
        bio: userProfile.bio || ''
      });
    }
  }, [userProfile, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setNewProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setNewProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      console.log('Saving profile with data:', formData);
      
      // First update profile data
      const profileUpdated = await updateProfile(formData);
      
      if (!profileUpdated) {
        throw new Error('Failed to update profile data');
      }
      
      // Then update avatar if changed
      if (newProfileImage) {
        const avatarUrl = await updateAvatar(newProfileImage);
        if (!avatarUrl) {
          toast.error('Profile updated but image upload failed');
        } else {
          console.log('Avatar updated successfully:', avatarUrl);
        }
        
        setNewProfileImage(null);
        setImagePreview(null);
      }
      
      // Refresh profile data to ensure we have the latest
      await refreshProfile();
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewProfileImage(null);
    setImagePreview(null);
    // Reset form data to current profile
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        birthdate: userProfile.birthdate || '',
        location: userProfile.location || '',
        bio: userProfile.bio || ''
      });
    }
  };

  if (!userProfile) return null;

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
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative p-6 border-b border-gray-200">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    leftIcon={<Edit size={16} />}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-lavender-200 overflow-hidden bg-gray-100">
                    {(imagePreview || userProfile.avatar_url) ? (
                      <img 
                        src={imagePreview || userProfile.avatar_url} 
                        alt={userProfile.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-lavender-100">
                        <User size={40} className="text-lavender-500" />
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2 flex space-x-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={triggerFileInput}
                        className="p-2 bg-white rounded-full shadow-md text-lavender-600 hover:text-lavender-700"
                        title="Upload new photo"
                      >
                        <Upload size={16} />
                      </button>
                      {(imagePreview || userProfile.avatar_url) && (
                        <button
                          onClick={handleRemoveImage}
                          className="p-2 bg-white rounded-full shadow-md text-red-600 hover:text-red-700"
                          title="Remove photo"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {userProfile.full_name}
                </h3>
                
                {userProfile.created_at && (
                  <p className="text-sm text-gray-500">
                    Member since {format(new Date(userProfile.created_at), 'MMMM yyyy')}
                  </p>
                )}
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                {isEditing ? (
                  // Edit Mode
                  <>
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={formData.full_name || ''}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth (Optional)
                      </label>
                      <input
                        type="date"
                        id="birthdate"
                        name="birthdate"
                        value={formData.birthdate || ''}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                        Location (Optional)
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location || ''}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                        About You (Optional)
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                        placeholder="Tell us a bit about yourself..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        fullWidth
                        onClick={handleCancel}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        fullWidth
                        onClick={handleSave}
                        isLoading={isLoading}
                        leftIcon={<Save size={18} />}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </>
                ) : (
                  // View Mode
                  <>
                    {userProfile.birthdate && (
                      <div className="flex items-center space-x-3">
                        <Calendar size={20} className="text-gray-400" />
                        <span className="text-gray-700">
                          {format(new Date(userProfile.birthdate), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    
                    {userProfile.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin size={20} className="text-gray-400" />
                        <span className="text-gray-700">{userProfile.location}</span>
                      </div>
                    )}
                    
                    {userProfile.bio && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
                        <p className="text-gray-600">{userProfile.bio}</p>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={onClose}
                      className="mt-4"
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;