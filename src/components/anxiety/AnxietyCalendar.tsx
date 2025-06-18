import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, Target, Brain, Wind, X, Heart, Star, Gift, Sparkles } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'breathing' | 'meditation' | 'cbt' | 'journal' | 'holiday' | 'awareness';
  duration: number;
  completed: boolean;
  description?: string;
}

const AnxietyCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date(),
    time: '12:00',
    type: 'meditation' as 'breathing' | 'meditation' | 'cbt' | 'journal' | 'holiday' | 'awareness',
    duration: 10,
    description: ''
  });

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('anxietyCalendarEvents');
    if (savedEvents) {
      try {
        // Parse the saved events and convert date strings back to Date objects
        const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }));
        setEvents(parsedEvents);
      } catch (error) {
        console.error('Error loading saved events:', error);
      }
    } else {
      // Initialize with default events if no saved events exist
      const defaultEvents = getDefaultEvents();
      setEvents(defaultEvents);
      // Save default events to localStorage
      saveEventsToLocalStorage(defaultEvents);
    }
  }, []);

  // Save events to localStorage whenever they change
  const saveEventsToLocalStorage = (eventsToSave: CalendarEvent[]) => {
    try {
      localStorage.setItem('anxietyCalendarEvents', JSON.stringify(eventsToSave));
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
    }
  };

  // Generate special events and holidays
  const getDefaultEvents = (): CalendarEvent[] => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    const specialEvents: CalendarEvent[] = [
      // Holidays
      {
        id: `christmas-${currentYear}`,
        title: 'Christmas Day',
        date: new Date(currentYear, 11, 25), // December 25
        time: 'All day',
        type: 'holiday',
        duration: 0,
        completed: false,
        description: 'Take time to relax and enjoy the holiday season.'
      },
      {
        id: `newyear-${nextYear}`,
        title: 'New Year\'s Day',
        date: new Date(nextYear, 0, 1), // January 1
        time: 'All day',
        type: 'holiday',
        duration: 0,
        completed: false,
        description: 'A fresh start and new beginnings.'
      },
      {
        id: `easter-${currentYear}`,
        title: 'Easter Sunday',
        date: getEasterDate(currentYear),
        time: 'All day',
        type: 'holiday',
        duration: 0,
        completed: false,
        description: 'A day of renewal and hope.'
      },
      {
        id: `valentine-${currentYear}`,
        title: 'Valentine\'s Day',
        date: new Date(currentYear, 1, 14), // February 14
        time: 'All day',
        type: 'holiday',
        duration: 0,
        completed: false,
        description: 'A day to celebrate love and connection.'
      },
      
      // Mental Health Awareness Days
      {
        id: `world-mental-health-day-${currentYear}`,
        title: 'World Mental Health Day',
        date: new Date(currentYear, 9, 10), // October 10
        time: 'All day',
        type: 'awareness',
        duration: 0,
        completed: false,
        description: 'Raising awareness about mental health issues around the world.'
      },
      {
        id: `mens-mental-health-month-${currentYear}`,
        title: 'Men\'s Mental Health Month',
        date: new Date(currentYear, 5, 1), // June 1
        time: 'All month',
        type: 'awareness',
        duration: 0,
        completed: false,
        description: 'Dedicated to raising awareness about mental health challenges affecting men.'
      },
      {
        id: `mental-health-awareness-month-${currentYear}`,
        title: 'Mental Health Awareness Month',
        date: new Date(currentYear, 4, 1), // May 1
        time: 'All month',
        type: 'awareness',
        duration: 0,
        completed: false,
        description: 'A month dedicated to raising awareness about mental health.'
      },
      {
        id: `suicide-prevention-day-${currentYear}`,
        title: 'World Suicide Prevention Day',
        date: new Date(currentYear, 8, 10), // September 10
        time: 'All day',
        type: 'awareness',
        duration: 0,
        completed: false,
        description: 'Raising awareness about suicide prevention.'
      },
      {
        id: `stress-awareness-day-${currentYear}`,
        title: 'Stress Awareness Day',
        date: new Date(currentYear, 10, 3), // First Wednesday of November
        time: 'All day',
        type: 'awareness',
        duration: 0,
        completed: false,
        description: 'Raising awareness about the impact of stress on mental health.'
      },
      {
        id: `anxiety-awareness-day-${currentYear}`,
        title: 'National Anxiety Disorders Screening Day',
        date: new Date(currentYear, 4, 3), // First Wednesday of May
        time: 'All day',
        type: 'awareness',
        duration: 0,
        completed: false,
        description: 'Raising awareness about anxiety disorders and available treatments.'
      }
    ];
    
    // Add some default personal events
    const personalEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Morning Meditation',
        date: new Date(),
        time: '08:00',
        type: 'meditation',
        duration: 10,
        completed: false
      },
      {
        id: '2',
        title: 'Breathing Exercise',
        date: new Date(),
        time: '12:30',
        type: 'breathing',
        duration: 5,
        completed: true
      },
      {
        id: '3',
        title: 'CBT Worksheet',
        date: new Date(new Date().setDate(new Date().getDate() + 1)),
        time: '18:00',
        type: 'cbt',
        duration: 15,
        completed: false
      }
    ];
    
    return [...specialEvents, ...personalEvents];
  };

  // Helper function to calculate Easter date (Butcher's algorithm)
  function getEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleAddEvent = () => {
    const event: CalendarEvent = {
      id: Date.now().toString(),
      ...newEvent,
      completed: false
    };
    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    saveEventsToLocalStorage(updatedEvents);
    
    setNewEvent({
      title: '',
      date: selectedDate,
      time: '12:00',
      type: 'meditation',
      duration: 10,
      description: ''
    });
    setShowAddEvent(false);
  };

  const toggleEventCompletion = (id: string) => {
    const updatedEvents = events.map(event => 
      event.id === id ? { ...event, completed: !event.completed } : event
    );
    setEvents(updatedEvents);
    saveEventsToLocalStorage(updatedEvents);
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(day, event.date));
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'breathing':
        return <Wind size={16} className="text-blue-600" />;
      case 'meditation':
        return <Brain size={16} className="text-purple-600" />;
      case 'cbt':
        return <Target size={16} className="text-orange-600" />;
      case 'journal':
        return <Calendar size={16} className="text-green-600" />;
      case 'holiday':
        return <Gift size={16} className="text-red-600" />;
      case 'awareness':
        return <Sparkles size={16} className="text-yellow-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'breathing':
        return 'bg-blue-100 text-blue-800 border-l-blue-500';
      case 'meditation':
        return 'bg-purple-100 text-purple-800 border-l-purple-500';
      case 'cbt':
        return 'bg-orange-100 text-orange-800 border-l-orange-500';
      case 'journal':
        return 'bg-green-100 text-green-800 border-l-green-500';
      case 'holiday':
        return 'bg-red-100 text-red-800 border-l-red-500';
      case 'awareness':
        return 'bg-yellow-100 text-yellow-800 border-l-yellow-500';
      default:
        return 'bg-gray-100 text-gray-800 border-l-gray-500';
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Anxiety Management Schedule</h2>
        <Button
          variant="primary"
          onClick={() => setShowAddEvent(true)}
          leftIcon={<Plus size={18} />}
          className="bg-gradient-to-r from-indigo-500 to-blue-500"
        >
          Schedule Session
        </Button>
      </div>

      <Card>
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div>
            {/* Days of Week */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {dateRange.map((day, i) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);
                
                // Check if day has special events
                const hasHoliday = dayEvents.some(event => event.type === 'holiday');
                const hasAwareness = dayEvents.some(event => event.type === 'awareness');

                return (
                  <button
                    key={i}
                    onClick={() => onDateClick(day)}
                    className={`min-h-[80px] p-1 border rounded-lg transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : isCurrentDay
                        ? 'border-blue-300 bg-blue-50/50'
                        : isCurrentMonth
                        ? 'border-gray-200 hover:bg-gray-50'
                        : 'border-gray-100 text-gray-400 bg-gray-50/50'
                    } ${hasHoliday ? 'border-red-200' : ''} ${hasAwareness ? 'border-yellow-200' : ''}`}
                  >
                    <div className="text-right mb-1 flex justify-between items-center">
                      <div className="flex space-x-1">
                        {hasHoliday && <Gift size={12} className="text-red-500" />}
                        {hasAwareness && <Star size={12} className="text-yellow-500" />}
                      </div>
                      <span className={`text-sm ${
                        isCurrentDay ? 'font-bold text-blue-600' : ''
                      }`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded truncate text-left ${
                            event.type === 'breathing' ? 'bg-blue-100 text-blue-800' :
                            event.type === 'meditation' ? 'bg-purple-100 text-purple-800' :
                            event.type === 'cbt' ? 'bg-orange-100 text-orange-800' :
                            event.type === 'journal' ? 'bg-green-100 text-green-800' :
                            event.type === 'holiday' ? 'bg-red-100 text-red-800' :
                            event.type === 'awareness' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          } ${event.completed ? 'line-through opacity-60' : ''}`}
                        >
                          {event.time} {event.title.substring(0, 10)}
                          {event.title.length > 10 ? '...' : ''}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 text-left px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Selected Day Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            Events for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <div className="text-sm text-gray-600">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
          </div>
        </div>

        <div className="space-y-3">
          {getEventsForDay(selectedDate).length === 0 ? (
            <Card className="text-center py-6">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No events scheduled for this day</p>
            </Card>
          ) : (
            getEventsForDay(selectedDate).map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`border-l-4 ${getEventTypeColor(event.type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        event.type === 'breathing' ? 'bg-blue-100' :
                        event.type === 'meditation' ? 'bg-purple-100' :
                        event.type === 'cbt' ? 'bg-orange-100' :
                        event.type === 'journal' ? 'bg-green-100' :
                        event.type === 'holiday' ? 'bg-red-100' :
                        event.type === 'awareness' ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}>
                        {getEventTypeIcon(event.type)}
                      </div>
                      <div>
                        <h4 className={`font-medium ${event.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {event.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock size={14} />
                          <span>{event.time}</span>
                          {event.duration > 0 && (
                            <>
                              <span>•</span>
                              <span>{event.duration} min</span>
                            </>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {(event.type !== 'holiday' && event.type !== 'awareness') && (
                        <Button
                          variant={event.completed ? "outline" : "primary"}
                          size="sm"
                          onClick={() => toggleEventCompletion(event.id)}
                          className={event.completed ? "" : "bg-gradient-to-r from-indigo-500 to-blue-500"}
                        >
                          {event.completed ? 'Completed' : 'Mark Complete'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Schedule New Session</h3>
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="e.g., Morning Meditation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="meditation">Meditation</option>
                  <option value="breathing">Breathing Exercise</option>
                  <option value="cbt">CBT Worksheet</option>
                  <option value="journal">Journal Entry</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={format(newEvent.date, 'yyyy-MM-dd')}
                    onChange={(e) => setNewEvent({...newEvent, date: new Date(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={newEvent.duration}
                  onChange={(e) => setNewEvent({...newEvent, duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Add any notes or details about this event..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowAddEvent(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleAddEvent}
                  disabled={!newEvent.title}
                  className="bg-gradient-to-r from-indigo-500 to-blue-500"
                >
                  Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Legend */}
      <Card className="bg-gray-50">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Calendar Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-100 rounded">
                <Wind size={14} className="text-blue-600" />
              </div>
              <span className="text-sm text-gray-700">Breathing Exercises</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-purple-100 rounded">
                <Brain size={14} className="text-purple-600" />
              </div>
              <span className="text-sm text-gray-700">Meditation Sessions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-orange-100 rounded">
                <Target size={14} className="text-orange-600" />
              </div>
              <span className="text-sm text-gray-700">CBT Worksheets</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-green-100 rounded">
                <Calendar size={14} className="text-green-600" />
              </div>
              <span className="text-sm text-gray-700">Journal Entries</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-red-100 rounded">
                <Gift size={14} className="text-red-600" />
              </div>
              <span className="text-sm text-gray-700">Holidays</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-yellow-100 rounded">
                <Star size={14} className="text-yellow-600" />
              </div>
              <span className="text-sm text-gray-700">Awareness Days</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnxietyCalendar;