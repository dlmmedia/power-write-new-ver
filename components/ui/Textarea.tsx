import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  error,
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      <textarea
        className={`w-full bg-white dark:bg-gray-800 border ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        } rounded px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-vertical transition-colors ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
