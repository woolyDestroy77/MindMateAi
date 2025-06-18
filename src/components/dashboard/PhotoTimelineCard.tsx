import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Image, ChevronLeft, ChevronRight, Tag, Lock, Globe } from 'lucide-react';
import Card from '../ui/Card';
import { format, parseISO, isThisMonth, isThisYear, subMonths } from 'date-fns';

interface Photo {
  id: string;
  url: string;
  title: string;
  date: string;
  privacy: string;
  tags: string[];
}

interface PhotoTimelineCardProps {
  photos: Photo[];
  title?: string;
}

const PhotoTimelineCard: React.FC<PhotoTimelineCardProps> = ({ 
  photos, 
  title = "Photo Memories Timeline" 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (photos.length === 0) {
    return (
      <Card variant="elevated" className="h-full">
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <Image className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No timeline memories yet</h3>
          <p className="text-sm text-gray-600">
            Add photos to your journal entries to build your memory timeline
          </p>
        </div>
      </Card>
    );
  }

  // Group photos by month
  const groupPhotosByMonth = () => {
    const grouped: { [key: string]: Photo[] } = {};
    
    photos.forEach(photo => {
      const date = parseISO(photo.date);
      const monthKey = format(date, 'yyyy-MM');
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      
      grouped[monthKey].push(photo);
    });
    
    return grouped;
  };

  const photosByMonth = groupPhotosByMonth();
  
  // Get months with photos
  const monthsWithPhotos = Object.keys(photosByMonth).sort().reverse();
  
  // Get current month key
  const currentMonthKey = format(currentMonth, 'yyyy-MM');
  
  // Get photos for current month
  const currentMonthPhotos = photosByMonth[currentMonthKey] || [];
  
  // Navigation functions
  const goToPreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };
  
  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Check if navigation is possible
  const canGoBack = monthsWithPhotos.some(month => month < currentMonthKey);
  const canGoForward = monthsWithPhotos.some(month => month > currentMonthKey);

  // Format month display
  const formatMonthDisplay = (date: Date) => {
    if (isThisMonth(date)) {
      return 'This Month';
    } else if (isThisYear(date)) {
      return format(date, 'MMMM');
    } else {
      return format(date, 'MMMM yyyy');
    }
  };

  return (
    <Card variant="elevated" className="h-full">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-lavender-600" />
            {title}
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              disabled={!canGoBack}
              className={`p-1 rounded-full ${
                canGoBack 
                  ? 'text-gray-700 hover:bg-gray-100' 
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            
            <span className="text-sm font-medium text-gray-700">
              {formatMonthDisplay(currentMonth)}
            </span>
            
            <button
              onClick={goToNextMonth}
              disabled={!canGoForward}
              className={`p-1 rounded-full ${
                canGoForward 
                  ? 'text-gray-700 hover:bg-gray-100' 
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {currentMonthPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Image className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm text-gray-600">
              No photos for {format(currentMonth, 'MMMM yyyy')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline View */}
            <div className="relative pl-6 border-l-2 border-lavender-200 space-y-6">
              {currentMonthPhotos.map((photo, index) => {
                const date = parseISO(photo.date);
                const dayDisplay = format(date, 'MMMM d');
                
                return (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-lavender-500 border-2 border-white"></div>
                    
                    {/* Date */}
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {dayDisplay}
                    </div>
                    
                    {/* Photo Card */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                        <img 
                          src={photo.url} 
                          alt={photo.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-900">{photo.title}</h3>
                          <span className="text-xs flex items-center">
                            {photo.privacy === 'private' ? (
                              <Lock size={12} className="text-gray-500" />
                            ) : (
                              <Globe size={12} className="text-green-500" />
                            )}
                          </span>
                        </div>
                        
                        {photo.tags && photo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {photo.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span 
                                key={tagIndex}
                                className="bg-lavender-50 text-lavender-700 px-2 py-0.5 rounded-full text-xs flex items-center"
                              >
                                <Tag size={10} className="mr-1" />
                                {tag}
                              </span>
                            ))}
                            {photo.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{photo.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Month Navigation */}
        {monthsWithPhotos.length > 1 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-700 mb-2">Jump to month:</div>
            <div className="flex flex-wrap gap-2">
              {monthsWithPhotos.slice(0, 6).map(monthKey => {
                const date = parseISO(`${monthKey}-01`);
                return (
                  <button
                    key={monthKey}
                    onClick={() => setCurrentMonth(date)}
                    className={`text-xs px-2 py-1 rounded-full ${
                      monthKey === currentMonthKey
                        ? 'bg-lavender-100 text-lavender-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {format(date, 'MMM yyyy')}
                  </button>
                );
              })}
              {monthsWithPhotos.length > 6 && (
                <span className="text-xs text-gray-500">
                  +{monthsWithPhotos.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PhotoTimelineCard;