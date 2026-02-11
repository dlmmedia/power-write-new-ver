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
        className={`w-full bg-white dark:bg-gray-900/50 border ${
          error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700/60'
        } rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 resize-vertical transition-shadow ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};
