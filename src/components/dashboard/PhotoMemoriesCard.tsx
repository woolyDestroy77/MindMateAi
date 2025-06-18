import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Calendar, ChevronLeft, ChevronRight, Lock, Globe, Tag } from 'lucide-react';
import Card from '../ui/Card';
import { format, parseISO } from 'date-fns';

interface Photo {
  id: string;
  url: string;
  title: string;
  date: string;
  privacy: string;
  tags: string[];
}

interface PhotoMemoriesCardProps {
  photos: Photo[];
}

const PhotoMemoriesCard: React.FC<PhotoMemoriesCardProps> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullView, setShowFullView] = useState(false);
  const [fullViewIndex, setFullViewIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <Card variant="elevated" className="h-full">
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <Image className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No memories yet</h3>
          <p className="text-sm text-gray-600">
            Add photos to your journal entries to see them here
          </p>
        </div>
      </Card>
    );
  }

  const sortedPhotos = [...photos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const currentPhoto = sortedPhotos[currentIndex];
  
  const nextPhoto = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === sortedPhotos.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const prevPhoto = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? sortedPhotos.length - 1 : prevIndex - 1
    );
  };

  const openFullView = (index: number) => {
    setFullViewIndex(index);
    setShowFullView(true);
  };

  return (
    <Card variant="elevated" className="h-full">
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Image className="w-5 h-5 mr-2 text-lavender-600" />
            Photo Memories
          </h2>
          <div className="text-sm text-gray-500">
            {sortedPhotos.length} photo{sortedPhotos.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Featured Photo */}
        <div className="relative">
          <div 
            className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
            onClick={() => openFullView(currentIndex)}
          >
            <img 
              src={currentPhoto.url} 
              alt={currentPhoto.title} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Navigation Buttons */}
          <button 
            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1 bg-white/80 rounded-full shadow-md hover:bg-white"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-white/80 rounded-full shadow-md hover:bg-white"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>
          
          {/* Privacy Badge */}
          <div className="absolute top-2 right-2">
            <span className={`text-xs px-2 py-1 rounded-full flex items-center ${
              currentPhoto.privacy === 'private' 
                ? 'bg-gray-800/70 text-white' 
                : 'bg-green-800/70 text-white'
            }`}>
              {currentPhoto.privacy === 'private' ? (
                <>
                  <Lock size={10} className="mr-1" />
                  Private
                </>
              ) : (
                <>
                  <Globe size={10} className="mr-1" />
                  Shared
                </>
              )}
            </span>
          </div>
        </div>
        
        {/* Photo Info */}
        <div>
          <h3 className="font-medium text-gray-900">{currentPhoto.title}</h3>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <Calendar size={14} className="mr-1" />
            <span>{format(parseISO(currentPhoto.date), 'MMMM d, yyyy')}</span>
          </div>
          
          {/* Tags */}
          {currentPhoto.tags && currentPhoto.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {currentPhoto.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-lavender-50 text-lavender-700 px-2 py-0.5 rounded-full text-xs flex items-center"
                >
                  <Tag size={10} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Thumbnail Navigation */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {sortedPhotos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden ${
                index === currentIndex ? 'ring-2 ring-lavender-500' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img 
                src={photo.url} 
                alt={photo.title} 
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Full View Modal */}
      <AnimatePresence>
        {showFullView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFullView(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={sortedPhotos[fullViewIndex].url} 
                alt={sortedPhotos[fullViewIndex].title} 
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => setShowFullView(false)}
                  className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 rounded-b-lg">
                <h3 className="font-medium text-lg">{sortedPhotos[fullViewIndex].title}</h3>
                <div className="flex items-center text-sm mt-1">
                  <Calendar size={14} className="mr-1" />
                  <span>{format(parseISO(sortedPhotos[fullViewIndex].date), 'MMMM d, yyyy')}</span>
                  <span className="mx-2">•</span>
                  <span className="flex items-center">
                    {sortedPhotos[fullViewIndex].privacy === 'private' ? (
                      <>
                        <Lock size={14} className="mr-1" />
                        Private
                      </>
                    ) : (
                      <>
                        <Globe size={14} className="mr-1" />
                        Shared
                      </>
                    )}
                  </span>
                </div>
                
                {sortedPhotos[fullViewIndex].tags && sortedPhotos[fullViewIndex].tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sortedPhotos[fullViewIndex].tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs flex items-center"
                      >
                        <Tag size={10} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Navigation Buttons */}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setFullViewIndex(prev => prev === 0 ? sortedPhotos.length - 1 : prev - 1);
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setFullViewIndex(prev => prev === sortedPhotos.length - 1 ? 0 : prev + 1);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <ChevronRight size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default PhotoMemoriesCard;