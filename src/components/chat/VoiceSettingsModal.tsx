import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';
import { VoiceSettings } from '../../hooks/useTextToSpeech';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceSettings: VoiceSettings;
  voices: SpeechSynthesisVoice[];
  onUpdateSettings: (settings: Partial<VoiceSettings>) => void;
  onTestVoice: () => void;
  onResetSettings: () => void;
  isPlaying: boolean;
}

const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  voiceSettings,
  voices,
  onUpdateSettings,
  onTestVoice,
  onResetSettings,
  isPlaying
}) => {
  const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
  const femaleVoices = englishVoices.filter(voice => 
    voice.name.toLowerCase().includes('female') || 
    voice.name.toLowerCase().includes('woman') ||
    voice.name.toLowerCase().includes('samantha') ||
    voice.name.toLowerCase().includes('karen') ||
    voice.name.toLowerCase().includes('susan') ||
    voice.name.toLowerCase().includes('zira')
  );
  const maleVoices = englishVoices.filter(voice => 
    voice.name.toLowerCase().includes('male') || 
    voice.name.toLowerCase().includes('man') ||
    voice.name.toLowerCase().includes('daniel') ||
    voice.name.toLowerCase().includes('alex') ||
    voice.name.toLowerCase().includes('david')
  );

  const voiceCategories = [
    { name: 'Recommended Female Voices', voices: femaleVoices },
    { name: 'Recommended Male Voices', voices: maleVoices },
    { name: 'All English Voices', voices: englishVoices }
  ];

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
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                    <Volume2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">AI Voice Settings</h2>
                    <p className="text-sm text-gray-600">Customize how AI messages sound</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onResetSettings}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Reset to defaults"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto space-y-6">
              {/* Auto-play Setting */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Auto-play AI Responses</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Automatically speak new AI messages when they arrive
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={voiceSettings.autoPlay}
                      onChange={(e) => onUpdateSettings({ autoPlay: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Voice
                </label>
                <div className="space-y-4">
                  {voiceCategories.map((category, categoryIndex) => {
                    if (category.voices.length === 0) return null;
                    
                    return (
                      <div key={categoryIndex}>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">{category.name}</h4>
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                          {category.voices.map((voice, index) => (
                            <button
                              key={`${voice.name}-${index}`}
                              onClick={() => onUpdateSettings({ voice })}
                              className={`text-left p-3 rounded-lg border transition-all ${
                                voiceSettings.voice?.name === voice.name
                                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="font-medium text-sm">{voice.name}</div>
                              <div className="text-xs text-gray-500">
                                {voice.lang} • {voice.localService ? 'Local' : 'Network'}
                                {voiceSettings.voice?.name === voice.name && (
                                  <span className="ml-2 text-blue-600 font-medium">✓ Selected</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Voice Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Speed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speed ({voiceSettings.rate.toFixed(1)}x)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.rate}
                    onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>

                {/* Pitch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pitch ({voiceSettings.pitch.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.pitch}
                    onChange={(e) => onUpdateSettings({ pitch: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Volume */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume ({Math.round(voiceSettings.volume * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceSettings.volume}
                    onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Quiet</span>
                    <span>Loud</span>
                  </div>
                </div>
              </div>

              {/* Test Voice */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Test Voice</h4>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onTestVoice}
                    leftIcon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    disabled={!voiceSettings.voice}
                  >
                    {isPlaying ? 'Stop Test' : 'Test Voice'}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  "Hello! I'm your AI wellness companion. I'm here to support your mental health journey 
                  with personalized insights and encouragement. How are you feeling today?"
                </p>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ rate: 0.8, pitch: 1.1, volume: 0.8 })}
                    className="p-3 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-pink-800">Gentle</div>
                    <div className="text-xs text-pink-600">Slow & Soft</div>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ rate: 1.0, pitch: 1.0, volume: 0.8 })}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-blue-800">Natural</div>
                    <div className="text-xs text-blue-600">Balanced</div>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ rate: 1.2, pitch: 0.9, volume: 0.9 })}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-green-800">Energetic</div>
                    <div className="text-xs text-green-600">Fast & Clear</div>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ rate: 0.9, pitch: 0.8, volume: 0.9 })}
                    className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-purple-800">Calm</div>
                    <div className="text-xs text-purple-600">Deep & Slow</div>
                  </button>
                </div>
              </div>

              {/* Settings Persistence Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings Saved Automatically
                </h4>
                <div className="text-sm text-green-800 space-y-1">
                  <div>• Your voice preferences are saved locally</div>
                  <div>• Settings will be restored when you return</div>
                  <div>• Current voice: {voiceSettings.voice?.name || 'None selected'}</div>
                  <div>• Auto-play: {voiceSettings.autoPlay ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>

              {/* Browser Support Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Voice Support Information</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>• Available voices: {voices.length}</div>
                  <div>• English voices: {englishVoices.length}</div>
                  <div className="text-xs text-blue-600 mt-2">
                    Voice quality and availability depend on your operating system and browser.
                    For the best experience, use Chrome, Safari, or Edge.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onResetSettings}
                  leftIcon={<RotateCcw size={16} />}
                >
                  Reset Defaults
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={onClose}
                  leftIcon={<Settings size={18} />}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Save & Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceSettingsModal;