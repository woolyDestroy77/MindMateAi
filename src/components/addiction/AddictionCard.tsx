import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  Target,
  Clock,
  Heart,
  Shield
} from 'lucide-react';
import Button from '../ui/Button';
import { UserAddiction } from '../../hooks/useAddictionSupport';

interface AddictionCardProps {
  addiction: UserAddiction;
  onTrack: () => void;
  onUpdateStatus: (id: string, status: UserAddiction['current_status'], daysClean?: number) => Promise<void>;
}

const AddictionCard: React.FC<AddictionCardProps> = ({ addiction, onTrack, onUpdateStatus }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'bg-green-100 text-green-800 border-green-200';
      case 'recovery': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'relapse': return 'bg-red-100 text-red-800 border-red-200';
      case 'active': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clean': return <Award className="w-4 h-4" />;
      case 'recovery': return <TrendingUp className="w-4 h-4" />;
      case 'relapse': return <AlertTriangle className="w-4 h-4" />;
      case 'active': return <Clock className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (level: number) => {
    if (level <= 3) return 'text-green-600';
    if (level <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDaysClean = (days: number) => {
    if (days === 0) return 'Starting today';
    if (days === 1) return '1 day clean';
    if (days < 7) return `${days} days clean`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      return `${weeks} week${weeks > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''} clean`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return `${months} month${months > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''} clean`;
    }
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    return `${years} year${years > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''} clean`;
  };

  const calculateProgress = () => {
    // Calculate progress based on days clean and milestones
    const milestones = [1, 7, 30, 90, 180, 365]; // days
    const nextMilestone = milestones.find(m => m > addiction.days_clean) || 365;
    const previousMilestone = milestones.filter(m => m <= addiction.days_clean).pop() || 0;
    
    if (nextMilestone === previousMilestone) return 100;
    
    const progress = ((addiction.days_clean - previousMilestone) / (nextMilestone - previousMilestone)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getNextMilestone = () => {
    const milestones = [
      { days: 1, label: '1 day' },
      { days: 7, label: '1 week' },
      { days: 30, label: '1 month' },
      { days: 90, label: '3 months' },
      { days: 180, label: '6 months' },
      { days: 365, label: '1 year' }
    ];
    
    return milestones.find(m => m.days > addiction.days_clean);
  };

  const progress = calculateProgress();
  const nextMilestone = getNextMilestone();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {addiction.addiction_type?.name}
            </h3>
            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(addiction.current_status)}`}>
              {getStatusIcon(addiction.current_status)}
              <span className="capitalize">{addiction.current_status}</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Since {new Date(addiction.start_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span className={getSeverityColor(addiction.severity_level)}>
                Severity: {addiction.severity_level}/10
              </span>
            </div>
          </div>

          {/* Days Clean Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {formatDaysClean(addiction.days_clean)}
              </span>
              {nextMilestone && (
                <span className="text-xs text-gray-500">
                  Next: {nextMilestone.label} ({nextMilestone.days - addiction.days_clean} days)
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Triggers */}
          {addiction.personal_triggers.length > 0 && (
            <div className="mb-4">
              <span className="text-xs font-medium text-gray-600 mb-1 block">Personal Triggers:</span>
              <div className="flex flex-wrap gap-1">
                {addiction.personal_triggers.slice(0, 3).map((trigger) => (
                  <span
                    key={trigger}
                    className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs"
                  >
                    {trigger}
                  </span>
                ))}
                {addiction.personal_triggers.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{addiction.personal_triggers.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{addiction.quit_attempts}</div>
              <div className="text-xs text-gray-600">Previous Attempts</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{addiction.days_clean}</div>
              <div className="text-xs text-gray-600">Days Clean</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onTrack}
          leftIcon={<Heart size={16} />}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
        >
          Track Progress
        </Button>
        
        {addiction.current_status !== 'clean' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateStatus(addiction.id, 'clean', addiction.days_clean + 1)}
            leftIcon={<Award size={16} />}
          >
            Mark Clean Day
          </Button>
        )}
        
        {addiction.current_status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateStatus(addiction.id, 'recovery', 0)}
            leftIcon={<Shield size={16} />}
          >
            Start Recovery
          </Button>
        )}
      </div>

      {/* Emergency Contacts */}
      {Object.values(addiction.support_contacts).some(contact => contact) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-600 mb-2 block">Support Contacts Available</span>
          <div className="flex space-x-2">
            {Object.entries(addiction.support_contacts).map(([type, contact]) => 
              contact && (
                <a
                  key={type}
                  href={`tel:${contact}`}
                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                >
                  {type}
                </a>
              )
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AddictionCard;