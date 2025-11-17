'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, PenTool, Menu } from 'lucide-react';

interface BottomNavProps {
  onMenuClick: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
      active: pathname === '/',
    },
    {
      id: 'studio',
      label: 'Studio',
      icon: PenTool,
      path: '/studio',
      active: pathname === '/studio',
    },
    {
      id: 'library',
      label: 'Library',
      icon: BookOpen,
      path: '/library',
      active: pathname.startsWith('/library'),
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
      path: '#',
      active: false,
      onClick: onMenuClick,
    },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.onClick) {
      item.onClick();
    } else {
      router.push(item.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                item.active
                  ? 'text-yellow-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={24} strokeWidth={item.active ? 2.5 : 2} />
              <span className={`text-xs ${item.active ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}



