import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Settings, Clock, Calendar, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../ui/Button';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsModal: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    dailyReminders: true,
    journalReminders: true,
    recoveryReminders: true,
    anxietyReminders: true,
    achievementNotifications: true,
    desktopNotifications: true,
    emailNotifications: false,
    reminderTime: '20:00',
    weeklyDigest: true
  });

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('notification_settings', JSON.stringify(settings));
    onClose();
  };

  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('notification_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error parsing notification settings:', error);
      }
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-lavender-100 to-blue-100 rounded-lg">
                    <Bell className="w-6 h-6 text-lavender-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
                    <p className="text-sm text-gray-600">Customize your notification preferences</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Notification Types */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Notification Types</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Daily Reminders</p>
                          <p className="text-xs text-gray-500">Reminders for daily goals and check-ins</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('dailyReminders')}
                        className={`p-1 rounded-full ${settings.dailyReminders ? 'text-lavender-600' : 'text-gray-400'}`}
                      >
                        {settings.dailyReminders ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Journal Reminders</p>
                          <p className="text-xs text-gray-500">Reminders to write journal entries</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('journalReminders')}
                        className={`p-1 rounded-full ${settings.journalReminders ? 'text-lavender-600' : 'text-gray-400'}`}
                      >
                        {settings.journalReminders ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Heart className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Recovery Reminders</p>
                          <p className="text-xs text-gray-500">Reminders for addiction recovery tracking</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('recoveryReminders')}
                        className={`p-1 rounded-full ${settings.recoveryReminders ? 'text-lavender-600' : 'text-gray-400'}`}
                      >
                        {settings.recoveryReminders ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Brain className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Anxiety Support</p>
                          <p className="text-xs text-gray-500">Reminders for anxiety exercises and sessions</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('anxietyReminders')}
                        className={`p-1 rounded-full ${settings.anxietyReminders ? 'text-lavender-600' : 'text-gray-400'}`}
                      >
                        {settings.anxietyReminders ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Trophy className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Achievements</p>
                          <p className="text-xs text-gray-500">Notifications for milestones and achievements</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('achievementNotifications')}
                        className={`p-1 rounded-full ${settings.achievementNotifications ? 'text-lavender-600' : 'text-gray-400'}`}
                      >
                        {settings.achievementNotifications ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notification Channels */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Notification Channels</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Bell className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">In-App Notifications</p>
                          <p className="text-xs text-gray-500">Always enabled</p>
                        </div>
                      </div>
                      <div className="text-lavender-600">
                        <CheckCircle size={20} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Computer className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Desktop Notifications</p>
                          <p className="text-xs text-gray-500">Browser notifications when app is open</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('desktopNotifications')}
                        className={`p-1 rounded-full ${settings.desktopNotifications ? 'text-lavender-600' : 'text-gray-400'}`}
                      >
                        {settings.desktopNotifications ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Mail className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                          <p className="text-xs text-gray-500">Receive important notifications via email</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('emailNotifications')}
                        className={`p-1 rounded-full ${settings.emailNotifications ? 'text-lavender-600' : 'text-gray-400'}`}
                      >
                        {settings.emailNotifications ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Timing Settings */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Timing Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Daily Reminder Time
                      </label>
                      <input
                        type="time"
                        id="reminderTime"
                        value={settings.reminderTime}
                        onChange={(e) => setSettings(prev => ({ ...prev, reminderTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Set the time when you want to receive daily reminders
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Weekly Digest</p>
                          <p className="text-xs text-gray-500">Receive a weekly summary of your progress</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle('weeklyDigest')}
                        className={`p-1 rounded-full ${settings.weeklyDigest ? 'text-lavender-600' : 'text-gray-400'}`}
                      >
                        {settings.weeklyDigest ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSave}
                  className="bg-gradient-to-r from-lavender-500 to-blue-500"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationSettingsModal;