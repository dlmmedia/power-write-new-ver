import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  children,
  error,
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      <select
        className={`w-full bg-white dark:bg-gray-900/50 border ${
          error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700/60'
        } rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 transition-shadow ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};
