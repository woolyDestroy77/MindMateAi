import React, { useState } from 'react';
import { User, Calendar, MapPin, Users, Heart, MessageSquare, Edit, UserPlus, UserMinus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useBlogSocial } from '../../hooks/useBlogSocial';
import { toast } from 'react-hot-toast';

interface UserProfileCardProps {
  userId: string;
  userName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  createdAt?: string;
  postCount: number;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  userId,
  userName,
  avatarUrl,
  bio,
  location,
  createdAt,
  postCount
}) => {
  const { user } = useAuth();
  const { 
    isFollowing, 
    followUser, 
    unfollowUser
  } = useBlogSocial();
  
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  // Check if current user is following this profile
  React.useEffect(() => {
    setIsFollowingUser(isFollowing(userId));
  }, [userId, isFollowing]);
  
  // Handle follow toggle
  const handleFollowToggle = async () => {
    if (isLoading || !user) return;
    
    setIsLoading(true);
    try {
      if (isFollowingUser) {
        await unfollowUser(userId);
        setIsFollowingUser(false);
        toast.success(`Unfollowed ${userName}`);
      } else {
        await followUser(userId);
        setIsFollowingUser(true);
        toast.success(`Now following ${userName}`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle message user
  const handleMessageUser = () => {
    // This will be implemented in a separate component
    window.location.href = `/blog/messages?user=${userId}`;
  };
  
  const isCurrentUser = user?.id === userId;
  
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-lavender-500 to-sage-500 h-24"></div>
      <div className="px-6 pb-6">
        <div className="flex justify-between -mt-12">
          <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden bg-white">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={userName} 
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-lavender-100">
                <User size={40} className="text-lavender-500" />
              </div>
            )}
          </div>
          
          {!isCurrentUser && user && (
            <div className="flex space-x-2 mt-2">
              <Button
                variant={isFollowingUser ? "outline" : "primary"}
                size="sm"
                onClick={handleFollowToggle}
                isLoading={isLoading}
                leftIcon={isFollowingUser ? <UserMinus size={16} /> : <UserPlus size={16} />}
              >
                {isFollowingUser ? 'Unfollow' : 'Follow'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleMessageUser}
                leftIcon={<MessageSquare size={16} />}
              >
                Message
              </Button>
            </div>
          )}
          
          {isCurrentUser && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit size={16} />}
              className="mt-2"
            >
              Edit Profile
            </Button>
          )}
        </div>
        
        <div className="mt-4">
          <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
          
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Users size={16} className="mr-1" />
              <span>{followerCount} followers</span>
            </div>
            <div className="flex items-center">
              <Users size={16} className="mr-1" />
              <span>{followingCount} following</span>
            </div>
            <div className="flex items-center">
              <Heart size={16} className="mr-1" />
              <span>{postCount} posts</span>
            </div>
          </div>
          
          {bio && (
            <p className="mt-3 text-gray-700">{bio}</p>
          )}
          
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            {location && (
              <div className="flex items-center">
                <MapPin size={14} className="mr-1" />
                <span>{location}</span>
              </div>
            )}
            
            {createdAt && (
              <div className="flex items-center">
                <Calendar size={14} className="mr-1" />
                <span>Joined {format(parseISO(createdAt), 'MMMM yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UserProfileCard;