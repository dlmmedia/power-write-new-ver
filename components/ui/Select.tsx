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
        className={`w-full bg-gray-800 border ${
          error ? 'border-red-500' : 'border-gray-700'
        } rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
