import React from 'react';
import { useLanguageContext } from '../../context/LanguageContext';

interface TranslatedTextProps {
  text: string;
  className?: string;
  interpolation?: Record<string, string>;
  as?: keyof JSX.IntrinsicElements;
}

const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  text, 
  className = '', 
  interpolation,
  as: Component = 'span'
}) => {
  const { translate } = useLanguageContext();
  
  const translatedText = translate(text, { interpolation });
  
  return (
    <Component className={className}>
      {translatedText}
    </Component>
  );
};

export default TranslatedText;