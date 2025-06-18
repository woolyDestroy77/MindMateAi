import React, { useState } from 'react';
import { Plus, Calendar, BarChart2, Tag, Search, Filter, SortDesc, SortAsc, Smile, Clock, Zap, Award, BookOpen, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import JournalEntryModal from '../components/journal/JournalEntryModal';
import JournalEntry from '../components/journal/JournalEntry';
import { useJournal, JournalEntry as JournalEntryType } from '../hooks/useJournal';

const Journal = () => {
  const { entries, stats, isLoading, addEntry, updateEntry, deleteEntry, getJournalInsights } = useJournal();
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntryType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showStats, setShowStats] = useState(false);

  const insights = getJournalInsights();

  const handleSubmit = async (content: string, mood: string, tags: string[], metadata: any) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, { content, mood, tags, metadata });
      setEditingEntry(null);
    } else {
      await addEntry(content, mood, tags, metadata);
    }
    setShowEntryModal(false);
  };

  const handleEdit = (entry: JournalEntryType) => {
    setEditingEntry(entry);
    setShowEntryModal(true);
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
  };

  // Filter and sort entries
  const filteredEntries = entries
    .filter(entry => {
      // Search term filter
      if (searchTerm && !entry.content.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      // Tag filter
      if (filterTag && !entry.tags.includes(filterTag)) {
        return false;
      }
      
      // Mood filter
      if (filterMood && entry.mood !== filterMood) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by date
      if (sortOrder === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });

  // Get all unique tags
  const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags)));
  
  // Get all unique moods
  const allMoods = Array.from(new Set(entries.map(entry => entry.mood)));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Journal</h1>
            <p className="text-gray-600">Record your thoughts, track your moods, and reflect on your journey</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowStats(!showStats)}
              leftIcon={<BarChart2 size={18} />}
            >
              {showStats ? 'Hide Stats' : 'View Stats'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditingEntry(null);
                setShowEntryModal(true);
              }}
              leftIcon={<Plus size={18} />}
            >
              New Entry
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <Card className="bg-gradient-to-r from-lavender-50 to-sage-50 border border-lavender-200">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Journal Insights</h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-500">Total Entries</div>
                        <BookOpen size={18} className="text-lavender-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalEntries}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-500">Writing Streak</div>
                        <Zap size={18} className="text-orange-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.streakDays} days</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-500">Total Words</div>
                        <Award size={18} className="text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.wordCount}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-500">Avg. Words/Entry</div>
                        <BarChart2 size={18} className="text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.averageWordsPerEntry}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mood Distribution */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Smile size={16} className="mr-2 text-yellow-500" />
                        Mood Distribution
                      </h3>
                      <div className="space-y-2">
                        {stats.moodDistribution.slice(0, 5).map(({ mood, count }) => (
                          <div key={mood} className="flex items-center">
                            <div className="w-8 text-center">{mood}</div>
                            <div className="flex-1 mx-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-lavender-500 to-sage-500 h-2.5 rounded-full" 
                                  style={{ width: `${(count / stats.totalEntries) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 w-8 text-right">{count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Top Tags */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Tag size={16} className="mr-2 text-blue-500" />
                        Most Used Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {stats.mostUsedTags.map(({ tag, count }) => (
                          <div 
                            key={tag} 
                            className="bg-lavender-100 text-lavender-800 px-2 py-1 rounded-full text-xs flex items-center"
                            title={`Used ${count} times`}
                          >
                            {tag}
                            <span className="ml-1 bg-lavender-200 text-lavender-800 rounded-full px-1.5 text-xs">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Insights */}
                  {insights.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Lightbulb size={16} className="mr-2 text-yellow-500" />
                        Journal Insights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {insights.map((insight, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xl">{insight.icon}</span>
                              <h4 className="font-medium text-gray-900">{insight.title}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{insight.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Search */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Tag Filter */}
              <div className="relative">
                <select
                  value={filterTag || ''}
                  onChange={(e) => setFilterTag(e.target.value || null)}
                  className="appearance-none pl-8 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent bg-white"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <Tag size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Filter size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* Mood Filter */}
              <div className="relative">
                <select
                  value={filterMood || ''}
                  onChange={(e) => setFilterMood(e.target.value || null)}
                  className="appearance-none pl-8 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent bg-white"
                >
                  <option value="">All Moods</option>
                  {allMoods.map(mood => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
                <Smile size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Filter size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'newest' ? (
                  <>
                    <SortDesc size={16} className="text-gray-500" />
                    <span className="text-sm">Newest</span>
                  </>
                ) : (
                  <>
                    <SortAsc size={16} className="text-gray-500" />
                    <span className="text-sm">Oldest</span>
                  </>
                )}
              </button>
              
              {/* Clear Filters */}
              {(searchTerm || filterTag || filterMood) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterTag(null);
                    setFilterMood(null);
                  }}
                  className="text-sm text-lavender-600 hover:text-lavender-800 px-3 py-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(searchTerm || filterTag || filterMood) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {searchTerm && (
                <div className="bg-lavender-50 text-lavender-800 px-2 py-1 rounded-full text-xs flex items-center">
                  <Search size={12} className="mr-1" />
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 text-lavender-600 hover:text-lavender-800"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {filterTag && (
                <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center">
                  <Tag size={12} className="mr-1" />
                  Tag: {filterTag}
                  <button
                    onClick={() => setFilterTag(null)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {filterMood && (
                <div className="bg-yellow-50 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
                  <Smile size={12} className="mr-1" />
                  Mood: {filterMood}
                  <button
                    onClick={() => setFilterMood(null)}
                    className="ml-1 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <div className="text-xs text-gray-500 ml-auto">
                Showing {filteredEntries.length} of {entries.length} entries
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your journal entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              {entries.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
                  <p className="text-gray-600 mb-4">Start journaling to track your emotional journey.</p>
                  <Button
                    variant="primary"
                    onClick={() => setShowEntryModal(true)}
                    leftIcon={<Plus size={20} />}
                  >
                    Create Your First Entry
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No matching entries</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filters.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterTag(null);
                      setFilterMood(null);
                    }}
                  >
                    Clear All Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Group entries by date */}
              {(() => {
                const groupedEntries: {[key: string]: JournalEntryType[]} = {};
                
                filteredEntries.forEach(entry => {
                  const date = new Date(entry.created_at).toLocaleDateString();
                  if (!groupedEntries[date]) {
                    groupedEntries[date] = [];
                  }
                  groupedEntries[date].push(entry);
                });
                
                return Object.entries(groupedEntries).map(([date, dateEntries]) => (
                  <div key={date}>
                    <div className="sticky top-16 z-10 bg-gray-50 py-2 mb-3">
                      <div className="flex items-center">
                        <Calendar size={16} className="text-lavender-600 mr-2" />
                        <h2 className="text-sm font-medium text-gray-700">{date}</h2>
                        <div className="ml-2 text-xs text-gray-500">
                          {dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <AnimatePresence>
                        {dateEntries.map(entry => (
                          <JournalEntry
                            key={entry.id}
                            entry={entry}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ));
              })()}
            </>
          )}
        </div>
      </main>

      <JournalEntryModal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          setEditingEntry(null);
        }}
        onSubmit={handleSubmit}
        initialContent={editingEntry?.content}
        initialMood={editingEntry?.mood}
        initialTags={editingEntry?.tags}
        initialMetadata={editingEntry?.metadata}
      />
    </div>
  );
};

export default Journal;