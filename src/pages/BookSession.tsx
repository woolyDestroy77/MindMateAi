import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  User, 
  DollarSign, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface TherapistProfile {
  id: string;
  professional_title: string;
  hourly_rate: number;
  session_types: string[];
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

const BookSession: React.FC = () => {
  const { therapistId } = useParams<{ therapistId: string }>();
  const navigate = useNavigate();
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState('individual');
  const [sessionFormat, setSessionFormat] = useState('video');
  const [duration, setDuration] = useState(60);
  const [clientNotes, setClientNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (therapistId) {
      fetchTherapist();
    }
  }, [therapistId]);

  const fetchTherapist = async () => {
    try {
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select(`
          *,
          user:users!therapist_profiles_user_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('id', therapistId)
        .eq('verification_status', 'verified')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setTherapist(data);
    } catch (error) {
      console.error('Error fetching therapist:', error);
      toast.error('Therapist not found');
      navigate('/therapists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!therapist || isBooking) return;

    try {
      setIsBooking(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Please sign in to book a session');

      console.log('🔍 BOOKING DEBUG - Starting booking process...');
      console.log('👤 Client user ID:', user.id);
      console.log('👨‍⚕️ Therapist ID:', therapist.id);
      console.log('📅 Session details:', { selectedDate, selectedTime, sessionType, sessionFormat, duration });

      // CRITICAL: Verify therapist is active and verified
      const { data: therapistCheck, error: therapistCheckError } = await supabase
        .from('therapist_profiles')
        .select('verification_status, is_active, user_id')
        .eq('id', therapist.id)
        .single();
        
      if (therapistCheckError) {
        console.error('❌ THERAPIST CHECK ERROR:', therapistCheckError);
        throw new Error('Therapist not found');
      }
      
      if (therapistCheck.verification_status !== 'verified' || !therapistCheck.is_active) {
        throw new Error('This therapist is not currently accepting new clients');
      }
      
      console.log('✅ THERAPIST VERIFIED AND ACTIVE');
      console.log('👨‍⚕️ Therapist user_id:', therapistCheck.user_id);

      // Calculate cost
      const durationHours = duration / 60;
      const totalCost = therapist.hourly_rate * durationHours;

      // Create session
      const sessionData = {
        therapist_id: therapist.id,
        client_id: user.id,
        session_type: sessionType,
        scheduled_start: new Date(`${selectedDate}T${selectedTime}`).toISOString(),
        scheduled_end: new Date(
          new Date(`${selectedDate}T${selectedTime}`).getTime() + (duration * 60 * 1000)
        ).toISOString(),
        session_format: sessionFormat,
        session_rate: therapist.hourly_rate,
        total_cost: totalCost,
        client_notes: clientNotes,
        status: 'scheduled',
        payment_status: 'pending',
        video_room_id: sessionFormat === 'video' ? `room_${Date.now()}` : null
      };

      console.log('📅 CREATING SESSION WITH DATA:', sessionData);

      const { data: session, error: sessionError } = await supabase
        .from('therapy_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (sessionError) throw sessionError;
      
      console.log('✅ SESSION CREATED SUCCESSFULLY:', session);
      console.log('🆔 Session ID:', session.id);

      // Create payment transaction with proper user_id
      console.log('💳 CREATING PAYMENT TRANSACTION...');
      const platformFee = totalCost * 0.15;
      const therapistPayout = totalCost - platformFee;
      
      const { error: paymentError } = await supabase
        .from('payment_transactions')
        .insert([{
          session_id: session.id,
          client_id: user.id,
          therapist_id: therapist.id, // This is the therapist_profiles.id
          amount: totalCost,
          currency: 'USD',
          payment_method: 'card',
          transaction_fee: 0,
          platform_fee: platformFee,
          therapist_payout: therapistPayout,
          status: 'pending'
        }]);

      if (paymentError) throw paymentError;
      
      console.log('✅ PAYMENT TRANSACTION CREATED');
      
      // Notification will be sent automatically by database trigger
      console.log('🔔 NOTIFICATION WILL BE SENT BY DATABASE TRIGGER');

      toast.success('Session booked successfully!');
      navigate('/my-therapy-sessions');
    } catch (error) {
      console.error('Error booking session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to book session');
    } finally {
      setIsBooking(false);
    }
  };

  // Generate available time slots
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  // Generate next 30 days
  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return format(date, 'yyyy-MM-dd');
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading booking form...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Therapist Not Found</h2>
            <p className="text-gray-600 mb-6">The therapist you're looking for is not available.</p>
            <Button
              variant="primary"
              onClick={() => navigate('/therapists')}
              leftIcon={<ArrowLeft size={18} />}
            >
              Back to Therapists
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/therapists')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Therapists
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Therapist Info */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mx-auto mb-4">
                    {therapist.user?.avatar_url ? (
                      <img 
                        src={therapist.user.avatar_url} 
                        alt={therapist.user.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-full h-full p-4 text-gray-400" />
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {therapist.user?.full_name}
                  </h2>
                  <p className="text-gray-600 mb-4">{therapist.professional_title}</p>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${therapist.hourly_rate}
                    </div>
                    <div className="text-sm text-gray-500">per hour</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Book a Session</h2>
                
                <form onSubmit={handleBooking} className="space-y-6">
                  {/* Session Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {therapist.session_types.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSessionType(type)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            sessionType === type
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium capitalize">{type}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Session Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Format
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSessionFormat('video')}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          sessionFormat === 'video'
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Video className="w-5 h-5 mb-2" />
                        <div className="font-medium">Video Call</div>
                        <div className="text-xs text-gray-600">Secure video session</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSessionFormat('phone')}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          sessionFormat === 'phone'
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Phone className="w-5 h-5 mb-2" />
                        <div className="font-medium">Phone Call</div>
                        <div className="text-xs text-gray-600">Audio only session</div>
                      </button>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date
                    </label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a date</option>
                      {availableDates.map((date) => (
                        <option key={date} value={date}>
                          {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {format(parseISO(`2000-01-01T${time}`), 'h:mm a')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                    </select>
                  </div>

                  {/* Client Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes for Therapist (Optional)
                    </label>
                    <textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Share any specific concerns or goals for this session..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  {/* Cost Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Session Cost</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span>${therapist.hourly_rate}/hour</span>
                      </div>
                      <div className="flex justify-between font-medium text-blue-900 border-t border-blue-200 pt-2">
                        <span>Total:</span>
                        <span>${((duration / 60) * therapist.hourly_rate).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isBooking}
                    disabled={!selectedDate || !selectedTime || isBooking}
                    leftIcon={<CheckCircle size={18} />}
                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    Book Session
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookSession;