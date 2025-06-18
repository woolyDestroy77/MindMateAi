import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gift, Star, Clock, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  date: Date;
  type: 'holiday' | 'awareness';
  description?: string;
}

const UpcomingEventsCard: React.FC = () => {
  // Get upcoming special events
  const getUpcomingEvents = (): Event[] => {
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Define all special events for multiple years
    const years = [currentYear, currentYear + 1, currentYear + 2]; // Current and next two years
    
    let allEvents: Event[] = [];
    
    // Generate events for each year
    years.forEach(year => {
      const yearEvents: Event[] = [
        // Holidays
        {
          id: `christmas-${year}`,
          title: 'Christmas Day',
          date: new Date(year, 11, 25), // December 25
          type: 'holiday',
          description: 'Take time to relax and enjoy the holiday season.'
        },
        {
          id: `newyear-${year + 1}`,
          title: 'New Year\'s Day',
          date: new Date(year + 1, 0, 1), // January 1
          type: 'holiday',
          description: 'A fresh start and new beginnings.'
        },
        {
          id: `easter-${year}`,
          title: 'Easter Sunday',
          date: getEasterDate(year),
          type: 'holiday',
          description: 'A day of renewal and hope.'
        },
        {
          id: `valentine-${year}`,
          title: 'Valentine\'s Day',
          date: new Date(year, 1, 14), // February 14
          type: 'holiday',
          description: 'A day to celebrate love and connection.'
        },
        {
          id: `thanksgiving-${year}`,
          title: 'Thanksgiving',
          date: getThanksgivingDate(year),
          type: 'holiday',
          description: 'A day for gratitude and reflection.'
        },
        
        // Mental Health Awareness Days
        {
          id: `world-mental-health-day-${year}`,
          title: 'World Mental Health Day',
          date: new Date(year, 9, 10), // October 10
          type: 'awareness',
          description: 'Raising awareness about mental health issues around the world.'
        },
        {
          id: `mens-mental-health-month-${year}`,
          title: 'Men\'s Mental Health Month',
          date: new Date(year, 5, 1), // June 1
          type: 'awareness',
          description: 'Dedicated to raising awareness about mental health challenges affecting men.'
        },
        {
          id: `mental-health-awareness-month-${year}`,
          title: 'Mental Health Awareness Month',
          date: new Date(year, 4, 1), // May 1
          type: 'awareness',
          description: 'A month dedicated to raising awareness about mental health.'
        },
        {
          id: `suicide-prevention-day-${year}`,
          title: 'World Suicide Prevention Day',
          date: new Date(year, 8, 10), // September 10
          type: 'awareness',
          description: 'Raising awareness about suicide prevention.'
        },
        {
          id: `stress-awareness-day-${year}`,
          title: 'Stress Awareness Day',
          date: new Date(year, 10, 3), // First Wednesday of November
          type: 'awareness',
          description: 'Raising awareness about the impact of stress on mental health.'
        },
        {
          id: `anxiety-awareness-day-${year}`,
          title: 'National Anxiety Disorders Screening Day',
          date: new Date(year, 4, 3), // First Wednesday of May
          type: 'awareness',
          description: 'Raising awareness about anxiety disorders and available treatments.'
        }
      ];
      
      allEvents = [...allEvents, ...yearEvents];
    });
    
    // Filter for upcoming events (within the next 365 days)
    const oneYearFromNow = addDays(today, 365);
    
    return allEvents
      .filter(event => isAfter(event.date, today) && isBefore(event.date, oneYearFromNow))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4); // Get the next 4 upcoming events
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

  // Helper function to calculate Thanksgiving date (4th Thursday in November)
  function getThanksgivingDate(year: number): Date {
    const firstDay = new Date(year, 10, 1); // November 1
    const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysUntilFirstThursday = (11 - dayOfWeek) % 7; // Days until first Thursday (4 is Thursday)
    const firstThursday = new Date(year, 10, 1 + daysUntilFirstThursday);
    const fourthThursday = new Date(year, 10, 1 + daysUntilFirstThursday + 21); // Add 3 weeks
    return fourthThursday;
  }

  const upcomingEvents = getUpcomingEvents();

  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
            Upcoming Special Events
          </h3>
          <Link 
            to="/anxiety-support" 
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
            onClick={() => {
              // Set localStorage to ensure the calendar tab is active when navigating
              localStorage.setItem('puremind_anxiety_active_tab', 'calendar');
            }}
          >
            View Calendar <ChevronRight size={14} className="ml-1" />
          </Link>
        </div>
        
        <div className="space-y-2">
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg ${
                event.type === 'holiday' 
                  ? 'bg-red-50 border border-red-100' 
                  : 'bg-yellow-50 border border-yellow-100'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  event.type === 'holiday' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {event.type === 'holiday' 
                    ? <Gift size={16} className="text-red-600" />
                    : <Star size={16} className="text-yellow-600" />
                  }
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock size={12} className="mr-1" />
                      {getDaysUntil(event.date)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(event.date, 'MMMM d, yyyy')}
                  </p>
                  {event.description && (
                    <p className="text-xs text-gray-700 mt-1">{event.description}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Helper function to get "X days away" text
function getDaysUntil(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(date.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `${diffDays} days away`;
}

export default UpcomingEventsCard;