import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-solid border-current border-t-transparent ${sizeClass[size]} ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
}