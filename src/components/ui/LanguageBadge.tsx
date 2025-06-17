import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguageContext } from '../../context/LanguageContext';

interface LanguageBadgeProps {
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LanguageBadge: React.FC<LanguageBadgeProps> = ({ 
  showName = true, 
  size = 'md',
  className = ''
}) => {
  const { currentLanguage, getLanguageDetails } = useLanguageContext();
  
  const langDetails = getLanguageDetails(currentLanguage);
  
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-3'
  };
  
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };
  
  return (
    <div className={`inline-flex items-center space-x-1 bg-lavender-50 border border-lavender-200 rounded-full ${sizeClasses[size]} ${className}`}>
      <Globe size={iconSizes[size]} className="text-lavender-600" />
      <span className="text-lavender-700">{langDetails.flag}</span>
      {showName && (
        <span className="font-medium text-lavender-800">{langDetails.name}</span>
      )}
    </div>
  );
};

export default LanguageBadge;