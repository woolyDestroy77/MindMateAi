import React from 'react';

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  padding = 'md',
  onClick,
}) => {
  const baseStyles = 'rounded-xl transition-all duration-300 overflow-hidden';
  
  const variantStyles = {
    default: 'bg-white',
    elevated: 'bg-white shadow-md hover:shadow-lg',
    outlined: 'bg-white border border-gray-200',
  };
  
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  };
  
  const clickableStyles = onClick ? 'cursor-pointer hover:transform hover:scale-[1.01]' : '';
  
  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;