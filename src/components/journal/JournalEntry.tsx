import React, { useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, ChevronDown, ChevronUp, MapPin, Cloud, Zap, Clock, Tag, Calendar, Image, X, Lock, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { JournalEntry as JournalEntryType } from '../../hooks/useJournal';
import Button from '../ui/Button';

interface JournalEntryProps {
  entry: JournalEntryType;
  onEdit: (entry: JournalEntryType) => void;
  onDelete: (id: string) => void;
}

const JournalEntry: React.FC<JournalEntryProps> = ({ entry, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMoodCategory = (mood: string) => {
    const happyMoods = ['😊', '🥰', '🤩', '😎', '🥳'];
    const calmMoods = ['😌'];
    const neutralMoods = ['😐', '🤔'];
    const sadMoods = ['😕', '😢', '😓'];
    const angryMoods = ['😠', '😤'];
    const anxiousMoods = ['😰'];
    const tiredMoods = ['😴'];

    if (happyMoods.includes(mood)) return 'Happy';
    if (calmMoods.includes(mood)) return 'Calm';
    if (neutralMoods.includes(mood)) return 'Neutral';
    if (sadMoods.includes(mood)) return 'Sad';
    if (angryMoods.includes(mood)) return 'Angry';
    if (anxiousMoods.includes(mood)) return 'Anxious';
    if (tiredMoods.includes(mood)) return 'Tired';
    return 'Other';
  };

  const getWordCount = (text: string) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  const getReadingTime = (text: string) => {
    const words = getWordCount(text);
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  };

  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;
  const hasPhotos = entry.metadata?.photos && entry.metadata.photos.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-2xl">{entry.mood}</div>
              <div>
                <div className="font-medium text-gray-900">{getMoodCategory(entry.mood)}</div>
                <div className="text-sm text-gray-500">
                  {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {entry.sentiment && (
              <span className={`text-xs px-2 py-1 rounded-full border ${getSentimentColor(entry.sentiment)}`}>
                {entry.sentiment}
              </span>
            )}
            <div className="text-xs bg-lavender-100 text-lavender-800 px-2 py-1 rounded-full flex items-center">
              <Clock size={12} className="mr-1" />
              {getReadingTime(entry.content)}
            </div>
            {hasPhotos && (
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center">
                <Image size={12} className="mr-1" />
                {entry.metadata.photos.length} photo{entry.metadata.photos.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div className={`text-gray-700 whitespace-pre-wrap ${!expanded && 'line-clamp-3'}`}>
            {entry.content}
          </div>
          
          {getWordCount(entry.content) > 60 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-lavender-600 hover:text-lavender-800 text-sm font-medium mt-2 flex items-center"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp size={16} className="ml-1" />
                </>
              ) : (
                <>
                  Read more <ChevronDown size={16} className="ml-1" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Photos Preview */}
        {hasPhotos && (
          <div className="mt-4">
            <button
              onClick={() => setShowPhotos(!showPhotos)}
              className="text-lavender-600 hover:text-lavender-800 text-sm font-medium flex items-center"
            >
              {showPhotos ? (
                <>
                  Hide photos <ChevronUp size={16} className="ml-1" />
                </>
              ) : (
                <>
                  Show {entry.metadata.photos.length} photo{entry.metadata.photos.length !== 1 ? 's' : ''} <ChevronDown size={16} className="ml-1" />
                </>
              )}
            </button>
            
            <AnimatePresence>
              {showPhotos && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {entry.metadata.photos.map((photo: any) => (
                      <div key={photo.id} className="relative group">
                        <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-200">
                          <img 
                            src={photo.url} 
                            alt={photo.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mt-1 flex justify-between items-center">
                          <p className="text-xs font-medium truncate">{photo.title}</p>
                          <span className="text-xs text-gray-500 flex items-center">
                            {photo.privacy === 'private' ? (
                              <Lock size={10} className="ml-1" />
                            ) : (
                              <Globe size={10} className="ml-1" />
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.tags.map(tag => (
              <span
                key={tag}
                className="bg-lavender-50 text-lavender-700 px-2 py-0.5 rounded-full text-sm flex items-center"
              >
                <Tag size={12} className="mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Metadata Section */}
        {hasMetadata && (
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-100"
              >
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {entry.metadata.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin size={14} className="mr-1 text-gray-400" />
                      <span>{entry.metadata.location}</span>
                    </div>
                  )}
                  
                  {entry.metadata.weather && (
                    <div className="flex items-center text-gray-600">
                      <Cloud size={14} className="mr-1 text-gray-400" />
                      <span>{entry.metadata.weather}</span>
                    </div>
                  )}
                  
                  {entry.metadata.energy_level && (
                    <div className="flex items-center text-gray-600">
                      <Zap size={14} className="mr-1 text-gray-400" />
                      <span>Energy: {entry.metadata.energy_level}/10</span>
                    </div>
                  )}
                  
                  {entry.metadata.sleep_hours && (
                    <div className="flex items-center text-gray-600">
                      <Clock size={14} className="mr-1 text-gray-400" />
                      <span>Sleep: {entry.metadata.sleep_hours} hours</span>
                    </div>
                  )}
                </div>
                
                {entry.metadata.activities && entry.metadata.activities.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Activities:</div>
                    <div className="flex flex-wrap gap-1">
                      {entry.metadata.activities.map((activity: string, index: number) => (
                        <span key={index} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {getWordCount(entry.content)} words
          </div>
          
          <div className="flex space-x-2">
            {showConfirmDelete ? (
              <div className="flex items-center space-x-2 bg-red-50 p-1 rounded-lg">
                <span className="text-xs text-red-600">Delete entry?</span>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="text-white bg-red-600 hover:bg-red-700 p-1 rounded"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="text-gray-600 hover:text-gray-800 p-1 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onEdit(entry)}
                  className="text-gray-400 hover:text-lavender-600 transition-colors p-1 rounded hover:bg-lavender-50"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JournalEntry;