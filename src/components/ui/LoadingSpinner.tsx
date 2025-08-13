import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-16 h-16',
  };

  const borderClasses = {
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const spinner = (
    <div className={`text-center ${className}`}>
      <div
        className={`${sizeClasses[size]} ${borderClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2`}
      />
      {text && (
        <p className={`text-gray-600 ${textSizes[size]}`}>{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Convenience components for common use cases
export const FullScreenSpinner: React.FC<{ text?: string }> = ({ text }) => (
  <LoadingSpinner size="lg" text={text} fullScreen />
);

export const InlineSpinner: React.FC<{ text?: string }> = ({ text }) => (
  <LoadingSpinner size="sm" text={text} />
);

export const CardSpinner: React.FC<{ text?: string }> = ({ text }) => (
  <LoadingSpinner size="md" text={text} />
); 