import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Plus,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Phone,
  MessageSquare,
  Award,
  Target,
  Clock,
  Users,
  Shield,
  Zap,
  BookOpen,
  Headphones,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import AddAddictionModal from '../components/addiction/AddAddictionModal';
import TrackingEntryModal from '../components/addiction/TrackingEntryModal';
import AddictionCard from '../components/addiction/AddictionCard';
import EmergencySupport from '../components/addiction/EmergencySupport';
import DailyTipCard from '../components/addiction/DailyTipCard';
import ProgressReminder from '../components/addiction/ProgressReminder';
import { useAddictionSupport } from '../hooks/useAddictionSupport';

const AddictionSupport = () => {
  const {
    userAddictions,
    recentTracking,
    milestones,
    dailyTip,
    isLoading,
    addUserAddiction,
    updateAddictionStatus,
    addTrackingEntry,
    getAddictionStats,
    getEmergencySupport,
    canMarkCleanDayToday
  } = useAddictionSupport();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedAddiction, setSelectedAddiction] = useState<string | null>(null);
  const [showEmergencySupport, setShowEmergencySupport] = useState(false);

  const stats = getAddictionStats();
  const emergencyResources = getEmergencySupport();

  const handleAddAddiction = async (data: any) => {
    try {
      await addUserAddiction(
        data.addictionTypeId,
        data.severityLevel,
        data.startDate,
        data.quitAttempts,
        data.personalTriggers,
        data.supportContacts
      );
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding addiction:', error);
    }
  };

  const handleTrackingEntry = async (data: any) => {
    if (!selectedAddiction) return;
    
    try {
      await addTrackingEntry(selectedAddiction, data.entry_type, data);
      setShowTrackingModal(false);
      setSelectedAddiction(null);
    } catch (error) {
      console.error('Error adding tracking entry:', error);
    }
  };

  const openTrackingModal = (addictionId: string) => {
    setSelectedAddiction(addictionId);
    setShowTrackingModal(true);
  };

  const handleMarkCleanDay = async (addictionId: string, currentDays: number) => {
    try {
      await updateAddictionStatus(addictionId, 'clean', currentDays + 1);
    } catch (error) {
      console.error('Error marking clean day:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading addiction support...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Addiction Support
            </h1>
          </motion.div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your journey to recovery is unique and brave. Track your progress, get daily tips, 
            celebrate milestones, and access support when you need it most.
          </p>
        </div>

        {/* Emergency Support Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Need Immediate Help?</h3>
                  <p className="text-sm text-red-700">Crisis support is available 24/7</p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowEmergencySupport(true)}
                className="bg-red-600 hover:bg-red-700"
                leftIcon={<Phone size={16} />}
              >
                Get Help Now
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Daily Tip Section */}
        {dailyTip && userAddictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <DailyTipCard 
              tip={dailyTip} 
              daysClean={userAddictions[0].days_clean} 
            />
          </motion.div>
        )}

        {/* Stats Overview */}
        {userAddictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="text-center">
              <div className="p-4">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalAddictions}</div>
                <div className="text-sm text-gray-600">Tracking</div>
              </div>
            </Card>
            
            <Card className="text-center">
              <div className="p-4">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.activeRecovery}</div>
                <div className="text-sm text-gray-600">In Recovery</div>
              </div>
            </Card>
            
            <Card className="text-center">
              <div className="p-4">
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalDaysClean}</div>
                <div className="text-sm text-gray-600">Total Days Clean</div>
              </div>
            </Card>
            
            <Card className="text-center">
              <div className="p-4">
                <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.longestStreak}</div>
                <div className="text-sm text-gray-600">Longest Streak</div>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Addictions */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Recovery Journey</h2>
                  <Button
                    variant="primary"
                    onClick={() => setShowAddModal(true)}
                    leftIcon={<Plus size={18} />}
                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    Track New Addiction
                  </Button>
                </div>

                {userAddictions.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Recovery Journey</h3>
                    <p className="text-gray-600 mb-6">
                      Taking the first step to track your addiction is incredibly brave. 
                      We're here to support you every step of the way.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setShowAddModal(true)}
                      leftIcon={<Plus size={18} />}
                      className="bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                      Begin Tracking
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userAddictions.map((addiction) => (
                      <AddictionCard
                        key={addiction.id}
                        addiction={addiction}
                        onTrack={() => openTrackingModal(addiction.id)}
                        onUpdateStatus={updateAddictionStatus}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Activity */}
            {recentTracking.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
                  <div className="space-y-4">
                    {recentTracking.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full ${
                          entry.entry_type === 'success' ? 'bg-green-100 text-green-600' :
                          entry.entry_type === 'craving' ? 'bg-yellow-100 text-yellow-600' :
                          entry.entry_type === 'relapse' ? 'bg-red-100 text-red-600' :
                          entry.entry_type === 'support' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {entry.entry_type === 'success' && <Award size={16} />}
                          {entry.entry_type === 'craving' && <Zap size={16} />}
                          {entry.entry_type === 'relapse' && <AlertTriangle size={16} />}
                          {entry.entry_type === 'support' && <Users size={16} />}
                          {entry.entry_type === 'milestone' && <Target size={16} />}
                          {entry.entry_type === 'trigger' && <Clock size={16} />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 capitalize">
                            {entry.entry_type.replace('_', ' ')}
                          </div>
                          {entry.notes && (
                            <div className="text-sm text-gray-600">{entry.notes}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {entry.intensity_level && (
                          <div className="text-sm font-medium text-gray-600">
                            Intensity: {entry.intensity_level}/10
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Daily Progress Reminder */}
            {userAddictions.length > 0 && (
              <ProgressReminder
                daysClean={userAddictions[0].days_clean}
                addictionName={userAddictions[0].addiction_type?.name || 'Addiction'}
                canMarkToday={canMarkCleanDayToday(userAddictions[0].id)}
                onMarkCleanDay={() => handleMarkCleanDay(userAddictions[0].id, userAddictions[0].days_clean)}
                lastMarkedDate={userAddictions[0].last_clean_day_marked}
              />
            )}

            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<MessageSquare size={16} />}
                    onClick={() => userAddictions.length > 0 && openTrackingModal(userAddictions[0].id)}
                    disabled={userAddictions.length === 0}
                  >
                    Log Craving
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Award size={16} />}
                    onClick={() => userAddictions.length > 0 && openTrackingModal(userAddictions[0].id)}
                    disabled={userAddictions.length === 0}
                  >
                    Record Success
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Users size={16} />}
                    onClick={() => setShowEmergencySupport(true)}
                  >
                    Get Support
                  </Button>
                  <Link to="/chat">
                    <Button
                      variant="primary"
                      fullWidth
                      leftIcon={<Heart size={16} />}
                      className="bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                      Talk to AI
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Milestones */}
            {milestones.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Milestones</h3>
                  <div className="space-y-3">
                    {milestones.slice(0, 3).map((milestone) => (
                      <div key={milestone.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <Award className="w-5 h-5 text-yellow-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {milestone.milestone_value} {milestone.milestone_type.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(milestone.achieved_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Recovery Tips */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Recovery Tips
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900 mb-1">Stay Hydrated</div>
                    <div className="text-blue-700">Drink plenty of water to help your body heal and reduce cravings.</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-900 mb-1">Exercise Daily</div>
                    <div className="text-green-700">Physical activity releases endorphins and reduces stress naturally.</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-900 mb-1">Practice Mindfulness</div>
                    <div className="text-purple-700">Meditation and deep breathing help manage cravings and anxiety.</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Resources */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Resources</h3>
                <div className="space-y-3">
                  <a
                    href="https://www.samhsa.gov/find-help/national-helpline"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">SAMHSA Helpline</div>
                      <div className="text-xs text-blue-700">1-800-662-4357</div>
                    </div>
                  </a>
                  
                  <a
                    href="https://www.aa.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-900">AA Meetings</div>
                      <div className="text-xs text-green-700">Find local support groups</div>
                    </div>
                  </a>
                  
                  <a
                    href="https://www.na.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-purple-900">NA Resources</div>
                      <div className="text-xs text-purple-700">Narcotics Anonymous</div>
                    </div>
                  </a>
                  
                  <button
                    onClick={() => setShowEmergencySupport(true)}
                    className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors w-full text-left"
                  >
                    <Shield className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-medium text-red-900">Crisis Support</div>
                      <div className="text-xs text-red-700">24/7 emergency help</div>
                    </div>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddAddictionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddAddiction}
      />

      <TrackingEntryModal
        isOpen={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false);
          setSelectedAddiction(null);
        }}
        onSubmit={handleTrackingEntry}
        addictionId={selectedAddiction}
      />

      <EmergencySupport
        isOpen={showEmergencySupport}
        onClose={() => setShowEmergencySupport(false)}
        resources={emergencyResources}
      />
    </div>
  );
};

export default AddictionSupport;