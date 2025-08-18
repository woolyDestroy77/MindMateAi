import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addDays,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const TherapistSchedule: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00'
  });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // Get therapist profile
      const { data: therapistProfile, error: profileError } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get availability
      const { data, error } = await supabase
        .from('therapist_availability')
        .select('*')
        .eq('therapist_id', therapistProfile.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  };

  const addAvailabilitySlot = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // Get therapist profile
      const { data: therapistProfile, error: profileError } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from('therapist_availability')
        .insert([{
          therapist_id: therapistProfile.id,
          ...newSlot,
          is_available: true
        }])
        .select()
        .single();

      if (error) throw error;

      setAvailability(prev => [...prev, data]);
      setShowAddSlot(false);
      setNewSlot({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00'
      });
      toast.success('Availability slot added');
    } catch (error) {
      console.error('Error adding availability:', error);
      toast.error('Failed to add availability slot');
    }
  };

  const deleteAvailabilitySlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('therapist_availability')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      setAvailability(prev => prev.filter(slot => slot.id !== slotId));
      toast.success('Availability slot removed');
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('Failed to remove availability slot');
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availability.filter(slot => slot.day_of_week === dayOfWeek && slot.is_available);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading schedule...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
              <p className="text-gray-600">Manage your availability and appointments</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAddSlot(true)}
              leftIcon={<Plus size={18} />}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              Add Availability
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Availability */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Weekly Availability</h2>
              
              <div className="space-y-4">
                {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                  const daySlots = getAvailabilityForDay(dayOfWeek);
                  
                  return (
                    <div key={dayOfWeek} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-900">{getDayName(dayOfWeek)}</h3>
                        <span className="text-sm text-gray-600">
                          {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {daySlots.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No availability set</p>
                      ) : (
                        <div className="space-y-2">
                          {daySlots.map(slot => (
                            <div key={slot.id} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                              <span className="text-sm text-blue-800">
                                {slot.start_time} - {slot.end_time}
                              </span>
                              <button
                                onClick={() => deleteAvailabilitySlot(slot.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Calendar View */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Calendar View</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-medium text-gray-900">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {eachDayOfInterval({
                  start: startOfMonth(currentMonth),
                  end: endOfMonth(currentMonth)
                }).map(day => {
                  const dayOfWeek = day.getDay();
                  const hasAvailability = getAvailabilityForDay(dayOfWeek).length > 0;
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[60px] p-2 border rounded ${
                        !isSameMonth(day, currentMonth)
                          ? 'bg-gray-50 text-gray-400'
                          : isToday(day)
                          ? 'bg-blue-100 border-blue-300'
                          : hasAvailability
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {format(day, 'd')}
                      </div>
                      {hasAvailability && (
                        <div className="text-xs text-green-600 mt-1">
                          Available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Add Availability Modal */}
        {showAddSlot && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Add Availability</h3>
                  <button
                    onClick={() => setShowAddSlot(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={newSlot.day_of_week}
                    onChange={(e) => setNewSlot({...newSlot, day_of_week: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map(day => (
                      <option key={day} value={day}>{getDayName(day)}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setShowAddSlot(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={addAvailabilitySlot}
                    leftIcon={<Save size={16} />}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TherapistSchedule;