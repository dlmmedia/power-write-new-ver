'use client';

import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: 'number' | 'locale';
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function AnimatedNumber({ 
  value, 
  duration = 1.5, 
  format = 'number',
  className = '',
  suffix = '',
  prefix = ''
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  const spring = useSpring(0, { 
    duration: duration * 1000,
    bounce: 0.1
  });
  
  const display = useTransform(spring, (current) => {
    const rounded = Math.floor(current);
    if (format === 'locale') {
      return prefix + rounded.toLocaleString() + suffix;
    }
    return prefix + rounded + suffix;
  });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return (
    <motion.span 
      ref={ref} 
      className={className}
    >
      {display}
    </motion.span>
  );
}

// Compact stat card component for library stats
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  format?: 'number' | 'locale';
  suffix?: string;
  accentColor: string;
  delay?: number;
}

export function StatCard({ 
  icon, 
  label, 
  value, 
  format = 'number',
  suffix = '',
  accentColor,
  delay = 0
}: StatCardProps) {
  const accentClasses: Record<string, string> = {
    yellow: 'hover:border-yellow-400/50 dark:hover:border-yellow-500/50',
    green: 'hover:border-green-400/50 dark:hover:border-green-500/50',
    blue: 'hover:border-blue-400/50 dark:hover:border-blue-500/50',
    purple: 'hover:border-purple-400/50 dark:hover:border-purple-500/50',
  };
  
  const iconBgClasses: Record<string, string> = {
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`
        group relative overflow-hidden
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm
        border border-gray-200/60 dark:border-gray-800/60
        rounded-xl px-4 py-3
        shadow-sm hover:shadow-md
        transition-all duration-300 ease-out
        ${accentClasses[accentColor] || accentClasses.yellow}
      `}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/50 dark:to-gray-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 p-2 rounded-lg
          ${iconBgClasses[accentColor] || iconBgClasses.yellow}
          group-hover:scale-110 transition-transform duration-300
        `}>
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">
            {label}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
            <AnimatedNumber 
              value={value} 
              format={format} 
              suffix={suffix}
              duration={1.2}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Audio stat card with extra subtitle
interface AudioStatCardProps extends StatCardProps {
  subtitle?: string;
}

export function AudioStatCard({ 
  icon, 
  label, 
  value, 
  format = 'number',
  suffix = '',
  subtitle,
  accentColor,
  delay = 0
}: AudioStatCardProps) {
  const iconBgClasses: Record<string, string> = {
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="
        group relative overflow-hidden
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm
        border border-gray-200/60 dark:border-gray-800/60
        rounded-xl px-4 py-3
        shadow-sm hover:shadow-md
        hover:border-green-400/50 dark:hover:border-green-500/50
        transition-all duration-300 ease-out
      "
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/50 dark:to-gray-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center gap-3">
        <div className={`
          flex-shrink-0 p-2 rounded-lg
          ${iconBgClasses[accentColor] || iconBgClasses.green}
          group-hover:scale-110 transition-transform duration-300
        `}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">
            {label}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
            <AnimatedNumber 
              value={value} 
              format={format} 
              suffix={suffix}
              duration={1.2}
            />
          </div>
          {subtitle && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
