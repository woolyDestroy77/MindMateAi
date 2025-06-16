import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Award, Eye, ArrowRight } from 'lucide-react';
import { MoodInsight } from '../../hooks/useMoodTrends';

interface InsightsPanelProps {
  insights: MoodInsight[];
  isLoading: boolean;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, isLoading }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement':
        return <TrendingUp className="w-5 h-5" />;
      case 'concern':
        return <AlertCircle className="w-5 h-5" />;
      case 'achievement':
        return <Award className="w-5 h-5" />;
      case 'pattern':
        return <Eye className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Yet</h3>
        <p className="text-gray-600 text-sm">
          Keep tracking your mood to unlock personalized insights about your wellness journey.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`p-4 rounded-lg border-l-4 ${
            insight.type === 'improvement' ? 'border-green-500 bg-green-50' :
            insight.type === 'concern' ? 'border-blue-500 bg-blue-50' :
            insight.type === 'achievement' ? 'border-yellow-500 bg-yellow-50' :
            'border-purple-500 bg-purple-50'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 p-2 rounded-lg ${insight.color}`}>
              {getInsightIcon(insight.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
                <span className="text-lg">{insight.icon}</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
              {insight.actionable && (
                <div className="flex items-center space-x-2 text-xs text-gray-600 bg-white/50 rounded-md p-2">
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <span className="italic">{insight.actionable}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default InsightsPanel;