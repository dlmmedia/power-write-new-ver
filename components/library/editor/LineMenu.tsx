'use client';

import React, { useRef, useEffect } from 'react';
import { CalloutType, CALLOUT_TYPE_INFO } from './types';

interface LineMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onInsertImage: () => void;
  onInsertCitation: () => void;
  onBibliographyOpen?: () => void;
  onInsertDivider: () => void;
  onInsertQuote: () => void;
  onInsertCallout: (type: CalloutType) => void;
}

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  description: string;
  action: () => void;
  submenu?: Array<{
    id: string;
    icon: string;
    label: string;
    action: () => void;
  }>;
}

export const LineMenu: React.FC<LineMenuProps & { onMouseEnter?: () => void; onMouseLeave?: () => void }> = ({
  isOpen,
  onToggle,
  onClose,
  onInsertImage,
  onInsertCitation,
  onBibliographyOpen,
  onInsertDivider,
  onInsertQuote,
  onInsertCallout,
  onMouseEnter,
  onMouseLeave,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showCalloutSubmenu, setShowCalloutSubmenu] = React.useState(false);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
        setShowCalloutSubmenu(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        setShowCalloutSubmenu(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  const menuItems: MenuItem[] = [
    {
      id: 'image',
      icon: '🖼️',
      label: 'Image',
      description: 'Add an image',
      action: onInsertImage,
    },
    {
      id: 'citation',
      icon: '📚',
      label: 'Citation',
      description: 'Insert a citation',
      action: onInsertCitation,
    },
    ...(onBibliographyOpen ? [{
      id: 'bibliography',
      icon: '📖',
      label: 'Bibliography',
      description: 'Manage references & sources',
      action: onBibliographyOpen,
    }] : []),
    {
      id: 'divider',
      icon: '➖',
      label: 'Divider',
      description: 'Add a section divider',
      action: onInsertDivider,
    },
    {
      id: 'quote',
      icon: '💬',
      label: 'Quote',
      description: 'Add a blockquote',
      action: onInsertQuote,
    },
    {
      id: 'callout',
      icon: '📝',
      label: 'Callout',
      description: 'Add a callout box',
      action: () => setShowCalloutSubmenu(true),
      submenu: Object.entries(CALLOUT_TYPE_INFO).map(([type, info]) => ({
        id: type,
        icon: info.icon,
        label: info.label,
        action: () => {
          onInsertCallout(type as CalloutType);
          setShowCalloutSubmenu(false);
        },
      })),
    },
  ];
  
  return (
    <div
      ref={menuRef}
      className="absolute -left-12 top-0 z-20 flex items-start"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Plus button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-200 shadow-sm ${
          isOpen
            ? 'bg-yellow-400 border-yellow-500 text-black rotate-45 shadow-yellow-200 dark:shadow-yellow-900/30'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-yellow-400 hover:text-yellow-500 hover:scale-110'
        }`}
        title="Add content"
      >
        <svg
          className="w-4 h-4 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute left-9 top-0 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] animate-in fade-in slide-in-from-left-2 duration-150">
          {!showCalloutSubmenu ? (
            <>
              <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Insert
              </div>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.action();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                  {item.submenu && (
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalloutSubmenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-200 dark:border-gray-700"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Back
                </span>
              </button>
              <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Callout Type
              </div>
              {Object.entries(CALLOUT_TYPE_INFO).map(([type, info]) => (
                <button
                  key={type}
                  onClick={(e) => {
                    e.stopPropagation();
                    onInsertCallout(type as CalloutType);
                    setShowCalloutSubmenu(false);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <span className="text-lg">{info.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {info.label}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
