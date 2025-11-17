import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Main container with yellow background */}
      <div className="relative w-full h-full bg-yellow-400 rounded-lg flex items-center justify-center overflow-hidden group hover:bg-yellow-500 transition-colors">
        {/* PW Text with modern styling */}
        <div className="relative z-10">
          <span className="font-bold text-black tracking-tight" style={{ fontSize: size === 'sm' ? '0.875rem' : size === 'md' ? '1.125rem' : '1.5rem' }}>
            PW
          </span>
        </div>
        
        {/* Decorative pen stroke - diagonal line suggesting writing */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-20 group-hover:opacity-30 transition-opacity" 
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Diagonal stroke representing a pen writing */}
          <path 
            d="M8 32 L32 8" 
            stroke="black" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          {/* Small dot at the end like ink */}
          <circle cx="32" cy="8" r="2" fill="black" />
        </svg>
      </div>
      
      {/* Small accent corner - adds depth */}
      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-black rounded-br-lg opacity-80" />
    </div>
  );
}

// Alternative minimal version - just text with better styling
export function LogoMinimal({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg px-2 py-0.5',
    md: 'text-2xl px-3 py-1',
    lg: 'text-3xl px-4 py-1.5'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`bg-yellow-400 text-black font-bold ${sizeClasses[size]} rounded hover:bg-yellow-500 transition-colors relative overflow-hidden group`}>
        {/* Main text */}
        <span className="relative z-10 tracking-tight">PW</span>
        
        {/* Subtle underline accent */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black opacity-20 group-hover:opacity-40 transition-opacity" />
      </div>
    </div>
  );
}

// Icon version with pen symbol
export function LogoIcon({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Yellow background circle */}
        <rect width="40" height="40" rx="8" fill="#FACC15" />
        
        {/* P letter */}
        <path 
          d="M12 28V12H18C19.6569 12 21 13.3431 21 15V17C21 18.6569 19.6569 20 18 20H12" 
          stroke="black" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* W letter */}
        <path 
          d="M22 20L24 28L26 23L28 28L30 20" 
          stroke="black" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Small pen accent */}
        <circle cx="34" cy="10" r="1.5" fill="black" />
        <line x1="32" y1="12" x2="34" y2="10" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}



