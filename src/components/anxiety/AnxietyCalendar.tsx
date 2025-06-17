import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, Target, Brain, Wind, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'breathing' | 'meditation' | 'cbt' | 'journal';
  duration: number;
  completed: boolean;
}

const AnxietyCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([
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
  ]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date(),
    time: '12:00',
    type: 'meditation' as 'breathing' | 'meditation' | 'cbt' | 'journal',
    duration: 10
  });

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
    setEvents([...events, event]);
    setNewEvent({
      title: '',
      date: selectedDate,
      time: '12:00',
      type: 'meditation',
      duration: 10
    });
    setShowAddEvent(false);
  };

  const toggleEventCompletion = (id: string) => {
    setEvents(events.map(event => 
      event.id === id ? { ...event, completed: !event.completed } : event
    ));
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
      default:
        return <Clock size={16} className="text-gray-600" />;
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
                    }`}
                  >
                    <div className="text-right mb-1">
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
                            'bg-green-100 text-green-800'
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
                <Card className={`border-l-4 ${
                  event.type === 'breathing' ? 'border-l-blue-500' :
                  event.type === 'meditation' ? 'border-l-purple-500' :
                  event.type === 'cbt' ? 'border-l-orange-500' :
                  'border-l-green-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        event.type === 'breathing' ? 'bg-blue-100' :
                        event.type === 'meditation' ? 'bg-purple-100' :
                        event.type === 'cbt' ? 'bg-orange-100' :
                        'bg-green-100'
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
                          <span>•</span>
                          <span>{event.duration} min</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Button
                        variant={event.completed ? "outline" : "primary"}
                        size="sm"
                        onClick={() => toggleEventCompletion(event.id)}
                        className={event.completed ? "" : "bg-gradient-to-r from-indigo-500 to-blue-500"}
                      >
                        {event.completed ? 'Completed' : 'Mark Complete'}
                      </Button>
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
    </div>
  );
};

export default AnxietyCalendar;